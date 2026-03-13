from __future__ import annotations

from pathlib import Path

import psycopg
import pytest
from psycopg.rows import dict_row

pytestmark = pytest.mark.integration


APPROVED_COHORTS = {"cohort_oil_fat", "cohort_plain_protein", "cohort_egg"}
SAFE_HARBOR_APPLY_PATH = (
    Path(__file__).resolve().parents[2] / "etl" / "phase3" / "sql" / "phase3_safe_harbor_v1_apply.sql"
)
SAFE_HARBOR_CHECKS_PATH = (
    Path(__file__).resolve().parents[2] / "etl" / "phase3" / "sql" / "phase3_safe_harbor_v1_checks.sql"
)


def _assignment_counts(db_conn) -> dict[str, int]:
    rows = db_conn.execute(
        """
        SELECT cohort_code, COUNT(*)::int AS item_count
        FROM food_safe_harbor_assignments
        WHERE assignment_version = 'safe_harbor_v1'
        GROUP BY cohort_code
        ORDER BY cohort_code
        """
    ).fetchall()
    return {row["cohort_code"]: row["item_count"] for row in rows}


def _pack_contract_rows(db_conn) -> list[dict]:
    return db_conn.execute(
        """
        WITH ciqual_nutrient_candidates AS (
          SELECT
            fno.food_id,
            nd.nutrient_code,
            fno.comparator,
            fno.amount_value,
            ROW_NUMBER() OVER (
              PARTITION BY fno.food_id, nd.nutrient_code
              ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC
            ) AS rn
          FROM food_nutrient_observations fno
          JOIN nutrient_definitions nd ON nd.nutrient_id = fno.nutrient_id
          JOIN sources s ON s.source_id = fno.source_id
          WHERE s.source_slug = 'ciqual_2025'
            AND nd.nutrient_code IN ('CIQUAL_32000', 'CIQUAL_32210', 'CIQUAL_32250', 'CIQUAL_32410', 'CIQUAL_34000')
            AND fno.basis = 'per_100g'
            AND fno.amount_value IS NOT NULL
        ),
        ciqual_nutrient_latest AS (
          SELECT
            food_id,
            nutrient_code,
            comparator,
            amount_value
          FROM ciqual_nutrient_candidates
          WHERE rn = 1
        ),
        nutrient_basis AS (
          SELECT
            food_id,
            COUNT(*) FILTER (
              WHERE nutrient_code = 'CIQUAL_32000'
                AND comparator = 'eq'
                AND amount_value = 0
            )::int AS sugar_zero_count,
            COUNT(*) FILTER (
              WHERE nutrient_code = 'CIQUAL_32210'
                AND comparator = 'eq'
                AND amount_value = 0
            )::int AS fructose_zero_count,
            COUNT(*) FILTER (
              WHERE nutrient_code = 'CIQUAL_32250'
                AND comparator = 'eq'
                AND amount_value = 0
            )::int AS glucose_zero_count,
            COUNT(*) FILTER (
              WHERE nutrient_code = 'CIQUAL_32410'
                AND comparator = 'eq'
                AND amount_value = 0
            )::int AS lactose_zero_count,
            COUNT(*) FILTER (
              WHERE nutrient_code = 'CIQUAL_34000'
                AND comparator = 'eq'
                AND amount_value = 0
            )::int AS polyols_zero_count
          FROM ciqual_nutrient_latest
          GROUP BY food_id
        ),
        measurement_pack AS (
          SELECT
            a.food_id,
            a.cohort_code,
            f.food_slug,
            a.assignment_method,
            COUNT(DISTINCT fs.code) FILTER (
              WHERE m.is_current = TRUE
                AND m.comparator = 'eq'
                AND m.amount_g_per_100g = 0
                AND m.amount_g_per_serving = 0
                AND m.notes LIKE 'safe_harbor_v1:composition_zero;%'
            )::int AS subtype_count,
            COUNT(*) FILTER (
              WHERE (
                fs.code IN ('fructan', 'gos')
                AND m.method <> 'expert_estimate'
              )
              OR (
                fs.code IN ('fructose', 'lactose', 'sorbitol', 'mannitol')
                AND m.method <> 'derived_from_nutrient'
              )
            )::int AS bad_method_rows
          FROM food_safe_harbor_assignments a
          JOIN foods f ON f.food_id = a.food_id
          LEFT JOIN food_fodmap_measurements m ON m.food_id = a.food_id
          LEFT JOIN fodmap_subtypes fs ON fs.fodmap_subtype_id = m.fodmap_subtype_id
          WHERE a.assignment_version = 'safe_harbor_v1'
          GROUP BY a.food_id, a.cohort_code, f.food_slug, a.assignment_method
        ),
        pack_rows AS (
          SELECT
            mp.cohort_code,
            mp.food_slug,
            mp.assignment_method,
            mp.subtype_count,
            nb.sugar_zero_count,
            nb.fructose_zero_count,
            nb.glucose_zero_count,
            nb.lactose_zero_count,
            nb.polyols_zero_count,
            mp.bad_method_rows
          FROM measurement_pack mp
          LEFT JOIN nutrient_basis nb ON nb.food_id = mp.food_id
        )
        SELECT *
        FROM pack_rows
        ORDER BY cohort_code, food_slug
        """
    ).fetchall()


def _apply_safe_harbor_contract(db_url: str) -> None:
    apply_sql = SAFE_HARBOR_APPLY_PATH.read_text(encoding="utf-8")
    checks_sql = SAFE_HARBOR_CHECKS_PATH.read_text(encoding="utf-8")
    with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
        conn.execute(apply_sql)
        conn.execute(checks_sql)


def test_list_safe_harbors(client, db_conn, integration_guard, safe_harbor_schema) -> None:
    expected_counts = _assignment_counts(db_conn)

    response = client.get("/v0/safe-harbors")
    assert response.status_code == 200

    payload = response.json()
    assert payload["meta"]["cohort_rule_source_slug"] == "internal_rules_v1"
    assert payload["meta"]["cohort_rule_version"] == "safe_harbor_v1"
    assert payload["meta"]["data_source_slug"] == "ciqual_2025"
    assert payload["meta"]["data_source_name"] == "ANSES CIQUAL 2025"
    assert payload["meta"]["data_source_version"]
    assert payload["meta"]["attribution"].startswith("Source: Anses")
    assert "approbation" in payload["meta"]["no_endorsement_notice"].lower()

    cohort_codes = {cohort["cohort_code"] for cohort in payload["cohorts"]}
    assert cohort_codes <= APPROVED_COHORTS
    assert cohort_codes == set(expected_counts)
    assert payload["meta"]["total_cohorts"] == len(payload["cohorts"]) == len(expected_counts)

    response_counts = {cohort["cohort_code"]: cohort["total"] for cohort in payload["cohorts"]}
    assert response_counts == expected_counts
    assert payload["meta"]["total_foods"] == sum(response_counts.values())

    for cohort in payload["cohorts"]:
        assert cohort["items"]
        assert cohort["label_fr"]
        assert cohort["label_en"]
        assert cohort["rationale_fr"]
        assert cohort["rationale_en"]
        assert cohort["caveat_fr"]
        assert cohort["caveat_en"]

        for item in cohort["items"]:
            assert item["food_slug"]
            assert item["canonical_name_fr"]
            assert item["canonical_name_en"]


def test_safe_harbor_assignments_require_explicit_measurement_packs(
    db_conn, integration_guard, safe_harbor_schema
) -> None:
    rows = _pack_contract_rows(db_conn)

    if not rows:
        assert _assignment_counts(db_conn) == {}
        return

    for row in rows:
        assert row["assignment_method"] == "explicit_measurement_pack_v1"
        assert row["subtype_count"] == 6
        assert row["bad_method_rows"] == 0
        assert row["sugar_zero_count"] == 1
        assert row["fructose_zero_count"] == 1
        assert row["glucose_zero_count"] == 1
        assert row["lactose_zero_count"] == 1
        assert row["polyols_zero_count"] == 1


def test_safe_harbor_checks_allow_zero_assignments_for_reduced_seed(
    db_url, integration_guard, safe_harbor_schema
) -> None:
    checks_sql = SAFE_HARBOR_CHECKS_PATH.read_text(encoding="utf-8")

    try:
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            conn.execute(
                """
                DELETE FROM food_safe_harbor_assignments
                WHERE assignment_version = 'safe_harbor_v1'
                """
            )
            conn.execute(
                """
                DELETE FROM food_fodmap_measurements m
                USING sources s
                WHERE m.source_id = s.source_id
                  AND s.source_slug = 'internal_rules_v1'
                  AND m.notes LIKE 'safe_harbor_v1:composition_zero;%'
                """
            )
            conn.execute(checks_sql)
    finally:
        _apply_safe_harbor_contract(db_url)


def test_safe_harbor_exclusion_screen(client, integration_guard, safe_harbor_schema) -> None:
    response = client.get("/v0/safe-harbors")
    assert response.status_code == 200

    payload = response.json()
    returned_slugs = {item["food_slug"] for cohort in payload["cohorts"] for item in cohort["items"]}

    if returned_slugs:
        assert "huile-d-olive-vierge-extra" in returned_slugs
        assert "homard-cru" in returned_slugs
    else:
        assert payload["cohorts"] == []
        assert payload["meta"]["total_cohorts"] == 0
        assert payload["meta"]["total_foods"] == 0

    assert "huile-combinee-melange-d-huiles" not in returned_slugs
    assert "huile-pour-friture-sans-precision" not in returned_slugs
    assert "huile-vegetale-aliment-moyen" not in returned_slugs
    assert (
        "matiere-grasse-ou-graisse-vegetale-solide-type-margarine-pour-friture-ou-graisse-a-frire" not in returned_slugs
    )
    assert "oeuf-cru" not in returned_slugs
    assert "oeuf-brouille-avec-matiere-grasse" not in returned_slugs
    assert "cabillaud-cru" not in returned_slugs
    assert "morue-salee-bouillie-cuite-a-l-eau" not in returned_slugs


def test_safe_harbor_ciqual_basis_ignores_non_ciqual_and_stale_rows(
    client, db_url, integration_guard, safe_harbor_schema
) -> None:
    inserted_ids: list[int] = []

    try:
        with psycopg.connect(db_url, row_factory=dict_row) as writer:
            source_rows = writer.execute(
                """
                SELECT source_slug, source_id
                FROM sources
                WHERE source_slug IN ('ciqual_2025', 'internal_rules_v1')
                """
            ).fetchall()
            source_ids = {row["source_slug"]: row["source_id"] for row in source_rows}

            nutrient_rows = writer.execute(
                """
                SELECT nutrient_code, nutrient_id
                FROM nutrient_definitions
                WHERE nutrient_code IN ('CIQUAL_32000', 'CIQUAL_32210', 'CIQUAL_32250', 'CIQUAL_32410', 'CIQUAL_34000')
                """
            ).fetchall()
            nutrient_ids = {row["nutrient_code"]: row["nutrient_id"] for row in nutrient_rows}

            food_rows = writer.execute(
                """
                SELECT food_slug, food_id
                FROM foods
                WHERE food_slug IN ('cabillaud-cru', 'oeuf-cru')
                """
            ).fetchall()
            food_ids = {row["food_slug"]: row["food_id"] for row in food_rows}

            for nutrient_code in nutrient_ids:
                row = writer.execute(
                    """
                    INSERT INTO food_nutrient_observations (
                      food_id,
                      nutrient_id,
                      source_id,
                      source_record_ref,
                      amount_raw,
                      comparator,
                      amount_value,
                      basis,
                      observed_at,
                      effective_from,
                      notes
                    ) VALUES (
                      %(food_id)s,
                      %(nutrient_id)s,
                      %(source_id)s,
                      %(source_record_ref)s,
                      '0',
                      'eq',
                      0,
                      'per_100g',
                      DATE '2099-01-01',
                      DATE '2099-01-01',
                      'test_non_ciqual_zero_basis'
                    )
                    RETURNING observation_id
                    """,
                    {
                        "food_id": food_ids["cabillaud-cru"],
                        "nutrient_id": nutrient_ids[nutrient_code],
                        "source_id": source_ids["internal_rules_v1"],
                        "source_record_ref": f"test_non_ciqual_zero_basis:{nutrient_code}",
                    },
                ).fetchone()
                inserted_ids.append(row["observation_id"])

            for nutrient_code in ("CIQUAL_32000", "CIQUAL_32250"):
                row = writer.execute(
                    """
                    INSERT INTO food_nutrient_observations (
                      food_id,
                      nutrient_id,
                      source_id,
                      source_record_ref,
                      amount_raw,
                      comparator,
                      amount_value,
                      basis,
                      observed_at,
                      effective_from,
                      notes
                    ) VALUES (
                      %(food_id)s,
                      %(nutrient_id)s,
                      %(source_id)s,
                      %(source_record_ref)s,
                      '0',
                      'eq',
                      0,
                      'per_100g',
                      DATE '2000-01-01',
                      DATE '2000-01-01',
                      'test_stale_ciqual_zero_basis'
                    )
                    RETURNING observation_id
                    """,
                    {
                        "food_id": food_ids["oeuf-cru"],
                        "nutrient_id": nutrient_ids[nutrient_code],
                        "source_id": source_ids["ciqual_2025"],
                        "source_record_ref": f"test_stale_ciqual_zero_basis:{nutrient_code}",
                    },
                ).fetchone()
                inserted_ids.append(row["observation_id"])

            writer.commit()

        _apply_safe_harbor_contract(db_url)

        response = client.get("/v0/safe-harbors")
        assert response.status_code == 200

        payload = response.json()
        returned_slugs = {item["food_slug"] for cohort in payload["cohorts"] for item in cohort["items"]}

        if returned_slugs:
            assert "huile-d-olive-vierge-extra" in returned_slugs
            assert "cabillaud-cru" not in returned_slugs
            assert "oeuf-cru" not in returned_slugs
        else:
            assert payload["cohorts"] == []
            assert payload["meta"]["total_cohorts"] == 0
            assert payload["meta"]["total_foods"] == 0
    finally:
        if inserted_ids:
            with psycopg.connect(db_url, row_factory=dict_row) as writer:
                writer.execute(
                    "DELETE FROM food_nutrient_observations WHERE observation_id = ANY(%s)",
                    (inserted_ids,),
                )
                writer.commit()
        _apply_safe_harbor_contract(db_url)
