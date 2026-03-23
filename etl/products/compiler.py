from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from etl.products.ingredients import ParsedIngredient, parse_ingredients
from etl.products.off_client import OpenFoodFactsClient, OpenFoodFactsFetchResult
from etl.products.scoring import CandidateFood, ScoredCandidate, choose_selected_candidate, score_ingredient_candidates

METHOD_VERSION = "products_guided_v1"
PARSER_VERSION = "ingredients_v1"
SEVERITY_ORDER = {"none": 0, "low": 1, "moderate": 2, "high": 3, "unknown": 4}


@dataclass(frozen=True)
class CompileSettings:
    db_url: str
    stale_after_hours: int
    refresh_cooldown_seconds: int


def process_refresh_request(
    conn: psycopg.Connection,
    normalized_code: str,
    canonical_format: str,
    stale_after_hours: int,
    refresh_cooldown_seconds: int,
    client: OpenFoodFactsClient,
    *,
    request_claimed: bool = False,
) -> dict[str, Any]:
    source_id = _get_source_id(conn, "open_food_facts")
    if request_claimed:
        request_row = conn.execute(
            """
            SELECT normalized_code, canonical_format
            FROM product_refresh_requests
            WHERE normalized_code = %(normalized_code)s
            """,
            {"normalized_code": normalized_code},
        ).fetchone()
    else:
        request_row = conn.execute(
            """
            UPDATE product_refresh_requests
            SET status = 'processing',
                attempt_count = attempt_count + 1,
                updated_at = now()
            WHERE normalized_code = %(normalized_code)s
            RETURNING normalized_code, canonical_format
            """,
            {"normalized_code": normalized_code},
        ).fetchone()
    if request_row is None:
        raise ValueError(f"refresh request missing for {normalized_code}")

    fetch_result = client.fetch_product(normalized_code)
    expires_at = fetch_result.fetched_at + timedelta(hours=stale_after_hours)

    snapshot_id = conn.execute(
        """
        INSERT INTO product_provider_snapshots (
          normalized_code,
          product_id,
          canonical_format,
          provider_source_id,
          fetch_status,
          provider_payload,
          source_code,
          product_name_fr,
          product_name_en,
          brand,
          ingredients_text_fr,
          categories_tags,
          countries_tags,
          fetched_at,
          expires_at,
          last_error_code
        ) VALUES (
          %(normalized_code)s,
          NULL,
          %(canonical_format)s,
          %(provider_source_id)s,
          %(fetch_status)s,
          %(provider_payload)s,
          %(source_code)s,
          %(product_name_fr)s,
          %(product_name_en)s,
          %(brand)s,
          %(ingredients_text_fr)s,
          %(categories_tags)s,
          %(countries_tags)s,
          %(fetched_at)s,
          %(expires_at)s,
          %(last_error_code)s
        )
        RETURNING product_provider_snapshot_id
        """,
        {
            "normalized_code": normalized_code,
            "canonical_format": canonical_format,
            "provider_source_id": source_id,
            "fetch_status": fetch_result.provider_status,
            "provider_payload": _jsonb(fetch_result.payload),
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
        },
    ).fetchone()["product_provider_snapshot_id"]

    if fetch_result.provider_status == "error":
        retry_after = fetch_result.fetched_at + timedelta(seconds=refresh_cooldown_seconds)
        _finish_refresh_request(
            conn,
            normalized_code,
            "failed",
            None,
            fetch_result.last_error_code,
            refresh_after=retry_after,
            cooldown_until=retry_after,
        )
        _insert_review_event(conn, None, normalized_code, "refresh_failed", {"error_code": fetch_result.last_error_code})
        return {"normalized_code": normalized_code, "snapshot_id": snapshot_id, "status": "failed", "product_id": None}

    if fetch_result.provider_status == "not_found":
        _clear_missing_product_mapping(conn, normalized_code)
        _finish_refresh_request(conn, normalized_code, "completed", None, None)
        _insert_review_event(conn, None, normalized_code, "refresh_completed", {"fetch_status": "not_found"})
        return {"normalized_code": normalized_code, "snapshot_id": snapshot_id, "status": "not_found", "product_id": None}

    product_id = _upsert_product(conn, source_id, normalized_code, canonical_format, fetch_result)
    conn.execute(
        """
        UPDATE product_provider_snapshots
        SET product_id = %(product_id)s
        WHERE product_provider_snapshot_id = %(snapshot_id)s
        """,
        {"product_id": product_id, "snapshot_id": snapshot_id},
    )
    _upsert_product_code(conn, product_id, normalized_code, canonical_format, fetch_result.source_code or normalized_code, source_id)

    parser_version, parsed_ingredients = parse_ingredients(fetch_result.ingredients_text_fr, parser_version=PARSER_VERSION)
    _replace_product_ingredients(conn, product_id, parser_version, parsed_ingredients)

    foods = _load_candidate_foods(conn)
    selected_rows = _replace_candidate_rows(
        conn,
        product_id=product_id,
        parsed_ingredients=parsed_ingredients,
        foods=foods,
        product_name=f"{fetch_result.product_name_fr or ''} {fetch_result.product_name_en or ''} {fetch_result.brand or ''}",
        categories_tags=fetch_result.categories_tags,
    )

    _replace_product_links(conn, product_id, selected_rows)
    assessment = _compile_assessment(conn, product_id, source_id, fetch_result.fetched_at, parsed_ingredients, selected_rows)
    _finish_refresh_request(conn, normalized_code, "completed", product_id, None)
    _insert_review_event(
        conn,
        product_id,
        normalized_code,
        "refresh_completed",
        {
            "assessment_status": assessment["assessment_status"],
            "confidence_tier": assessment["confidence_tier"],
            "overall_level": assessment["heuristic_overall_level"],
        },
    )
    if assessment["dominant_food_id"] is not None:
        _insert_review_event(
            conn,
            product_id,
            normalized_code,
            "heuristic_selected",
            {
                "dominant_food_id": assessment["dominant_food_id"],
                "numeric_guidance_status": assessment["numeric_guidance_status"],
            },
        )
    return {"normalized_code": normalized_code, "snapshot_id": snapshot_id, "status": "completed", "product_id": product_id}


def drain_refresh_requests(
    settings: CompileSettings,
    client: OpenFoodFactsClient,
    limit: int = 25,
) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    results: list[dict[str, Any]] = []
    with psycopg.connect(settings.db_url, row_factory=dict_row) as conn:
        with conn.transaction():
            rows = _claim_refresh_requests(conn, now, limit)

        for row in rows:
            with conn.transaction():
                results.append(
                    process_refresh_request(
                        conn,
                        normalized_code=row["normalized_code"],
                        canonical_format=row["canonical_format"],
                        stale_after_hours=settings.stale_after_hours,
                        refresh_cooldown_seconds=settings.refresh_cooldown_seconds,
                        client=client,
                        request_claimed=True,
                    )
                )

    return results


def _claim_refresh_requests(
    conn: psycopg.Connection,
    now: datetime,
    limit: int,
) -> list[dict[str, Any]]:
    return conn.execute(
        """
        WITH claimable AS (
          SELECT normalized_code
          FROM product_refresh_requests
          WHERE status IN ('queued', 'failed')
            AND refresh_after <= %(now)s
          ORDER BY last_requested_at ASC
          LIMIT %(limit)s
          FOR UPDATE SKIP LOCKED
        )
        UPDATE product_refresh_requests pr
        SET status = 'processing',
            attempt_count = pr.attempt_count + 1,
            updated_at = now()
        FROM claimable
        WHERE pr.normalized_code = claimable.normalized_code
        RETURNING pr.normalized_code, pr.canonical_format
        """,
        {"now": now, "limit": limit},
    ).fetchall()


def _get_source_id(conn: psycopg.Connection, source_slug: str) -> str:
    row = conn.execute("SELECT source_id FROM sources WHERE source_slug = %(source_slug)s", {"source_slug": source_slug}).fetchone()
    if row is None:
        raise ValueError(f"source missing: {source_slug}")
    return str(row["source_id"])


def _upsert_product(
    conn: psycopg.Connection,
    source_id: str,
    normalized_code: str,
    canonical_format: str,
    fetch_result: OpenFoodFactsFetchResult,
) -> str:
    row = conn.execute(
        """
        INSERT INTO products (
          gtin13,
          open_food_facts_code,
          product_name_fr,
          product_name_en,
          brand,
          categories_tags,
          countries_tags,
          ingredients_text_fr,
          source_id,
          last_synced_at,
          updated_at
        ) VALUES (
          %(gtin13)s,
          %(open_food_facts_code)s,
          %(product_name_fr)s,
          %(product_name_en)s,
          %(brand)s,
          %(categories_tags)s,
          %(countries_tags)s,
          %(ingredients_text_fr)s,
          %(source_id)s,
          %(last_synced_at)s,
          now()
        )
        ON CONFLICT (open_food_facts_code) DO UPDATE SET
          gtin13 = EXCLUDED.gtin13,
          product_name_fr = EXCLUDED.product_name_fr,
          product_name_en = EXCLUDED.product_name_en,
          brand = EXCLUDED.brand,
          categories_tags = EXCLUDED.categories_tags,
          countries_tags = EXCLUDED.countries_tags,
          ingredients_text_fr = EXCLUDED.ingredients_text_fr,
          source_id = EXCLUDED.source_id,
          last_synced_at = EXCLUDED.last_synced_at,
          updated_at = now()
        RETURNING product_id
        """,
        {
            "gtin13": normalized_code if canonical_format == "EAN13" else None,
            "open_food_facts_code": fetch_result.source_code or normalized_code,
            "product_name_fr": fetch_result.product_name_fr or fetch_result.source_code or normalized_code,
            "product_name_en": fetch_result.product_name_en,
            "brand": fetch_result.brand,
            "categories_tags": fetch_result.categories_tags,
            "countries_tags": fetch_result.countries_tags,
            "ingredients_text_fr": fetch_result.ingredients_text_fr,
            "source_id": source_id,
            "last_synced_at": fetch_result.fetched_at,
        },
    ).fetchone()
    return str(row["product_id"])


def _upsert_product_code(
    conn: psycopg.Connection,
    product_id: str,
    normalized_code: str,
    canonical_format: str,
    source_code: str,
    source_id: str,
) -> None:
    conn.execute(
        """
        INSERT INTO product_codes (
          normalized_code,
          product_id,
          canonical_format,
          source_code,
          provider_source_id,
          updated_at
        ) VALUES (
          %(normalized_code)s,
          %(product_id)s,
          %(canonical_format)s,
          %(source_code)s,
          %(provider_source_id)s,
          now()
        )
        ON CONFLICT (normalized_code) DO UPDATE SET
          product_id = EXCLUDED.product_id,
          canonical_format = EXCLUDED.canonical_format,
          source_code = EXCLUDED.source_code,
          provider_source_id = EXCLUDED.provider_source_id,
          updated_at = now()
        """,
        {
            "normalized_code": normalized_code,
            "product_id": product_id,
            "canonical_format": canonical_format,
            "source_code": source_code,
            "provider_source_id": source_id,
        },
    )


def _clear_missing_product_mapping(conn: psycopg.Connection, normalized_code: str) -> None:
    row = conn.execute(
        """
        SELECT
          pc.product_id,
          EXISTS (
            SELECT 1
            FROM product_codes other
            WHERE other.product_id = pc.product_id
              AND other.normalized_code <> pc.normalized_code
          ) AS has_other_codes
        FROM product_codes pc
        WHERE pc.normalized_code = %(normalized_code)s
        """,
        {"normalized_code": normalized_code},
    ).fetchone()
    if row is None:
        return

    product_id = str(row["product_id"])
    conn.execute(
        "DELETE FROM product_codes WHERE normalized_code = %(normalized_code)s",
        {"normalized_code": normalized_code},
    )
    if not row["has_other_codes"]:
        conn.execute(
            "DELETE FROM products WHERE product_id = %(product_id)s",
            {"product_id": product_id},
        )


def _replace_product_ingredients(
    conn: psycopg.Connection,
    product_id: str,
    parser_version: str,
    ingredients: list[ParsedIngredient],
) -> None:
    conn.execute("DELETE FROM product_food_candidates WHERE product_id = %(product_id)s", {"product_id": product_id})
    conn.execute("DELETE FROM product_ingredients WHERE product_id = %(product_id)s", {"product_id": product_id})
    for ingredient in ingredients:
        conn.execute(
            """
            INSERT INTO product_ingredients (
              product_id,
              line_no,
              ingredient_text_fr,
              normalized_name,
              declared_share_pct,
              parser_version,
              parse_confidence,
              is_substantive
            ) VALUES (
              %(product_id)s,
              %(line_no)s,
              %(ingredient_text_fr)s,
              %(normalized_name)s,
              %(declared_share_pct)s,
              %(parser_version)s,
              %(parse_confidence)s,
              %(is_substantive)s
            )
            """,
            {
                "product_id": product_id,
                "line_no": ingredient.line_no,
                "ingredient_text_fr": ingredient.ingredient_text_fr,
                "normalized_name": ingredient.normalized_name,
                "declared_share_pct": ingredient.declared_share_pct,
                "parser_version": parser_version,
                "parse_confidence": ingredient.parse_confidence,
                "is_substantive": ingredient.is_substantive,
            },
        )


def _load_candidate_foods(conn: psycopg.Connection) -> list[CandidateFood]:
    rows = conn.execute(
        """
        SELECT
          f.food_id,
          f.food_slug,
          COALESCE(f.canonical_name_fr, f.food_slug) AS canonical_name_fr,
          COALESCE(f.canonical_name_en, COALESCE(f.canonical_name_fr, f.food_slug)) AS canonical_name_en,
          COALESCE(array_remove(array_agg(fc.code), NULL), '{}') AS category_codes
        FROM foods f
        LEFT JOIN food_category_memberships fcm ON fcm.food_id = f.food_id
        LEFT JOIN food_categories fc ON fc.category_id = fcm.category_id
        WHERE f.status = 'active'
        GROUP BY f.food_id, f.food_slug, f.canonical_name_fr, f.canonical_name_en
        ORDER BY f.food_slug
        """
    ).fetchall()
    return [
        CandidateFood(
            food_id=str(row["food_id"]),
            food_slug=row["food_slug"],
            canonical_name_fr=row["canonical_name_fr"],
            canonical_name_en=row["canonical_name_en"],
            category_codes=tuple(row["category_codes"] or []),
        )
        for row in rows
    ]


def _replace_candidate_rows(
    conn: psycopg.Connection,
    product_id: str,
    parsed_ingredients: list[ParsedIngredient],
    foods: list[CandidateFood],
    product_name: str,
    categories_tags: list[str],
) -> list[dict[str, Any]]:
    selected_rows: list[dict[str, Any]] = []
    for ingredient in parsed_ingredients:
        candidates = score_ingredient_candidates(
            ingredient_name=ingredient.normalized_name,
            product_name=product_name,
            categories_tags=categories_tags,
            foods=foods,
            heuristic_version=METHOD_VERSION,
        )
        selected = choose_selected_candidate(candidates)
        for rank, candidate in enumerate(candidates, start=1):
            signal_breakdown = {
                "ingredient_score": candidate.signal_breakdown["ingredient_score"],
                "product_score": candidate.signal_breakdown["product_score"],
                "category_score": candidate.signal_breakdown["category_score"],
                "heuristic_version": METHOD_VERSION,
            }
            conn.execute(
                """
                INSERT INTO product_food_candidates (
                  product_id,
                  line_no,
                  food_id,
                  candidate_rank,
                  match_method,
                  score,
                  confidence_tier,
                  signal_breakdown,
                  heuristic_version,
                  is_selected
                ) VALUES (
                  %(product_id)s,
                  %(line_no)s,
                  %(food_id)s,
                  %(candidate_rank)s,
                  %(match_method)s,
                  %(score)s,
                  %(confidence_tier)s,
                  %(signal_breakdown)s,
                  %(heuristic_version)s,
                  %(is_selected)s
                )
                """,
                {
                    "product_id": product_id,
                    "line_no": ingredient.line_no,
                    "food_id": candidate.food_id,
                    "candidate_rank": rank,
                    "match_method": candidate.match_method,
                    "score": candidate.score,
                    "confidence_tier": candidate.confidence_tier,
                    "signal_breakdown": _jsonb(signal_breakdown),
                    "heuristic_version": METHOD_VERSION,
                    "is_selected": selected is not None and candidate.food_id == selected.food_id,
                },
            )
        if selected is not None:
            selected_rows.append(
                {
                    "line_no": ingredient.line_no,
                    "declared_share_pct": ingredient.declared_share_pct,
                    "is_substantive": ingredient.is_substantive,
                    "ingredient_text_fr": ingredient.ingredient_text_fr,
                    "food_id": selected.food_id,
                    "food_slug": selected.food_slug,
                    "canonical_name_fr": selected.canonical_name_fr,
                    "canonical_name_en": selected.canonical_name_en,
                    "score": selected.score,
                    "confidence_tier": selected.confidence_tier,
                }
            )
    return selected_rows


def _replace_product_links(conn: psycopg.Connection, product_id: str, selected_rows: list[dict[str, Any]]) -> None:
    conn.execute(
        "DELETE FROM product_food_links WHERE product_id = %(product_id)s AND link_method = 'heuristic'",
        {"product_id": product_id},
    )
    seen: set[str] = set()
    for row in selected_rows:
        if row["food_id"] in seen:
            continue
        seen.add(row["food_id"])
        conn.execute(
            """
            INSERT INTO product_food_links (
              product_id,
              food_id,
              link_method,
              link_confidence
            ) VALUES (
              %(product_id)s,
              %(food_id)s,
              'heuristic',
              %(link_confidence)s
            )
            ON CONFLICT (product_id, food_id) DO UPDATE
            SET link_method = CASE
                  WHEN product_food_links.link_method = 'heuristic' THEN EXCLUDED.link_method
                  ELSE product_food_links.link_method
                END,
                link_confidence = CASE
                  WHEN product_food_links.link_method = 'heuristic' THEN EXCLUDED.link_confidence
                  ELSE product_food_links.link_confidence
                END
            """,
            {
                "product_id": product_id,
                "food_id": row["food_id"],
                "link_confidence": row["score"],
            },
        )


def _compile_assessment(
    conn: psycopg.Connection,
    product_id: str,
    source_id: str,
    fetched_at: datetime,
    parsed_ingredients: list[ParsedIngredient],
    selected_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    conn.execute("DELETE FROM product_assessment_subtypes WHERE product_assessment_id IN (SELECT product_assessment_id FROM product_assessments WHERE product_id = %(product_id)s)", {"product_id": product_id})
    conn.execute("DELETE FROM product_assessments WHERE product_id = %(product_id)s", {"product_id": product_id})

    food_rollup_cache: dict[str, dict[str, Any]] = {}
    food_subtype_cache: dict[str, list[dict[str, Any]]] = {}
    for row in selected_rows:
        food_rollup_cache[row["food_id"]] = _get_food_rollup(conn, row["food_id"])
        food_subtype_cache[row["food_id"]] = _get_food_subtypes(conn, row["food_id"])

    payload = _build_assessment_payload(parsed_ingredients, selected_rows, food_rollup_cache, food_subtype_cache)
    assessment_row = conn.execute(
        """
        INSERT INTO product_assessments (
          product_id,
          method_version,
          contract_tier,
          assessment_mode,
          assessment_status,
          confidence_tier,
          heuristic_overall_level,
          heuristic_max_low_portion_g,
          numeric_guidance_status,
          numeric_guidance_basis,
          dominant_food_id,
          dominant_ingredient_line_no,
          limiting_subtypes,
          caveats,
          provider_source_id,
          provider_last_synced_at,
          computed_at,
          updated_at
        ) VALUES (
          %(product_id)s,
          %(method_version)s,
          'guided',
          'guided',
          %(assessment_status)s,
          %(confidence_tier)s,
          %(heuristic_overall_level)s,
          %(heuristic_max_low_portion_g)s,
          %(numeric_guidance_status)s,
          %(numeric_guidance_basis)s,
          %(dominant_food_id)s,
          %(dominant_ingredient_line_no)s,
          %(limiting_subtypes)s,
          %(caveats)s,
          %(provider_source_id)s,
          %(provider_last_synced_at)s,
          now(),
          now()
        )
        RETURNING product_assessment_id
        """,
        {
            "product_id": product_id,
            "method_version": METHOD_VERSION,
            "assessment_status": payload["assessment_status"],
            "confidence_tier": payload["confidence_tier"],
            "heuristic_overall_level": payload["heuristic_overall_level"],
            "heuristic_max_low_portion_g": payload["heuristic_max_low_portion_g"],
            "numeric_guidance_status": payload["numeric_guidance_status"],
            "numeric_guidance_basis": payload["numeric_guidance_basis"],
            "dominant_food_id": payload["dominant_food_id"],
            "dominant_ingredient_line_no": payload["dominant_ingredient_line_no"],
            "limiting_subtypes": payload["limiting_subtypes"],
            "caveats": payload["caveats"],
            "provider_source_id": source_id,
            "provider_last_synced_at": fetched_at,
        },
    ).fetchone()
    assessment_id = assessment_row["product_assessment_id"]

    for subtype in payload["subtypes"]:
        conn.execute(
            """
            INSERT INTO product_assessment_subtypes (
              product_assessment_id,
              subtype_code,
              subtype_level,
              source_food_id,
              low_max_g,
              moderate_max_g,
              burden_ratio
            ) VALUES (
              %(product_assessment_id)s,
              %(subtype_code)s,
              %(subtype_level)s,
              %(source_food_id)s,
              %(low_max_g)s,
              %(moderate_max_g)s,
              %(burden_ratio)s
            )
            """,
            {
                "product_assessment_id": assessment_id,
                **subtype,
            },
        )

    return payload


def _build_assessment_payload(
    parsed_ingredients: list[ParsedIngredient],
    selected_rows: list[dict[str, Any]],
    food_rollup_cache: dict[str, dict[str, Any]],
    food_subtype_cache: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    substantive_selected = [row for row in selected_rows if row["is_substantive"]]
    unmatched_substantive = [
        ingredient
        for ingredient in parsed_ingredients
        if ingredient.is_substantive and ingredient.line_no not in {row["line_no"] for row in substantive_selected}
    ]

    if not selected_rows:
        return {
            "assessment_status": "insufficient",
            "confidence_tier": "insufficient",
            "heuristic_overall_level": "unknown",
            "heuristic_max_low_portion_g": None,
            "numeric_guidance_status": "not_enough_data",
            "numeric_guidance_basis": None,
            "dominant_food_id": None,
            "dominant_ingredient_line_no": None,
            "limiting_subtypes": [],
            "caveats": [
                "Guided assessment based on product ingredient matching.",
                "No canonical food match was strong enough for a guided verdict.",
            ],
            "subtypes": [],
        }

    if not substantive_selected:
        caveats = [
            "Guided assessment based on product ingredient matching.",
            "No substantive ingredient match was strong enough for a guided verdict.",
        ]
        if unmatched_substantive:
            caveats.append("Some substantive ingredients could not be matched to canonical foods.")
        return {
            "assessment_status": "insufficient",
            "confidence_tier": "insufficient",
            "heuristic_overall_level": "unknown",
            "heuristic_max_low_portion_g": None,
            "numeric_guidance_status": "not_enough_data",
            "numeric_guidance_basis": None,
            "dominant_food_id": None,
            "dominant_ingredient_line_no": None,
            "limiting_subtypes": [],
            "caveats": caveats,
            "subtypes": [],
        }

    max_overall_level = "none"
    any_known = False
    subtype_best: dict[str, dict[str, Any]] = {}
    limiting_subtypes: list[str] = []
    caveats = ["Guided assessment based on product ingredient matching."]

    for selected in substantive_selected:
        rollup = food_rollup_cache[selected["food_id"]]
        level = rollup["overall_level"] if rollup else "unknown"
        if level != "unknown":
            any_known = True
        if SEVERITY_ORDER[level] > SEVERITY_ORDER[max_overall_level]:
            max_overall_level = level

        for subtype in food_subtype_cache[selected["food_id"]]:
            existing = subtype_best.get(subtype["subtype_code"])
            candidate = {
                "subtype_code": subtype["subtype_code"],
                "subtype_level": subtype["subtype_level"],
                "source_food_id": selected["food_id"],
                "low_max_g": subtype.get("low_max_g"),
                "moderate_max_g": subtype.get("moderate_max_g"),
                "burden_ratio": subtype.get("burden_ratio"),
            }
            if existing is None or _should_replace_subtype(existing, candidate):
                subtype_best[subtype["subtype_code"]] = {
                    **candidate
                }

    if not any_known:
        max_overall_level = "unknown"
    if len(substantive_selected) > 1:
        caveats.append("Multiple substantive ingredients reduce confidence and numeric guidance reliability.")
    if unmatched_substantive:
        caveats.append("Some substantive ingredients could not be matched to canonical foods.")

    max_subtype_severity = max(
        (SEVERITY_ORDER[item["subtype_level"]] for item in subtype_best.values()),
        default=0,
    )
    if max_subtype_severity > 0:
        limiting_subtypes = sorted(
            subtype_code
            for subtype_code, item in subtype_best.items()
            if SEVERITY_ORDER[item["subtype_level"]] == max_subtype_severity
        )

    dominant = _dominant_selected_candidate(substantive_selected)
    confidence_tier = _overall_confidence_tier(substantive_selected, dominant)
    numeric_payload = _numeric_guidance_payload(dominant, food_rollup_cache, food_subtype_cache)
    if numeric_payload["numeric_guidance_status"] != "available":
        if numeric_payload["numeric_guidance_status"] == "mixed_ingredients":
            caveats.append("Numeric guidance is unavailable because the product does not map to one dominant ingredient.")
        elif numeric_payload["numeric_guidance_status"] == "insufficient_confidence":
            caveats.append("Numeric guidance is unavailable because the dominant match is not high confidence.")
        elif numeric_payload["numeric_guidance_status"] == "unknown_rollup":
            caveats.append("Numeric guidance is unavailable because canonical rollup coverage is not strong enough.")
        else:
            caveats.append("Numeric guidance is unavailable because threshold data is incomplete.")

    assessment_status = "ready"
    if confidence_tier == "insufficient" or max_overall_level == "unknown":
        assessment_status = "insufficient"

    return {
        "assessment_status": assessment_status,
        "confidence_tier": confidence_tier,
        "heuristic_overall_level": max_overall_level,
        "heuristic_max_low_portion_g": numeric_payload["heuristic_max_low_portion_g"],
        "numeric_guidance_status": numeric_payload["numeric_guidance_status"],
        "numeric_guidance_basis": numeric_payload["numeric_guidance_basis"],
        "dominant_food_id": dominant["food_id"] if dominant else None,
        "dominant_ingredient_line_no": dominant["line_no"] if dominant else None,
        "limiting_subtypes": limiting_subtypes,
        "caveats": caveats,
        "subtypes": list(subtype_best.values()),
    }


def _dominant_selected_candidate(selected_rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not selected_rows:
        return None

    if len(selected_rows) == 1:
        return selected_rows[0]

    explicit = [row for row in selected_rows if row.get("declared_share_pct") is not None]
    if not explicit:
        return None

    explicit.sort(key=lambda row: (row["declared_share_pct"], row["score"]), reverse=True)
    top = explicit[0]
    second_share = explicit[1]["declared_share_pct"] if len(explicit) > 1 else 0.0
    if top["declared_share_pct"] >= 80 and top["declared_share_pct"] > second_share:
        return top
    return None


def _overall_confidence_tier(selected_rows: list[dict[str, Any]], dominant: dict[str, Any] | None) -> str:
    if not selected_rows:
        return "insufficient"
    best = max(selected_rows, key=lambda row: (row["score"], row["line_no"]))
    top_tier = best["confidence_tier"]
    if top_tier == "high" and dominant is not None and len(selected_rows) == 1:
        return "high"
    if top_tier == "high":
        return "medium"
    if top_tier == "medium":
        return "medium"
    if top_tier == "low":
        return "low"
    return "insufficient"


def _numeric_guidance_payload(
    dominant: dict[str, Any] | None,
    food_rollup_cache: dict[str, dict[str, Any]],
    food_subtype_cache: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    if dominant is None:
        return {
            "heuristic_max_low_portion_g": None,
            "numeric_guidance_status": "mixed_ingredients",
            "numeric_guidance_basis": None,
        }
    if dominant["confidence_tier"] != "high":
        return {
            "heuristic_max_low_portion_g": None,
            "numeric_guidance_status": "insufficient_confidence",
            "numeric_guidance_basis": None,
        }

    rollup = food_rollup_cache.get(dominant["food_id"])
    if rollup is None or rollup["overall_level"] == "unknown":
        return {
            "heuristic_max_low_portion_g": None,
            "numeric_guidance_status": "unknown_rollup",
            "numeric_guidance_basis": None,
        }

    value = _dominant_food_low_max_g(rollup, food_subtype_cache.get(dominant["food_id"], []))
    if value is None:
        return {
            "heuristic_max_low_portion_g": None,
            "numeric_guidance_status": "not_enough_data",
            "numeric_guidance_basis": None,
        }
    return {
        "heuristic_max_low_portion_g": value,
        "numeric_guidance_status": "available",
        "numeric_guidance_basis": "dominant_matched_food",
    }


def _dominant_food_low_max_g(rollup: dict[str, Any], subtype_rows: list[dict[str, Any]]) -> float | None:
    low_values = [float(row["low_max_g"]) for row in subtype_rows if row.get("low_max_g") is not None]
    if low_values:
        return round(min(low_values), 2)
    rollup_serving_g = rollup.get("rollup_serving_g")
    if rollup_serving_g is not None and rollup.get("overall_level") in {"none", "low"}:
        return round(float(rollup_serving_g), 2)
    return None


def _get_food_rollup(conn: psycopg.Connection, food_id: str) -> dict[str, Any] | None:
    return conn.execute(
        """
        SELECT
          food_id,
          overall_level::text AS overall_level,
          rollup_serving_g,
          coverage_ratio,
          known_subtypes_count
        FROM api_food_rollups_current
        WHERE food_id = %(food_id)s
        """,
        {"food_id": food_id},
    ).fetchone()


def _get_food_subtypes(conn: psycopg.Connection, food_id: str) -> list[dict[str, Any]]:
    return conn.execute(
        """
        SELECT
          subtype_code,
          subtype_level::text AS subtype_level,
          low_max_g,
          moderate_max_g,
          burden_ratio
        FROM api_food_subtypes_current
        WHERE food_id = %(food_id)s
        ORDER BY subtype_code ASC
        """,
        {"food_id": food_id},
    ).fetchall()


def _finish_refresh_request(
    conn: psycopg.Connection,
    normalized_code: str,
    status: str,
    product_id: str | None,
    last_error_code: str | None,
    *,
    refresh_after: datetime | None = None,
    cooldown_until: datetime | None = None,
) -> None:
    conn.execute(
        """
        UPDATE product_refresh_requests
        SET status = %(status)s,
            product_id = %(product_id)s,
            last_processed_at = now(),
            last_error_code = %(last_error_code)s,
            refresh_after = COALESCE(%(refresh_after)s, refresh_after),
            cooldown_until = COALESCE(%(cooldown_until)s, cooldown_until),
            updated_at = now()
        WHERE normalized_code = %(normalized_code)s
        """,
        {
            "normalized_code": normalized_code,
            "status": status,
            "product_id": product_id,
            "last_error_code": last_error_code,
            "refresh_after": refresh_after,
            "cooldown_until": cooldown_until,
        },
    )


def _should_replace_subtype(existing: dict[str, Any], candidate: dict[str, Any]) -> bool:
    existing_severity = SEVERITY_ORDER[existing["subtype_level"]]
    candidate_severity = SEVERITY_ORDER[candidate["subtype_level"]]
    if candidate_severity != existing_severity:
        return candidate_severity > existing_severity

    low_max_cmp = _compare_optional_numeric(candidate.get("low_max_g"), existing.get("low_max_g"), prefer="lower")
    if low_max_cmp != 0:
        return low_max_cmp > 0

    moderate_max_cmp = _compare_optional_numeric(
        candidate.get("moderate_max_g"),
        existing.get("moderate_max_g"),
        prefer="lower",
    )
    if moderate_max_cmp != 0:
        return moderate_max_cmp > 0

    burden_cmp = _compare_optional_numeric(candidate.get("burden_ratio"), existing.get("burden_ratio"), prefer="higher")
    return burden_cmp > 0


def _compare_optional_numeric(candidate_value: Any, existing_value: Any, *, prefer: str) -> int:
    if candidate_value is None and existing_value is None:
        return 0
    if candidate_value is None:
        return -1
    if existing_value is None:
        return 1

    candidate_float = float(candidate_value)
    existing_float = float(existing_value)
    if candidate_float == existing_float:
        return 0
    if prefer == "lower":
        return 1 if candidate_float < existing_float else -1
    return 1 if candidate_float > existing_float else -1


def _insert_review_event(
    conn: psycopg.Connection,
    product_id: str | None,
    normalized_code: str,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    conn.execute(
        """
        INSERT INTO product_review_events (
          product_id,
          normalized_code,
          event_type,
          actor,
          payload
        ) VALUES (
          %(product_id)s,
          %(normalized_code)s,
          %(event_type)s,
          'products_runner',
          %(payload)s
        )
        """,
        {
            "product_id": product_id,
            "normalized_code": normalized_code,
            "event_type": event_type,
            "payload": _jsonb(payload),
        },
    )


def _jsonb(value: Any) -> Any:
    return Jsonb(value) if value is not None else None
