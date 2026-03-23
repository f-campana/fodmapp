from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import psycopg
import pytest
from etl.products.barcodes import BarcodeValidationError, normalize_retail_barcode
from etl.products.compiler import (
    CompileSettings,
    _build_assessment_payload,
    _get_food_rollup,
    _get_food_subtypes,
    _replace_product_links,
    drain_refresh_requests,
    process_refresh_request,
)
from etl.products.ingredients import ParsedIngredient, parse_ingredients
from etl.products.off_client import OpenFoodFactsFetchResult
from etl.products.scoring import ScoredCandidate, choose_selected_candidate
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


def _check_digit(payload: str) -> str:
    digits = [int(char) for char in payload]
    if len(payload) % 2 == 0:
        odd_sum = sum(digits[::2])
        even_sum = sum(digits[1::2])
    else:
        odd_sum = sum(digits[1::2])
        even_sum = sum(digits[::2])
    total = (odd_sum * 3) + even_sum
    return str((10 - (total % 10)) % 10)


def _ean13(prefix12: str) -> str:
    return prefix12 + _check_digit(prefix12)


def _ean8(prefix7: str) -> str:
    return prefix7 + _check_digit(prefix7)


def _upca(prefix11: str) -> str:
    return prefix11 + _check_digit(prefix11)


def test_normalize_retail_barcode_accepts_supported_formats() -> None:
    ean13 = _ean13("376021182191")
    upca = _upca("03600029145")
    ean8 = _ean8("5512345")

    assert normalize_retail_barcode(ean13) == (ean13, "EAN13")
    assert normalize_retail_barcode(upca) == (f"0{upca}", "EAN13")
    assert normalize_retail_barcode(ean8) == (ean8, "EAN8")


def test_normalize_retail_barcode_rejects_invalid_check_digit() -> None:
    with pytest.raises(BarcodeValidationError):
        normalize_retail_barcode("3760211821910")


def test_parse_ingredients_preserves_top_level_groups_and_percentages() -> None:
    parser_version, items = parse_ingredients(
        "Farine de riz 82%, chocolat (sucre, beurre de cacao), sel",
        parser_version="ingredients_v1",
    )

    assert parser_version == "ingredients_v1"
    assert [item.ingredient_text_fr for item in items] == [
        "Farine de riz 82%",
        "chocolat (sucre, beurre de cacao)",
        "sel",
    ]
    assert items[0].normalized_name == "farine de riz"
    assert items[0].declared_share_pct == 82.0
    assert items[1].normalized_name == "chocolat sucre beurre de cacao"
    assert items[2].is_substantive is False


def test_choose_selected_candidate_requires_score_gap() -> None:
    confident = [
        ScoredCandidate(
            food_id="food-a",
            food_slug="riz",
            canonical_name_fr="Riz",
            canonical_name_en="Rice",
            score=0.82,
            confidence_tier="medium",
            match_method="ingredient_name",
            signal_breakdown={"ingredient_score": 1.0, "product_score": 0.5, "category_score": 0.0},
        ),
        ScoredCandidate(
            food_id="food-b",
            food_slug="mais",
            canonical_name_fr="Mais",
            canonical_name_en="Corn",
            score=0.68,
            confidence_tier="low",
            match_method="ingredient_name",
            signal_breakdown={"ingredient_score": 0.8, "product_score": 0.4, "category_score": 0.0},
        ),
    ]
    ambiguous = [
        ScoredCandidate(
            food_id="food-a",
            food_slug="riz",
            canonical_name_fr="Riz",
            canonical_name_en="Rice",
            score=0.80,
            confidence_tier="medium",
            match_method="ingredient_name",
            signal_breakdown={"ingredient_score": 1.0, "product_score": 0.4, "category_score": 0.0},
        ),
        ScoredCandidate(
            food_id="food-b",
            food_slug="mais",
            canonical_name_fr="Mais",
            canonical_name_en="Corn",
            score=0.74,
            confidence_tier="low",
            match_method="ingredient_name",
            signal_breakdown={"ingredient_score": 0.95, "product_score": 0.4, "category_score": 0.0},
        ),
    ]

    assert choose_selected_candidate(confident) is not None
    assert choose_selected_candidate(ambiguous) is None


def test_build_assessment_payload_returns_numeric_guidance_for_high_confidence_dominant_match() -> None:
    parsed_ingredients = [
        ParsedIngredient(
            line_no=1,
            ingredient_text_fr="riz 100%",
            normalized_name="riz",
            declared_share_pct=100.0,
            parse_confidence=0.98,
            is_substantive=True,
        )
    ]
    selected_rows = [
        {
            "line_no": 1,
            "declared_share_pct": 100.0,
            "is_substantive": True,
            "ingredient_text_fr": "riz 100%",
            "food_id": "food-riz",
            "food_slug": "riz",
            "canonical_name_fr": "Riz",
            "canonical_name_en": "Rice",
            "score": 0.91,
            "confidence_tier": "high",
        }
    ]
    payload = _build_assessment_payload(
        parsed_ingredients,
        selected_rows,
        {"food-riz": {"overall_level": "low", "rollup_serving_g": 90.0}},
        {
            "food-riz": [
                {
                    "subtype_code": "fructose",
                    "subtype_level": "low",
                    "low_max_g": 80.0,
                    "moderate_max_g": 120.0,
                    "burden_ratio": 0.25,
                }
            ]
        },
    )

    assert payload["assessment_status"] == "ready"
    assert payload["confidence_tier"] == "high"
    assert payload["numeric_guidance_status"] == "available"
    assert payload["numeric_guidance_basis"] == "dominant_matched_food"
    assert payload["heuristic_max_low_portion_g"] == 80.0
    assert payload["limiting_subtypes"] == ["fructose"]


def test_build_assessment_payload_blocks_numeric_guidance_for_mixed_ingredients() -> None:
    parsed_ingredients = [
        ParsedIngredient(1, "riz", "riz", None, 0.92, True),
        ParsedIngredient(2, "pois chiche", "pois chiche", None, 0.92, True),
    ]
    selected_rows = [
        {
            "line_no": 1,
            "declared_share_pct": None,
            "is_substantive": True,
            "ingredient_text_fr": "riz",
            "food_id": "food-riz",
            "food_slug": "riz",
            "canonical_name_fr": "Riz",
            "canonical_name_en": "Rice",
            "score": 0.88,
            "confidence_tier": "high",
        },
        {
            "line_no": 2,
            "declared_share_pct": None,
            "is_substantive": True,
            "ingredient_text_fr": "pois chiche",
            "food_id": "food-pois",
            "food_slug": "pois-chiche",
            "canonical_name_fr": "Pois chiche",
            "canonical_name_en": "Chickpea",
            "score": 0.83,
            "confidence_tier": "medium",
        },
    ]
    payload = _build_assessment_payload(
        parsed_ingredients,
        selected_rows,
        {
            "food-riz": {"overall_level": "low", "rollup_serving_g": 90.0},
            "food-pois": {"overall_level": "moderate", "rollup_serving_g": 60.0},
        },
        {
            "food-riz": [],
            "food-pois": [
                {
                    "subtype_code": "gos",
                    "subtype_level": "moderate",
                    "low_max_g": 42.0,
                    "moderate_max_g": 60.0,
                    "burden_ratio": 0.75,
                }
            ],
        },
    )

    assert payload["assessment_status"] == "ready"
    assert payload["confidence_tier"] == "medium"
    assert payload["heuristic_overall_level"] == "moderate"
    assert payload["numeric_guidance_status"] == "mixed_ingredients"
    assert any("Multiple substantive ingredients" in caveat for caveat in payload["caveats"])


def test_build_assessment_payload_ignores_non_substantive_matches() -> None:
    parsed_ingredients = [
        ParsedIngredient(1, "riz 95%", "riz", 95.0, 0.98, True),
        ParsedIngredient(2, "sel", "sel", None, 0.99, False),
    ]
    selected_rows = [
        {
            "line_no": 1,
            "declared_share_pct": 95.0,
            "is_substantive": True,
            "ingredient_text_fr": "riz 95%",
            "food_id": "food-riz",
            "food_slug": "riz",
            "canonical_name_fr": "Riz",
            "canonical_name_en": "Rice",
            "score": 0.91,
            "confidence_tier": "high",
        },
        {
            "line_no": 2,
            "declared_share_pct": None,
            "is_substantive": False,
            "ingredient_text_fr": "sel",
            "food_id": "food-sel",
            "food_slug": "sel",
            "canonical_name_fr": "Sel",
            "canonical_name_en": "Salt",
            "score": 0.89,
            "confidence_tier": "high",
        },
    ]
    payload = _build_assessment_payload(
        parsed_ingredients,
        selected_rows,
        {
            "food-riz": {"overall_level": "low", "rollup_serving_g": 90.0},
            "food-sel": {"overall_level": "high", "rollup_serving_g": 5.0},
        },
        {
            "food-riz": [
                {
                    "subtype_code": "fructose",
                    "subtype_level": "low",
                    "low_max_g": 80.0,
                    "moderate_max_g": 120.0,
                    "burden_ratio": 0.25,
                }
            ],
            "food-sel": [
                {
                    "subtype_code": "gos",
                    "subtype_level": "high",
                    "low_max_g": 5.0,
                    "moderate_max_g": 10.0,
                    "burden_ratio": 1.0,
                }
            ],
        },
    )

    assert payload["assessment_status"] == "ready"
    assert payload["heuristic_overall_level"] == "low"
    assert payload["limiting_subtypes"] == ["fructose"]
    assert all(subtype["subtype_code"] != "gos" for subtype in payload["subtypes"])
    assert payload["numeric_guidance_status"] == "available"


def test_build_assessment_payload_prefers_more_restrictive_subtype_on_severity_tie() -> None:
    parsed_ingredients = [
        ParsedIngredient(1, "sirop de glucose 60%", "sirop de glucose", 60.0, 0.96, True),
        ParsedIngredient(2, "miel 40%", "miel", 40.0, 0.96, True),
    ]
    selected_rows = [
        {
            "line_no": 1,
            "declared_share_pct": 60.0,
            "is_substantive": True,
            "ingredient_text_fr": "sirop de glucose 60%",
            "food_id": "food-a",
            "food_slug": "sirop",
            "canonical_name_fr": "Sirop",
            "canonical_name_en": "Syrup",
            "score": 0.9,
            "confidence_tier": "high",
        },
        {
            "line_no": 2,
            "declared_share_pct": 40.0,
            "is_substantive": True,
            "ingredient_text_fr": "miel 40%",
            "food_id": "food-b",
            "food_slug": "miel",
            "canonical_name_fr": "Miel",
            "canonical_name_en": "Honey",
            "score": 0.86,
            "confidence_tier": "medium",
        },
    ]
    payload = _build_assessment_payload(
        parsed_ingredients,
        selected_rows,
        {
            "food-a": {"overall_level": "moderate", "rollup_serving_g": 40.0},
            "food-b": {"overall_level": "moderate", "rollup_serving_g": 30.0},
        },
        {
            "food-a": [
                {
                    "subtype_code": "fructose",
                    "subtype_level": "moderate",
                    "low_max_g": 70.0,
                    "moderate_max_g": 90.0,
                    "burden_ratio": 0.55,
                }
            ],
            "food-b": [
                {
                    "subtype_code": "fructose",
                    "subtype_level": "moderate",
                    "low_max_g": 35.0,
                    "moderate_max_g": 55.0,
                    "burden_ratio": 0.85,
                }
            ],
        },
    )

    fructose = next(subtype for subtype in payload["subtypes"] if subtype["subtype_code"] == "fructose")
    assert fructose["source_food_id"] == "food-b"
    assert fructose["low_max_g"] == 35.0
    assert fructose["moderate_max_g"] == 55.0
    assert fructose["burden_ratio"] == 0.85


class _RecordingCursor:
    def __init__(self, result):
        self._result = result

    def fetchone(self):
        return self._result

    def fetchall(self):
        return self._result


class _RecordingConnection:
    def __init__(self, result):
        self.result = result
        self.queries: list[str] = []

    def execute(self, query, params):
        self.queries.append(" ".join(query.split()))
        return _RecordingCursor(self.result)


def test_food_rollup_reads_published_api_view() -> None:
    conn = _RecordingConnection({"food_id": "food-riz", "overall_level": "low"})

    _get_food_rollup(conn, "food-riz")

    assert "FROM api_food_rollups_current" in conn.queries[0]
    assert "v_phase3_rollups_latest_full" not in conn.queries[0]


def test_food_subtypes_read_published_api_view() -> None:
    conn = _RecordingConnection([])

    _get_food_subtypes(conn, "food-riz")

    assert "FROM api_food_subtypes_current" in conn.queries[0]
    assert "v_phase3_rollup_subtype_levels_latest" not in conn.queries[0]


class _StubOpenFoodFactsClient:
    def __init__(self, fetch_result: OpenFoodFactsFetchResult) -> None:
        self._fetch_result = fetch_result

    def fetch_product(self, normalized_code: str) -> OpenFoodFactsFetchResult:
        return self._fetch_result


class _StatusCheckingOpenFoodFactsClient(_StubOpenFoodFactsClient):
    def __init__(self, db_url: str, watched_code: str, fetch_result: OpenFoodFactsFetchResult) -> None:
        super().__init__(fetch_result)
        self._db_url = db_url
        self._watched_code = watched_code
        self.seen_status: str | None = None

    def fetch_product(self, normalized_code: str) -> OpenFoodFactsFetchResult:
        with psycopg.connect(self._db_url, row_factory=dict_row) as conn:
            row = conn.execute(
                "SELECT status FROM product_refresh_requests WHERE normalized_code = %s",
                (self._watched_code,),
            ).fetchone()
        self.seen_status = row["status"] if row is not None else None
        return super().fetch_product(normalized_code)


def _source_id(conn: psycopg.Connection, source_slug: str) -> str:
    row = conn.execute("SELECT source_id FROM sources WHERE source_slug = %s", (source_slug,)).fetchone()
    assert row is not None
    return str(row["source_id"])


def _sample_food(conn: psycopg.Connection) -> dict[str, str]:
    rollup_view = "api_food_rollups_current"
    relation_row = conn.execute("SELECT to_regclass('public.api_food_rollups_current') AS relation_name").fetchone()
    if relation_row["relation_name"] is None:
        rollup_view = "v_phase3_rollups_latest_full"
    row = conn.execute(
        f"""
        SELECT
          f.food_id,
          f.food_slug,
          COALESCE(f.canonical_name_fr, f.food_slug) AS canonical_name_fr,
          COALESCE(f.canonical_name_en, COALESCE(f.canonical_name_fr, f.food_slug)) AS canonical_name_en
        FROM {rollup_view} v
        JOIN foods f ON f.food_id = v.food_id
        WHERE v.overall_level <> 'unknown'
        ORDER BY v.coverage_ratio DESC, f.food_slug ASC
        LIMIT 1
        """
    ).fetchone()
    assert row is not None
    return {
        "food_id": str(row["food_id"]),
        "food_slug": row["food_slug"],
        "canonical_name_fr": row["canonical_name_fr"],
        "canonical_name_en": row["canonical_name_en"],
    }


def _sample_subtype_row(conn: psycopg.Connection, food_id: str) -> dict[str, object]:
    subtype_view = "api_food_subtypes_current"
    relation_row = conn.execute("SELECT to_regclass('public.api_food_subtypes_current') AS relation_name").fetchone()
    if relation_row["relation_name"] is None:
        subtype_view = "v_phase3_rollup_subtype_levels_latest"
    row = conn.execute(
        f"""
        SELECT
          subtype_code,
          subtype_level::text AS subtype_level,
          low_max_g,
          moderate_max_g,
          burden_ratio
        FROM {subtype_view}
        WHERE food_id = %s
        ORDER BY (low_max_g IS NULL) ASC, subtype_code ASC
        LIMIT 1
        """,
        (food_id,),
    ).fetchone()
    if row is not None:
        return dict(row)

    fallback = conn.execute(
        """
        SELECT code AS subtype_code
        FROM fodmap_subtypes
        ORDER BY sort_order ASC, code ASC
        LIMIT 1
        """
    ).fetchone()
    assert fallback is not None
    return {
        "subtype_code": fallback["subtype_code"],
        "subtype_level": "low",
        "low_max_g": 80.0,
        "moderate_max_g": 120.0,
        "burden_ratio": 0.25,
    }


def _cleanup_product_bundle(db_url: str, *, normalized_code: str, product_id: UUID | None = None) -> None:
    with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
        conn.execute(
            "DELETE FROM product_review_events WHERE normalized_code = %s OR product_id = %s",
            (normalized_code, product_id),
        )
        conn.execute("DELETE FROM product_refresh_requests WHERE normalized_code = %s", (normalized_code,))
        conn.execute(
            "DELETE FROM product_provider_snapshots WHERE normalized_code = %s OR product_id = %s",
            (normalized_code, product_id),
        )
        conn.execute("DELETE FROM product_codes WHERE normalized_code = %s", (normalized_code,))
        if product_id is not None:
            conn.execute("DELETE FROM product_food_links WHERE product_id = %s", (product_id,))
            conn.execute("DELETE FROM products WHERE product_id = %s", (product_id,))


def _seed_product_bundle(
    db_url: str,
    *,
    normalized_code: str,
    provider_status: str = "found",
    stale: bool = False,
    include_product: bool = True,
    include_assessment: bool = True,
) -> UUID | None:
    now = datetime.now(timezone.utc)
    expires_at = now - timedelta(hours=2) if stale else now + timedelta(hours=48)

    with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
        source_id = _source_id(conn, "open_food_facts")
        food = _sample_food(conn)
        subtype = _sample_subtype_row(conn, food["food_id"])

        product_id = uuid4() if include_product else None
        if include_product:
            conn.execute(
                """
                INSERT INTO products (
                  product_id,
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
                  %(product_id)s,
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
                  %(updated_at)s
                )
                """,
                {
                    "product_id": product_id,
                    "gtin13": normalized_code if len(normalized_code) == 13 else None,
                    "open_food_facts_code": normalized_code,
                    "product_name_fr": "Produit test riz",
                    "product_name_en": "Rice test product",
                    "brand": "Codex",
                    "categories_tags": ["en:rice-products"],
                    "countries_tags": ["en:france"],
                    "ingredients_text_fr": "riz 100%",
                    "source_id": source_id,
                    "last_synced_at": now,
                    "updated_at": now,
                },
            )
            conn.execute(
                """
                INSERT INTO product_codes (
                  normalized_code,
                  product_id,
                  canonical_format,
                  source_code,
                  provider_source_id,
                  updated_at
                ) VALUES (%s, %s, 'EAN13', %s, %s, %s)
                """,
                (normalized_code, product_id, normalized_code, source_id, now),
            )

        conn.execute(
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
              %(product_id)s,
              'EAN13',
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
            """,
            {
                "normalized_code": normalized_code,
                "product_id": product_id,
                "provider_source_id": source_id,
                "fetch_status": provider_status,
                "provider_payload": Jsonb({"code": normalized_code, "status": 1 if provider_status == "found" else 0}),
                "source_code": normalized_code,
                "product_name_fr": "Produit test riz" if include_product else None,
                "product_name_en": "Rice test product" if include_product else None,
                "brand": "Codex" if include_product else None,
                "ingredients_text_fr": "riz 100%" if include_product else None,
                "categories_tags": ["en:rice-products"] if include_product else [],
                "countries_tags": ["en:france"] if include_product else [],
                "fetched_at": now,
                "expires_at": expires_at,
                "last_error_code": "network_error" if provider_status == "error" else None,
            },
        )

        if include_product:
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
                ) VALUES (%s, 1, 'riz 100%%', 'riz', 100.0, 'ingredients_v1', 0.980, true)
                """,
                (product_id,),
            )
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
                  1,
                  %(food_id)s,
                  1,
                  'ingredient_name',
                  0.910,
                  'high',
                  %(signal_breakdown)s,
                  'products_guided_v1',
                  true
                )
                """,
                {
                    "product_id": product_id,
                    "food_id": food["food_id"],
                    "signal_breakdown": Jsonb(
                        {
                            "ingredient_score": 1.0,
                            "product_score": 0.64,
                            "category_score": 0.2,
                            "heuristic_version": "products_guided_v1",
                        }
                    ),
                },
            )
            conn.execute(
                """
                INSERT INTO product_food_links (
                  product_id,
                  food_id,
                  link_method,
                  link_confidence
                ) VALUES (%s, %s, 'heuristic', 0.910)
                """,
                (product_id, food["food_id"]),
            )

        if include_product and include_assessment:
            assessment_id = conn.execute(
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
                  'products_guided_v1',
                  'guided',
                  'guided',
                  'ready',
                  'high',
                  'low',
                  80.0,
                  'available',
                  'dominant_matched_food',
                  %(dominant_food_id)s,
                  1,
                  ARRAY[%(subtype_code)s]::text[],
                  ARRAY['Guided assessment based on product ingredient matching.']::text[],
                  %(provider_source_id)s,
                  %(provider_last_synced_at)s,
                  %(computed_at)s,
                  %(updated_at)s
                )
                RETURNING product_assessment_id
                """,
                {
                    "product_id": product_id,
                    "dominant_food_id": food["food_id"],
                    "subtype_code": subtype["subtype_code"],
                    "provider_source_id": source_id,
                    "provider_last_synced_at": now,
                    "computed_at": now,
                    "updated_at": now,
                },
            ).fetchone()["product_assessment_id"]
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
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    assessment_id,
                    subtype["subtype_code"],
                    subtype["subtype_level"],
                    food["food_id"],
                    subtype.get("low_max_g") or 80.0,
                    subtype.get("moderate_max_g") or 120.0,
                    subtype.get("burden_ratio"),
                ),
            )

    return product_id


@pytest.mark.integration
def test_product_lookup_queues_refresh_and_dedupes_within_cooldown(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456789")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)

    try:
        first = client.get(f"/v0/products/barcodes/{normalized_code}")
        assert first.status_code == 200
        first_payload = first.json()
        assert first_payload["lookup_status"] == "queued"
        assert first_payload["refresh_enqueued"] is True
        assert first_payload["product"] is None

        old_requested_at = datetime(2026, 3, 1, 9, 0, tzinfo=timezone.utc)
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            conn.execute(
                """
                UPDATE product_refresh_requests
                SET last_requested_at = %s,
                    cooldown_until = %s,
                    updated_at = %s
                WHERE normalized_code = %s
                """,
                (
                    old_requested_at,
                    datetime.now(timezone.utc) + timedelta(minutes=10),
                    old_requested_at,
                    normalized_code,
                ),
            )

        second = client.get(f"/v0/products/barcodes/{normalized_code}")
        assert second.status_code == 200
        second_payload = second.json()
        assert second_payload["lookup_status"] == "queued"
        assert second_payload["refresh_enqueued"] is False

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            row = conn.execute(
                """
                SELECT normalized_code, canonical_format, status, attempt_count
                     , last_requested_at
                FROM product_refresh_requests
                WHERE normalized_code = %s
                """,
                (normalized_code,),
            ).fetchone()
        assert row is not None
        assert row["normalized_code"] == normalized_code
        assert row["canonical_format"] == "EAN13"
        assert row["status"] == "queued"
        assert row["attempt_count"] == 0
        assert row["last_requested_at"] == old_requested_at
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code)


@pytest.mark.integration
def test_stale_product_detail_does_not_requeue_processing_refresh(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456783")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    product_id = _seed_product_bundle(db_url, normalized_code=normalized_code, stale=True)
    assert product_id is not None

    old_requested_at = datetime(2026, 3, 1, 9, 0, tzinfo=timezone.utc)
    try:
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            source_id = _source_id(conn, "open_food_facts")
            conn.execute(
                """
                INSERT INTO product_refresh_requests (
                  normalized_code,
                  canonical_format,
                  provider_source_id,
                  product_id,
                  status,
                  requested_at,
                  last_requested_at,
                  refresh_after,
                  cooldown_until,
                  updated_at
                ) VALUES (
                  %s,
                  'EAN13',
                  %s,
                  %s,
                  'processing',
                  %s,
                  %s,
                  %s,
                  %s,
                  %s
                )
                ON CONFLICT (normalized_code) DO UPDATE SET
                  product_id = EXCLUDED.product_id,
                  status = 'processing',
                  requested_at = EXCLUDED.requested_at,
                  last_requested_at = EXCLUDED.last_requested_at,
                  refresh_after = EXCLUDED.refresh_after,
                  cooldown_until = EXCLUDED.cooldown_until,
                  updated_at = EXCLUDED.updated_at
                """,
                (
                    normalized_code,
                    source_id,
                    product_id,
                    old_requested_at,
                    old_requested_at,
                    old_requested_at,
                    old_requested_at,
                    old_requested_at,
                ),
            )

        response = client.get(f"/v0/products/{product_id}")
        assert response.status_code == 200
        payload = response.json()
        assert payload["sync_state"] == "refreshing"
        assert payload["refresh_enqueued"] is False

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            refresh = conn.execute(
                """
                SELECT status, last_requested_at
                FROM product_refresh_requests
                WHERE normalized_code = %s
                """,
                (normalized_code,),
            ).fetchone()
        assert refresh is not None
        assert refresh["status"] == "processing"
        assert refresh["last_requested_at"] == old_requested_at
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code, product_id=product_id)


@pytest.mark.integration
@pytest.mark.parametrize("suffix", ["ingredients", "assessment"])
def test_stale_product_subresource_enqueues_refresh(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
    suffix: str,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456784")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    product_id = _seed_product_bundle(db_url, normalized_code=normalized_code, stale=True)
    assert product_id is not None

    try:
        response = client.get(f"/v0/products/{product_id}/{suffix}")
        assert response.status_code == 200

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            refresh = conn.execute(
                """
                SELECT status, product_id
                FROM product_refresh_requests
                WHERE normalized_code = %s
                """,
                (normalized_code,),
            ).fetchone()

        assert refresh is not None
        assert refresh["status"] == "queued"
        assert str(refresh["product_id"]) == str(product_id)
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code, product_id=product_id)


@pytest.mark.integration
def test_guided_product_endpoints_return_compiled_state(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456788")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    product_id = _seed_product_bundle(db_url, normalized_code=normalized_code)
    assert product_id is not None

    try:
        lookup = client.get(f"/v0/products/barcodes/{normalized_code}")
        assert lookup.status_code == 200
        lookup_payload = lookup.json()
        assert lookup_payload["lookup_status"] == "ready"
        assert lookup_payload["refresh_enqueued"] is False
        assert lookup_payload["product"]["product_id"] == str(product_id)

        product = client.get(f"/v0/products/{product_id}")
        assert product.status_code == 200
        product_payload = product.json()
        assert product_payload["contract_tier"] == "guided"
        assert product_payload["sync_state"] == "fresh"
        assert product_payload["primary_normalized_code"] == normalized_code
        assert product_payload["assessment_available"] is True
        assert product_payload["assessment_status"] == "ready"

        ingredients = client.get(f"/v0/products/{product_id}/ingredients")
        assert ingredients.status_code == 200
        ingredients_payload = ingredients.json()
        assert ingredients_payload["contract_tier"] == "guided"
        assert ingredients_payload["parser_version"] == "ingredients_v1"
        assert ingredients_payload["total"] == 1
        assert ingredients_payload["items"][0]["candidates"][0]["is_selected"] is True

        assessment = client.get(f"/v0/products/{product_id}/assessment")
        assert assessment.status_code == 200
        assessment_payload = assessment.json()
        assert assessment_payload["contract_tier"] == "guided"
        assert assessment_payload["assessment_mode"] == "guided"
        assert assessment_payload["numeric_guidance_status"] == "available"
        assert assessment_payload["heuristic_max_low_portion_g"] == 80.0
        assert assessment_payload["subtypes"]
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code, product_id=product_id)


@pytest.mark.integration
def test_stale_product_detail_enqueues_refresh_without_inline_fetch(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456787")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    product_id = _seed_product_bundle(db_url, normalized_code=normalized_code, stale=True)
    assert product_id is not None

    try:
        response = client.get(f"/v0/products/{product_id}")
        assert response.status_code == 200
        payload = response.json()
        assert payload["sync_state"] == "stale"
        assert payload["refresh_enqueued"] is True

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            refresh = conn.execute(
                """
                SELECT status, product_id
                FROM product_refresh_requests
                WHERE normalized_code = %s
                """,
                (normalized_code,),
            ).fetchone()
        assert refresh is not None
        assert refresh["status"] == "queued"
        assert UUID(str(refresh["product_id"])) == product_id
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code, product_id=product_id)


@pytest.mark.integration
def test_product_lookup_reports_not_found_from_fresh_provider_snapshot(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456786")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    _seed_product_bundle(
        db_url,
        normalized_code=normalized_code,
        provider_status="not_found",
        include_product=False,
        include_assessment=False,
    )

    try:
        response = client.get(f"/v0/products/barcodes/{normalized_code}")
        assert response.status_code == 200
        payload = response.json()
        assert payload["lookup_status"] == "not_found"
        assert payload["refresh_enqueued"] is False
        assert payload["product"] is None
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code)


@pytest.mark.integration
def test_process_refresh_request_clears_stale_product_mapping_on_not_found(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456784")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    product_id = _seed_product_bundle(db_url, normalized_code=normalized_code)
    assert product_id is not None

    now = datetime.now(timezone.utc)
    try:
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            source_id = _source_id(conn, "open_food_facts")
            conn.execute(
                """
                INSERT INTO product_refresh_requests (
                  normalized_code,
                  canonical_format,
                  provider_source_id,
                  product_id,
                  status,
                  requested_at,
                  last_requested_at,
                  refresh_after,
                  cooldown_until,
                  updated_at
                ) VALUES (
                  %s,
                  'EAN13',
                  %s,
                  %s,
                  'queued',
                  %s,
                  %s,
                  %s,
                  %s,
                  %s
                )
                ON CONFLICT (normalized_code) DO UPDATE SET
                  product_id = EXCLUDED.product_id,
                  status = 'queued',
                  refresh_after = EXCLUDED.refresh_after,
                  cooldown_until = EXCLUDED.cooldown_until,
                  updated_at = EXCLUDED.updated_at
                """,
                (normalized_code, source_id, product_id, now, now, now, now, now),
            )

        client_stub = _StubOpenFoodFactsClient(
            OpenFoodFactsFetchResult(
                provider_status="not_found",
                fetched_at=now,
                payload={"status": 0, "code": normalized_code},
                source_code=normalized_code,
                product_name_fr=None,
                product_name_en=None,
                brand=None,
                ingredients_text_fr=None,
                categories_tags=[],
                countries_tags=[],
                last_error_code=None,
            )
        )

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            with conn.transaction():
                result = process_refresh_request(
                    conn,
                    normalized_code=normalized_code,
                    canonical_format="EAN13",
                    stale_after_hours=72,
                    refresh_cooldown_seconds=900,
                    client=client_stub,
                )

        assert result["status"] == "not_found"

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            code_row = conn.execute(
                "SELECT 1 FROM product_codes WHERE normalized_code = %s",
                (normalized_code,),
            ).fetchone()
            product_row = conn.execute(
                "SELECT 1 FROM products WHERE product_id = %s",
                (product_id,),
            ).fetchone()

        assert code_row is None
        assert product_row is None

        lookup = client.get(f"/v0/products/barcodes/{normalized_code}")
        assert lookup.status_code == 200
        lookup_payload = lookup.json()
        assert lookup_payload["lookup_status"] == "not_found"
        assert lookup_payload["product"] is None

        product = client.get(f"/v0/products/{product_id}")
        assert product.status_code == 404
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code, product_id=product_id)


@pytest.mark.integration
def test_drain_refresh_requests_claims_processing_before_fetch(
    db_url: str,
    integration_guard,
    products_schema,
) -> None:
    normalized_code = _ean13("990123456782")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    now = datetime.now(timezone.utc)

    try:
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            source_id = _source_id(conn, "open_food_facts")
            conn.execute(
                """
                INSERT INTO product_refresh_requests (
                  normalized_code,
                  canonical_format,
                  provider_source_id,
                  product_id,
                  status,
                  requested_at,
                  last_requested_at,
                  refresh_after,
                  cooldown_until,
                  updated_at
                ) VALUES (
                  %s,
                  'EAN13',
                  %s,
                  NULL,
                  'queued',
                  %s,
                  %s,
                  %s,
                  %s,
                  %s
                )
                """,
                (normalized_code, source_id, now, now, now, now, now),
            )

        client_stub = _StatusCheckingOpenFoodFactsClient(
            db_url=db_url,
            watched_code=normalized_code,
            fetch_result=OpenFoodFactsFetchResult(
                provider_status="not_found",
                fetched_at=now,
                payload={"status": 0, "code": normalized_code},
                source_code=normalized_code,
                product_name_fr=None,
                product_name_en=None,
                brand=None,
                ingredients_text_fr=None,
                categories_tags=[],
                countries_tags=[],
                last_error_code=None,
            ),
        )

        results = drain_refresh_requests(
            CompileSettings(
                db_url=db_url,
                stale_after_hours=72,
                refresh_cooldown_seconds=3600,
            ),
            client=client_stub,
            limit=1,
        )

        assert results[0]["status"] == "not_found"
        assert client_stub.seen_status == "processing"

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            refresh = conn.execute(
                "SELECT status FROM product_refresh_requests WHERE normalized_code = %s",
                (normalized_code,),
            ).fetchone()
        assert refresh is not None
        assert refresh["status"] == "completed"
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code)


@pytest.mark.integration
def test_process_refresh_request_backoffs_failed_refreshes(
    db_url: str,
    integration_guard,
    products_schema,
) -> None:
    normalized_code = _ean13("990123456780")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    now = datetime(2026, 3, 22, 12, 0, tzinfo=timezone.utc)

    try:
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            source_id = _source_id(conn, "open_food_facts")
            conn.execute(
                """
                INSERT INTO product_refresh_requests (
                  normalized_code,
                  canonical_format,
                  provider_source_id,
                  status,
                  requested_at,
                  last_requested_at,
                  refresh_after,
                  cooldown_until,
                  updated_at
                ) VALUES (
                  %s,
                  'EAN13',
                  %s,
                  'queued',
                  %s,
                  %s,
                  %s,
                  %s,
                  %s
                )
                """,
                (normalized_code, source_id, now, now, now, now, now),
            )

        client_stub = _StubOpenFoodFactsClient(
            OpenFoodFactsFetchResult(
                provider_status="error",
                fetched_at=now,
                payload={"status": 0, "code": normalized_code},
                source_code=normalized_code,
                product_name_fr=None,
                product_name_en=None,
                brand=None,
                ingredients_text_fr=None,
                categories_tags=[],
                countries_tags=[],
                last_error_code="upstream_timeout",
            )
        )

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            with conn.transaction():
                result = process_refresh_request(
                    conn,
                    normalized_code=normalized_code,
                    canonical_format="EAN13",
                    stale_after_hours=72,
                    refresh_cooldown_seconds=900,
                    client=client_stub,
                )

        assert result["status"] == "failed"

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            refresh = conn.execute(
                """
                SELECT status, last_error_code, refresh_after, cooldown_until
                FROM product_refresh_requests
                WHERE normalized_code = %s
                """,
                (normalized_code,),
            ).fetchone()

        assert refresh is not None
        assert refresh["status"] == "failed"
        assert refresh["last_error_code"] == "upstream_timeout"
        assert refresh["refresh_after"] == now + timedelta(seconds=900)
        assert refresh["cooldown_until"] == now + timedelta(seconds=900)
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code)


@pytest.mark.integration
def test_replace_product_links_preserves_curated_link_for_same_food(
    db_url: str,
    integration_guard,
    products_schema,
) -> None:
    normalized_code = _ean13("990123456781")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    product_id = _seed_product_bundle(db_url, normalized_code=normalized_code, include_assessment=False)
    assert product_id is not None

    try:
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            food = _sample_food(conn)
            conn.execute("DELETE FROM product_food_links WHERE product_id = %s", (product_id,))
            conn.execute(
                """
                INSERT INTO product_food_links (
                  product_id,
                  food_id,
                  link_method,
                  link_confidence
                ) VALUES (%s, %s, 'manual', 1.000)
                """,
                (product_id, food["food_id"]),
            )

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            with conn.transaction():
                _replace_product_links(
                    conn,
                    str(product_id),
                    [
                        {
                            "line_no": 1,
                            "declared_share_pct": 100.0,
                            "is_substantive": True,
                            "ingredient_text_fr": "riz 100%",
                            "food_id": food["food_id"],
                            "food_slug": food["food_slug"],
                            "canonical_name_fr": food["canonical_name_fr"],
                            "canonical_name_en": food["canonical_name_en"],
                            "score": 0.91,
                            "confidence_tier": "high",
                        }
                    ],
                )

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            link = conn.execute(
                """
                SELECT link_method, link_confidence
                FROM product_food_links
                WHERE product_id = %s
                  AND food_id = %s
                """,
                (product_id, food["food_id"]),
            ).fetchone()

        assert link is not None
        assert link["link_method"] == "manual"
        assert float(link["link_confidence"]) == pytest.approx(1.0)
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code, product_id=product_id)


@pytest.mark.integration
def test_product_lookup_reports_failed_state_after_provider_error(
    client,
    db_url: str,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")
    normalized_code = _ean13("990123456785")
    _cleanup_product_bundle(db_url, normalized_code=normalized_code)
    _seed_product_bundle(
        db_url,
        normalized_code=normalized_code,
        provider_status="error",
        include_product=False,
        include_assessment=False,
    )

    try:
        response = client.get(f"/v0/products/barcodes/{normalized_code}")
        assert response.status_code == 200
        payload = response.json()
        assert payload["lookup_status"] == "failed"
        assert payload["refresh_enqueued"] is True

        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            refresh = conn.execute(
                "SELECT status FROM product_refresh_requests WHERE normalized_code = %s",
                (normalized_code,),
            ).fetchone()
        assert refresh is not None
        assert refresh["status"] == "queued"
    finally:
        _cleanup_product_bundle(db_url, normalized_code=normalized_code)


@pytest.mark.integration
def test_invalid_product_barcode_returns_422(
    client,
    integration_guard,
    products_schema,
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRODUCTS_FEATURE_ENABLED", "true")

    response = client.get("/v0/products/barcodes/1234567890123")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_barcode"
