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
    assert cohort_codes == APPROVED_COHORTS
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


def test_safe_harbor_exclusion_screen(client, integration_guard, safe_harbor_schema) -> None:
    response = client.get("/v0/safe-harbors")
    assert response.status_code == 200

    payload = response.json()
    returned_slugs = {item["food_slug"] for cohort in payload["cohorts"] for item in cohort["items"]}

    assert "huile-d-olive-vierge-extra" in returned_slugs
    assert "oeuf-cru" in returned_slugs
    assert "cabillaud-cru" in returned_slugs

    assert "omelette-nature-faite-maison" not in returned_slugs
    assert (
        "matiere-grasse-ou-graisse-vegetale-solide-type-margarine-pour-friture-ou-graisse-a-frire" not in returned_slugs
    )
    assert "morue-salee-bouillie-cuite-a-l-eau" not in returned_slugs
