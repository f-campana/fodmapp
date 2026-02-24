from __future__ import annotations

import re
import unicodedata
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Tuple

from app import sql
from app.config import Settings
from app.db import Database
from app.errors import invalid_barcode, not_found, provider_unavailable
from app.providers.open_food_facts import OpenFoodFactsClient

_TOKEN_RE = re.compile(r"[a-z0-9]+")


class BarcodeService:
    HEURISTIC_VERSION = "v1"

    def __init__(
        self,
        db: Database,
        settings: Settings,
        provider_client: OpenFoodFactsClient,
    ) -> None:
        self._db = db
        self._settings = settings
        self._provider = provider_client

    def lookup(self, query_code: str) -> dict[str, Any]:
        normalized_code, canonical_format = normalize_retail_barcode(query_code)
        now = datetime.now(timezone.utc)

        with self._db.readonly_connection() as conn:
            cache_row = sql.fetch_one(conn, sql.SQL_GET_BARCODE_CACHE, {"normalized_code": normalized_code})

        had_cache = cache_row is not None
        cache_status = "miss"
        is_fresh = False
        if cache_row is not None and cache_row.get("expires_at") is not None:
            expires_at = cache_row["expires_at"]
            is_fresh = bool(expires_at > now and cache_row.get("provider_status") in {"found", "not_found"})

        if is_fresh:
            cache_status = "fresh"
        else:
            fetch_result = self._provider.fetch_product(normalized_code)
            if fetch_result.provider_status == "error":
                if cache_row is None:
                    raise provider_unavailable("Barcode provider unavailable")
                cache_status = "stale"
            else:
                expires_at = fetch_result.fetched_at + timedelta(hours=self._settings.barcode_cache_ttl_hours)
                with self._db.writable_connection() as conn:
                    cache_row = sql.fetch_one(
                        conn,
                        sql.SQL_UPSERT_BARCODE_CACHE,
                        {
                            "normalized_code": normalized_code,
                            "canonical_format": canonical_format,
                            "provider_slug": "open_food_facts",
                            "provider_status": fetch_result.provider_status,
                            "provider_payload": fetch_result.payload,
                            "source_code": fetch_result.source_code,
                            "product_name_fr": fetch_result.product_name_fr,
                            "product_name_en": fetch_result.product_name_en,
                            "brand": fetch_result.brand,
                            "ingredients_text_fr": fetch_result.ingredients_text_fr,
                            "categories_tags": fetch_result.categories_tags,
                            "countries_tags": fetch_result.countries_tags,
                            "fetched_at": fetch_result.fetched_at,
                            "expires_at": expires_at,
                            "last_error_code": fetch_result.last_error_code,
                            "last_error_at": None,
                        },
                    )
                cache_status = "miss" if not had_cache else "fresh"

        if cache_row is None:
            raise provider_unavailable("Barcode provider unavailable")

        product = _cache_to_product(cache_row)
        provider_last_synced_at = cache_row.get("fetched_at")

        with self._db.readonly_connection() as conn:
            link_row = sql.fetch_one(conn, sql.SQL_GET_BARCODE_LINK, {"normalized_code": normalized_code})

        resolved_food: Optional[dict[str, Any]] = None
        candidates: list[dict[str, Any]] = []

        if link_row is not None and link_row.get("link_method") == "manual":
            resolved_food = _link_row_to_food(link_row)
        elif product is not None:
            candidates = self._score_candidates(product)
            accepted = self._select_accepted_candidate(candidates)
            if accepted is not None:
                resolved_food = {
                    "food_slug": accepted["food_slug"],
                    "canonical_name_fr": accepted["canonical_name_fr"],
                    "canonical_name_en": accepted["canonical_name_en"],
                    "link_method": "heuristic",
                    "confidence": accepted["score"],
                }
                with self._db.writable_connection() as conn:
                    conn.execute(
                        sql.SQL_UPSERT_HEURISTIC_BARCODE_LINK,
                        {
                            "normalized_code": normalized_code,
                            "food_id": accepted["food_id"],
                            "confidence": accepted["score"],
                            "heuristic_version": self.HEURISTIC_VERSION,
                            "signals_json": accepted["signal_breakdown"],
                            "actor": "barcode_service",
                        },
                    )
                    conn.execute(
                        sql.SQL_INSERT_BARCODE_LINK_EVENT,
                        {
                            "normalized_code": normalized_code,
                            "event_type": "set_heuristic",
                            "food_id": accepted["food_id"],
                            "actor": "barcode_service",
                            "payload": {
                                "confidence": accepted["score"],
                                "heuristic_version": self.HEURISTIC_VERSION,
                                "signal_breakdown": accepted["signal_breakdown"],
                            },
                        },
                    )
            elif link_row is not None and link_row.get("link_method") == "heuristic":
                resolved_food = _link_row_to_food(link_row)
        elif link_row is not None and link_row.get("link_method") == "heuristic":
            resolved_food = _link_row_to_food(link_row)

        resolution_status = "resolved" if resolved_food is not None else "unresolved"
        public_candidates = [
            {
                "food_slug": candidate["food_slug"],
                "canonical_name_fr": candidate["canonical_name_fr"],
                "canonical_name_en": candidate["canonical_name_en"],
                "score": candidate["score"],
                "signal_breakdown": candidate["signal_breakdown"],
            }
            for candidate in candidates
        ]

        return {
            "query_code": query_code,
            "normalized_code": normalized_code,
            "canonical_format": canonical_format,
            "resolution_status": resolution_status,
            "cache_status": cache_status,
            "product": product,
            "resolved_food": resolved_food,
            "candidates": public_candidates,
            "provider": "open_food_facts",
            "provider_last_synced_at": provider_last_synced_at,
        }

    def set_manual_link(self, query_code: str, food_slug: str, actor: str) -> dict[str, Any]:
        normalized_code, canonical_format = normalize_retail_barcode(query_code)
        with self._db.writable_connection() as conn:
            food = sql.fetch_one(conn, sql.SQL_GET_FOOD_BY_SLUG, {"food_slug": food_slug})
            if food is None:
                raise not_found("Food not found")

            conn.execute(
                sql.SQL_UPSERT_MANUAL_BARCODE_LINK,
                {
                    "normalized_code": normalized_code,
                    "food_id": food["food_id"],
                    "actor": actor,
                },
            )
            conn.execute(
                sql.SQL_INSERT_BARCODE_LINK_EVENT,
                {
                    "normalized_code": normalized_code,
                    "event_type": "set_manual",
                    "food_id": food["food_id"],
                    "actor": actor,
                    "payload": {"food_slug": food_slug},
                },
            )

        return {
            "normalized_code": normalized_code,
            "canonical_format": canonical_format,
            "action": "set_manual",
            "food_slug": food_slug,
        }

    def clear_manual_link(self, query_code: str, actor: str) -> dict[str, Any]:
        normalized_code, canonical_format = normalize_retail_barcode(query_code)
        removed = False
        with self._db.writable_connection() as conn:
            existing = sql.fetch_one(conn, sql.SQL_GET_BARCODE_LINK, {"normalized_code": normalized_code})
            cur = conn.execute(sql.SQL_DELETE_MANUAL_BARCODE_LINK, {"normalized_code": normalized_code})
            removed = cur.rowcount > 0
            if removed:
                conn.execute(
                    sql.SQL_INSERT_BARCODE_LINK_EVENT,
                    {
                        "normalized_code": normalized_code,
                        "event_type": "clear_manual",
                        "food_id": existing["food_id"] if existing is not None else None,
                        "actor": actor,
                        "payload": {"removed": True},
                    },
                )

        return {
            "normalized_code": normalized_code,
            "canonical_format": canonical_format,
            "action": "clear_manual",
            "food_slug": None,
            "removed": removed,
        }

    def _score_candidates(self, product: dict[str, Any]) -> list[dict[str, Any]]:
        with self._db.readonly_connection() as conn:
            foods = sql.fetch_all(conn, sql.SQL_LIST_HEURISTIC_FOOD_CANDIDATES, {})

        product_name_tokens = _tokenize(
            " ".join(
                [
                    product.get("product_name_fr") or "",
                    product.get("product_name_en") or "",
                    product.get("brand") or "",
                ]
            )
        )
        ingredient_tokens = _tokenize(product.get("ingredients_text_fr") or "")
        category_tokens = _extract_category_tokens(product.get("categories_tags") or [])

        scored: list[dict[str, Any]] = []
        for food in foods:
            name_tokens = _tokenize(
                " ".join(
                    [
                        food.get("canonical_name_fr") or "",
                        food.get("canonical_name_en") or "",
                        food.get("food_slug") or "",
                    ]
                )
            )
            food_category_tokens = _extract_category_tokens(food.get("category_codes") or [])
            name_score = _overlap_score(product_name_tokens, name_tokens)
            ingredients_score = _overlap_score(ingredient_tokens, name_tokens)
            category_score = _overlap_score(category_tokens, food_category_tokens)
            score = round((0.60 * name_score) + (0.25 * ingredients_score) + (0.15 * category_score), 3)
            if score <= 0:
                continue

            scored.append(
                {
                    "food_id": str(food["food_id"]),
                    "food_slug": food["food_slug"],
                    "canonical_name_fr": food["canonical_name_fr"],
                    "canonical_name_en": food["canonical_name_en"],
                    "score": score,
                    "signal_breakdown": {
                        "name_score": round(name_score, 3),
                        "ingredients_score": round(ingredients_score, 3),
                        "category_score": round(category_score, 3),
                    },
                }
            )

        scored.sort(key=lambda item: (-item["score"], item["food_slug"]))
        return scored[:5]

    def _select_accepted_candidate(self, candidates: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
        if not candidates:
            return None

        top = candidates[0]
        if top["score"] < self._settings.barcode_heuristic_threshold:
            return None

        second_score = candidates[1]["score"] if len(candidates) > 1 else 0.0
        if (top["score"] - second_score) < self._settings.barcode_heuristic_margin:
            return None

        return top


def normalize_retail_barcode(raw_code: str) -> Tuple[str, str]:
    code = raw_code.strip()
    if not code:
        raise invalid_barcode("Barcode must not be empty")
    if not code.isdigit():
        raise invalid_barcode("Barcode must contain digits only")

    if len(code) == 8:
        if not _is_valid_check_digit(code):
            raise invalid_barcode("Invalid EAN-8 check digit")
        return code, "EAN8"

    if len(code) == 12:
        if not _is_valid_check_digit(code):
            raise invalid_barcode("Invalid UPC-A check digit")
        return f"0{code}", "EAN13"

    if len(code) == 13:
        if not _is_valid_check_digit(code):
            raise invalid_barcode("Invalid EAN-13 check digit")
        return code, "EAN13"

    raise invalid_barcode("Barcode must be 8, 12, or 13 digits")


def _is_valid_check_digit(code: str) -> bool:
    if len(code) < 2:
        return False
    expected = _compute_check_digit(code[:-1])
    return int(code[-1]) == expected


def _compute_check_digit(payload: str) -> int:
    total = 0
    for idx, char in enumerate(reversed(payload), start=1):
        digit = int(char)
        total += digit * 3 if idx % 2 == 1 else digit
    return (10 - (total % 10)) % 10


def _cache_to_product(cache_row: dict[str, Any]) -> Optional[dict[str, Any]]:
    if cache_row.get("provider_status") != "found":
        return None
    return {
        "source_code": cache_row.get("source_code"),
        "product_name_fr": cache_row.get("product_name_fr"),
        "product_name_en": cache_row.get("product_name_en"),
        "brand": cache_row.get("brand"),
        "ingredients_text_fr": cache_row.get("ingredients_text_fr"),
        "categories_tags": list(cache_row.get("categories_tags") or []),
        "countries_tags": list(cache_row.get("countries_tags") or []),
    }


def _link_row_to_food(link_row: dict[str, Any]) -> dict[str, Any]:
    return {
        "food_slug": link_row["food_slug"],
        "canonical_name_fr": link_row["canonical_name_fr"],
        "canonical_name_en": link_row["canonical_name_en"],
        "link_method": link_row["link_method"],
        "confidence": link_row.get("confidence"),
    }


def _normalize_text(value: str) -> str:
    return (
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )


def _tokenize(value: str) -> set[str]:
    normalized = _normalize_text(value)
    return {token for token in _TOKEN_RE.findall(normalized) if len(token) >= 2}


def _extract_category_tokens(values: list[str]) -> set[str]:
    acc: set[str] = set()
    for value in values:
        if not value:
            continue
        segment = value.split(":")[-1]
        acc.update(_tokenize(segment.replace("-", " ").replace("_", " ")))
    return acc


def _overlap_score(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(right)
