from __future__ import annotations

import pytest

pytestmark = pytest.mark.integration


APPROVED_COHORTS = {"cohort_oil_fat", "cohort_plain_protein", "cohort_egg"}


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
        WITH pack_rows AS (
          SELECT
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
              WHERE nd.nutrient_code = 'CIQUAL_32000'
                AND fno.comparator = 'eq'
                AND fno.amount_value = 0
            )::int AS sugar_zero_count,
            COUNT(*) FILTER (
              WHERE nd.nutrient_code = 'CIQUAL_32210'
                AND fno.comparator = 'eq'
                AND fno.amount_value = 0
            )::int AS fructose_zero_count,
            COUNT(*) FILTER (
              WHERE nd.nutrient_code = 'CIQUAL_32250'
                AND fno.comparator = 'eq'
                AND fno.amount_value = 0
            )::int AS glucose_zero_count,
            COUNT(*) FILTER (
              WHERE nd.nutrient_code = 'CIQUAL_32410'
                AND fno.comparator = 'eq'
                AND fno.amount_value = 0
            )::int AS lactose_zero_count,
            COUNT(*) FILTER (
              WHERE nd.nutrient_code = 'CIQUAL_34000'
                AND fno.comparator = 'eq'
                AND fno.amount_value = 0
            )::int AS polyols_zero_count,
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
          LEFT JOIN food_nutrient_observations fno ON fno.food_id = a.food_id
          LEFT JOIN nutrient_definitions nd
            ON nd.nutrient_id = fno.nutrient_id
           AND nd.nutrient_code IN ('CIQUAL_32000', 'CIQUAL_32210', 'CIQUAL_32250', 'CIQUAL_32410', 'CIQUAL_34000')
          WHERE a.assignment_version = 'safe_harbor_v1'
          GROUP BY a.cohort_code, f.food_slug, a.assignment_method
        )
        SELECT *
        FROM pack_rows
        ORDER BY cohort_code, food_slug
        """
    ).fetchall()


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

    assert rows
    for row in rows:
        assert row["assignment_method"] == "explicit_measurement_pack_v1"
        assert row["subtype_count"] == 6
        assert row["bad_method_rows"] == 0
        assert row["sugar_zero_count"] > 0
        assert row["fructose_zero_count"] > 0
        assert row["glucose_zero_count"] > 0
        assert row["lactose_zero_count"] > 0
        assert row["polyols_zero_count"] > 0


def test_safe_harbor_exclusion_screen(client, integration_guard, safe_harbor_schema) -> None:
    response = client.get("/v0/safe-harbors")
    assert response.status_code == 200

    payload = response.json()
    returned_slugs = {item["food_slug"] for cohort in payload["cohorts"] for item in cohort["items"]}

    assert "huile-d-olive-vierge-extra" in returned_slugs
    assert "homard-cru" in returned_slugs

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
