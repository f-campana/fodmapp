from __future__ import annotations

from typing import Optional, Tuple

import pytest

pytestmark = pytest.mark.integration


def _from_slug_with_active_swaps(db_conn) -> Optional[Tuple[str, int]]:
    row = db_conn.execute(
        """
        SELECT from_food_slug AS food_slug, COUNT(*)::int AS rule_count
        FROM api_swaps_current
        GROUP BY from_food_slug
        ORDER BY rule_count DESC, from_food_slug ASC
        LIMIT 1
        """
    ).fetchone()
    if row is None:
        return None
    return row["food_slug"], row["rule_count"]


def _severity_rank(level: str) -> int:
    order = {
        "none": 1,
        "low": 2,
        "moderate": 3,
        "high": 4,
        "unknown": 5,
    }
    return order[level]


def test_swaps_unknown_from_slug(client, integration_guard) -> None:
    response = client.get("/v0/swaps", params={"from": "__missing-food__"})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_swaps_active_only_and_required_fields(client, db_conn, integration_guard) -> None:
    from_info = _from_slug_with_active_swaps(db_conn)
    if from_info is None:
        pytest.skip("no active swap rules available")

    from_slug, _ = from_info
    response = client.get("/v0/swaps", params={"from": from_slug})
    assert response.status_code == 200

    payload = response.json()
    assert payload["from_food_slug"] == from_slug
    assert payload["total"] == len(payload["items"])

    for item in payload["items"]:
        assert item["rule_status"] == "active"
        assert item["instruction_fr"]
        assert item["instruction_en"]
        assert item["from_overall_level"] in {"none", "low", "moderate", "high", "unknown"}
        assert item["to_overall_level"] in {"none", "low", "moderate", "high", "unknown"}
        assert item["driver_subtype"]
        assert 0.0 <= item["fodmap_safety_score"] <= 1.0
        assert 0.0 <= item["overall_score"] <= 1.0
        assert 0.0 <= item["coverage_ratio"] <= 1.0
        assert item["scoring_version"]
        assert item["rollup_computed_at"]


def test_swaps_sorted_deterministically(client, db_conn, integration_guard) -> None:
    from_info = _from_slug_with_active_swaps(db_conn)
    if from_info is None:
        pytest.skip("no active swap rules available")

    from_slug, _ = from_info
    response = client.get("/v0/swaps", params={"from": from_slug, "limit": 50})
    assert response.status_code == 200
    items = response.json()["items"]

    sorted_items = sorted(
        items,
        key=lambda i: (
            -i["fodmap_safety_score"],
            -i["overall_score"],
            _severity_rank(i["to_overall_level"]),
            -i["coverage_ratio"],
            i["to_food_slug"],
        ),
    )
    assert items == sorted_items


def test_swaps_respects_min_safety_score(client, db_conn, integration_guard) -> None:
    from_info = _from_slug_with_active_swaps(db_conn)
    if from_info is None:
        pytest.skip("no active swap rules available")

    from_slug, _ = from_info
    response = client.get(
        "/v0/swaps",
        params={"from": from_slug, "min_safety_score": 0.85},
    )
    assert response.status_code == 200
    payload = response.json()

    for item in payload["items"]:
        assert item["fodmap_safety_score"] >= 0.85


def test_swaps_exclude_rank2_rules(client, db_conn, integration_guard) -> None:
    from_info = _from_slug_with_active_swaps(db_conn)
    if from_info is None:
        pytest.skip("no active swap rules available")

    rank2_row = db_conn.execute(
        """
        SELECT f.food_slug
        FROM phase2_priority_foods p
        JOIN foods f ON f.food_id = p.resolved_food_id
        WHERE p.priority_rank = 2
        """
    ).fetchone()
    if rank2_row is None:
        pytest.skip("rank2 food not found")

    rank2_slug = rank2_row["food_slug"]
    from_slug, _ = from_info
    response = client.get("/v0/swaps", params={"from": from_slug})
    assert response.status_code == 200

    items = response.json()["items"]
    for item in items:
        assert item["from_food_slug"] != rank2_slug
        assert item["to_food_slug"] != rank2_slug
