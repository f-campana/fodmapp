from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from psycopg.types.json import Jsonb

from app import sql
from app.config import Settings
from app.db import Database
from app.errors import invalid_barcode, not_found

PRODUCT_METHOD_VERSION = "products_guided_v1"
PRODUCT_PARSER_VERSION = "ingredients_v1"
SEVERITY_ORDER = {"none": 0, "low": 1, "moderate": 2, "high": 3, "unknown": 4}


class ProductsService:
    def __init__(self, db: Database, settings: Settings) -> None:
        self._db = db
        self._settings = settings

    def lookup_barcode(self, query_code: str) -> dict[str, Any]:
        normalized_code, canonical_format = _normalize_retail_barcode(query_code)
        row = self._get_lookup_row(normalized_code)
        refresh_enqueued = False
        if self._should_queue_refresh(row):
            refresh_enqueued = self._queue_refresh(
                normalized_code,
                canonical_format,
                row.get("product_id") if row else None,
            )
            row = self._get_lookup_row(normalized_code)

        lookup_status = self._lookup_status(row)
        product = None
        if row and row.get("product_id"):
            product = {
                "product_id": row["product_id"],
                "product_name_fr": row["product_name_fr"] or row["normalized_code"],
                "product_name_en": row.get("product_name_en"),
                "brand": row.get("brand"),
            }

        return {
            "query_code": query_code,
            "normalized_code": normalized_code,
            "canonical_format": canonical_format,
            "lookup_status": lookup_status,
            "refresh_enqueued": refresh_enqueued,
            "provider": self._provider_slug(row),
            "provider_last_synced_at": row.get("provider_last_synced_at") if row else None,
            "product": product,
        }

    def get_product(self, product_id: UUID) -> dict[str, Any]:
        row = self._get_product_row(product_id)
        if row is None:
            raise not_found("Product not found")

        refresh_enqueued = False
        if self._is_stale(row) and row.get("primary_normalized_code"):
            refresh_enqueued = self._queue_refresh(
                normalized_code=row["primary_normalized_code"],
                canonical_format=row.get("canonical_format") or "EAN13",
                product_id=row["product_id"],
            )
            row = self._get_product_row(product_id)
            if row is None:
                raise not_found("Product not found")

        stale_after_utc = row.get("snapshot_expires_at")
        return {
            "product_id": row["product_id"],
            "contract_tier": "guided",
            "sync_state": self._sync_state(row),
            "refresh_enqueued": refresh_enqueued,
            "provider": self._provider_slug(row),
            "provider_status": row.get("provider_status"),
            "provider_last_synced_at": row.get("provider_last_synced_at"),
            "stale_after_utc": stale_after_utc,
            "refresh_requested_at": row.get("refresh_requested_at"),
            "gtin13": row.get("gtin13"),
            "open_food_facts_code": row.get("open_food_facts_code"),
            "primary_normalized_code": row.get("primary_normalized_code"),
            "canonical_format": row.get("canonical_format"),
            "product_name_fr": row["product_name_fr"] or row["open_food_facts_code"] or str(row["product_id"]),
            "product_name_en": row.get("product_name_en"),
            "brand": row.get("brand"),
            "categories_tags": list(row.get("categories_tags") or []),
            "countries_tags": list(row.get("countries_tags") or []),
            "ingredients_text_fr": row.get("ingredients_text_fr"),
            "assessment_available": row.get("assessment_status") is not None,
            "assessment_status": row.get("assessment_status"),
        }

    def get_product_ingredients(self, product_id: UUID) -> dict[str, Any]:
        product = self._get_product_row(product_id)
        if product is None:
            raise not_found("Product not found")

        with self._db.readonly_connection() as conn:
            rows = sql.fetch_all(conn, sql.SQL_GET_PRODUCT_INGREDIENT_ROWS, {"product_id": product_id})

        items: list[dict[str, Any]] = []
        current: dict[str, Any] | None = None
        current_line = None
        parser_version = PRODUCT_PARSER_VERSION
        for row in rows:
            parser_version = row.get("parser_version") or parser_version
            if row["line_no"] != current_line:
                current = {
                    "line_no": row["line_no"],
                    "ingredient_text_fr": row["ingredient_text_fr"],
                    "normalized_name": row["normalized_name"],
                    "declared_share_pct": row.get("declared_share_pct"),
                    "parse_confidence": row["parse_confidence"],
                    "is_substantive": row["is_substantive"],
                    "candidates": [],
                }
                items.append(current)
                current_line = row["line_no"]

            if row.get("candidate_rank") is not None and current is not None:
                current["candidates"].append(
                    {
                        "candidate_rank": row["candidate_rank"],
                        "food_slug": row["food_slug"],
                        "canonical_name_fr": row["canonical_name_fr"],
                        "canonical_name_en": row["canonical_name_en"],
                        "score": row["score"],
                        "confidence_tier": row["confidence_tier"],
                        "match_method": row["match_method"],
                        "signal_breakdown": row["signal_breakdown"] or {},
                        "is_selected": row["is_selected"],
                    }
                )

        return {
            "product_id": product_id,
            "contract_tier": "guided",
            "parser_version": parser_version,
            "items": items,
            "total": len(items),
        }

    def get_product_assessment(self, product_id: UUID) -> dict[str, Any]:
        product = self._get_product_row(product_id)
        if product is None:
            raise not_found("Product not found")

        with self._db.readonly_connection() as conn:
            assessment = sql.fetch_one(conn, sql.SQL_GET_PRODUCT_ASSESSMENT, {"product_id": product_id})
            if assessment is None:
                raise not_found("Product assessment not available")
            subtypes = sql.fetch_all(
                conn,
                sql.SQL_GET_PRODUCT_ASSESSMENT_SUBTYPES,
                {"product_assessment_id": assessment["product_assessment_id"]},
            )

        return {
            "product_id": product_id,
            "contract_tier": "guided",
            "assessment_mode": "guided",
            "assessment_status": assessment["assessment_status"],
            "confidence_tier": assessment["confidence_tier"],
            "heuristic_overall_level": assessment["heuristic_overall_level"],
            "heuristic_max_low_portion_g": assessment.get("heuristic_max_low_portion_g"),
            "numeric_guidance_status": assessment["numeric_guidance_status"],
            "numeric_guidance_basis": assessment.get("numeric_guidance_basis"),
            "limiting_subtypes": list(assessment.get("limiting_subtypes") or []),
            "caveats": list(assessment.get("caveats") or []),
            "method_version": assessment["method_version"],
            "provider": assessment["provider_slug"],
            "provider_last_synced_at": assessment.get("provider_last_synced_at"),
            "computed_at": assessment["computed_at"],
            "dominant_food_slug": assessment.get("dominant_food_slug"),
            "dominant_food_name_fr": assessment.get("dominant_food_name_fr"),
            "dominant_food_name_en": assessment.get("dominant_food_name_en"),
            "subtypes": subtypes,
        }

    def _get_lookup_row(self, normalized_code: str) -> dict[str, Any] | None:
        with self._db.readonly_connection() as conn:
            row = sql.fetch_one(conn, sql.SQL_GET_PRODUCT_LOOKUP, {"normalized_code": normalized_code})
        if row is None:
            return None
        if not any(
            (
                row.get("product_id"),
                row.get("provider_status"),
                row.get("refresh_status"),
                row.get("provider_last_synced_at"),
            )
        ):
            return None
        return row

    def _get_product_row(self, product_id: UUID) -> dict[str, Any] | None:
        with self._db.readonly_connection() as conn:
            return sql.fetch_one(conn, sql.SQL_GET_PRODUCT, {"product_id": product_id})

    def _should_queue_refresh(self, row: dict[str, Any] | None) -> bool:
        if row is None:
            return True
        if row.get("refresh_status") == "processing":
            return False
        if row.get("provider_status") == "not_found" and not self._is_stale(row):
            return False
        if row.get("provider_status") == "found" and not self._is_stale(row):
            return False
        if row.get("provider_status") == "error":
            return True
        if self._is_stale(row):
            return True
        return row.get("product_id") is None

    def _lookup_status(self, row: dict[str, Any] | None) -> str:
        if row is None:
            return "queued"
        if row.get("refresh_status") == "processing":
            return "refreshing"
        if row.get("provider_status") == "not_found" and not self._is_stale(row):
            return "not_found"
        if row.get("provider_status") == "error" and row.get("product_id") is None:
            return "failed"
        if row.get("product_id") and self._is_stale(row):
            return "stale"
        if row.get("product_id"):
            return "ready"
        if row.get("refresh_status") == "queued":
            return "queued"
        return "failed"

    def _sync_state(self, row: dict[str, Any]) -> str:
        if row.get("refresh_status") == "processing":
            return "refreshing"
        if row.get("provider_status") == "error":
            return "failed"
        if self._is_stale(row):
            return "stale"
        return "fresh"

    def _provider_slug(self, row: dict[str, Any] | None) -> str:
        if row is None:
            return "open_food_facts"
        return row.get("provider_slug") or "open_food_facts"

    def _is_stale(self, row: dict[str, Any]) -> bool:
        expires_at = row.get("snapshot_expires_at")
        if expires_at is None:
            return True
        return expires_at <= _now_utc()

    def _queue_refresh(self, normalized_code: str, canonical_format: str, product_id: Any) -> bool:
        now = _now_utc()
        cooldown_until = now + timedelta(seconds=self._settings.products_refresh_cooldown_seconds)
        with self._db.connection() as conn:
            existing = sql.fetch_one(conn, sql.SQL_GET_PRODUCT_REFRESH_REQUEST, {"normalized_code": normalized_code})
            if existing is None:
                sql.fetch_one(
                    conn,
                    sql.SQL_INSERT_PRODUCT_REFRESH_REQUEST,
                    {
                        "normalized_code": normalized_code,
                        "canonical_format": canonical_format,
                        "product_id": product_id,
                        "now": now,
                        "cooldown_until": cooldown_until,
                    },
                )
                _insert_review_event(
                    conn,
                    product_id,
                    normalized_code,
                    "refresh_requested",
                    {"reason": "missing_or_stale"},
                )
                return True

            if existing["cooldown_until"] <= now:
                sql.fetch_one(
                    conn,
                    sql.SQL_QUEUE_PRODUCT_REFRESH_REQUEST,
                    {
                        "normalized_code": normalized_code,
                        "canonical_format": canonical_format,
                        "product_id": product_id,
                        "now": now,
                        "cooldown_until": cooldown_until,
                    },
                )
                _insert_review_event(
                    conn,
                    product_id,
                    normalized_code,
                    "refresh_requested",
                    {"reason": "missing_or_stale"},
                )
                return True

            sql.fetch_one(
                conn,
                sql.SQL_TOUCH_PRODUCT_REFRESH_REQUEST,
                {
                    "normalized_code": normalized_code,
                    "canonical_format": canonical_format,
                    "product_id": product_id,
                    "now": now,
                },
            )
            return False


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _insert_review_event(conn, product_id: Any, normalized_code: str, event_type: str, payload: dict[str, Any]) -> None:
    conn.execute(
        sql.SQL_INSERT_PRODUCT_REVIEW_EVENT,
        {
            "product_id": product_id,
            "normalized_code": normalized_code,
            "event_type": event_type,
            "actor": "products_service",
            "payload": Jsonb(payload),
        },
    )


def _normalize_retail_barcode(raw_code: str) -> tuple[str, str]:
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
    expected = _compute_check_digit(code[:-1])
    return int(code[-1]) == expected


def _compute_check_digit(payload: str) -> int:
    digits = [int(char) for char in payload]
    if len(payload) % 2 == 0:
        odd_sum = sum(digits[::2])
        even_sum = sum(digits[1::2])
    else:
        odd_sum = sum(digits[1::2])
        even_sum = sum(digits[::2])

    total = (odd_sum * 3) + even_sum
    return (10 - (total % 10)) % 10
