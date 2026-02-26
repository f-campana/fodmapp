from __future__ import annotations

from typing import Optional

import pytest

pytestmark = pytest.mark.integration


def _first_rollup_slug(db_conn) -> str:
    row = db_conn.execute(
        """
        SELECT f.food_slug
        FROM v_phase3_rollups_latest_full v
        JOIN foods f ON f.food_id = v.food_id
        ORDER BY v.priority_rank
        LIMIT 1
        """
    ).fetchone()
    assert row is not None
    return row["food_slug"]


def _first_food_slug(db_conn) -> str:
    row = db_conn.execute(
        """
        SELECT food_slug
        FROM foods
        ORDER BY food_slug
        LIMIT 1
        """
    ).fetchone()
    assert row is not None
    return row["food_slug"]


def _slug_without_rollup(db_conn) -> Optional[str]:
    row = db_conn.execute(
        """
        SELECT f.food_slug
        FROM foods f
        WHERE NOT EXISTS (
          SELECT 1
          FROM v_phase3_rollups_latest_full v
          WHERE v.food_id = f.food_id
        )
        ORDER BY f.food_slug
        LIMIT 1
        """
    ).fetchone()
    return row["food_slug"] if row else None


def _rollup_food_subtypes_count(db_conn, food_slug: str) -> int:
    row = db_conn.execute(
        """
        SELECT COUNT(*)::int AS subtype_count
        FROM v_phase3_rollup_subtype_levels_latest v
        JOIN foods f ON f.food_id = v.food_id
        WHERE f.food_slug = %s
        """,
        (food_slug,),
    ).fetchone()
    assert row is not None
    return row["subtype_count"]


def _slug_with_traits(db_conn) -> str:
    row = db_conn.execute(
        """
        SELECT f.food_slug
        FROM foods f
        WHERE EXISTS (SELECT 1 FROM food_culinary_roles r WHERE r.food_id = f.food_id)
          OR EXISTS (SELECT 1 FROM food_flavor_profiles r WHERE r.food_id = f.food_id)
          OR EXISTS (SELECT 1 FROM food_texture_profiles r WHERE r.food_id = f.food_id)
          OR EXISTS (SELECT 1 FROM food_cooking_behaviors r WHERE r.food_id = f.food_id)
          OR EXISTS (SELECT 1 FROM food_cuisine_affinities r WHERE r.food_id = f.food_id)
        ORDER BY f.food_slug
        LIMIT 1
        """
    ).fetchone()
    assert row is not None
    return row["food_slug"]


def _slug_without_traits(db_conn) -> Optional[str]:
    row = db_conn.execute(
        """
        SELECT f.food_slug
        FROM foods f
        WHERE NOT EXISTS (SELECT 1 FROM food_culinary_roles r WHERE r.food_id = f.food_id)
          AND NOT EXISTS (SELECT 1 FROM food_flavor_profiles r WHERE r.food_id = f.food_id)
          AND NOT EXISTS (SELECT 1 FROM food_texture_profiles r WHERE r.food_id = f.food_id)
          AND NOT EXISTS (SELECT 1 FROM food_cooking_behaviors r WHERE r.food_id = f.food_id)
          AND NOT EXISTS (SELECT 1 FROM food_cuisine_affinities r WHERE r.food_id = f.food_id)
        ORDER BY f.food_slug
        LIMIT 1
        """
    ).fetchone()
    return row["food_slug"] if row else None


def test_get_food_by_slug(client, db_conn, integration_guard) -> None:
    food_slug = _first_rollup_slug(db_conn)
    response = client.get(f"/v0/foods/{food_slug}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["food_slug"] == food_slug
    assert payload["canonical_name_fr"]
    assert payload["canonical_name_en"]


def test_get_food_not_found(client, integration_guard) -> None:
    response = client.get("/v0/foods/__missing-food__")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_search_foods(client, db_conn, integration_guard) -> None:
    sample_slug = _first_food_slug(db_conn)
    query = sample_slug.split("-")[0]

    response = client.get("/v0/foods", params={"q": query, "limit": 10})
    assert response.status_code == 200

    payload = response.json()
    assert payload["query"] == query
    assert payload["limit"] == 10
    assert payload["total"] == len(payload["items"])
    assert payload["total"] >= 1

    first = payload["items"][0]
    assert first["food_slug"]
    assert first["canonical_name_fr"]
    assert first["canonical_name_en"]


def test_search_foods_empty_result(client, integration_guard) -> None:
    response = client.get("/v0/foods", params={"q": "__zzzz_no_match__", "limit": 10})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 0
    assert payload["items"] == []


def test_get_rollup_by_slug(client, db_conn, integration_guard) -> None:
    food_slug = _first_rollup_slug(db_conn)
    response = client.get(f"/v0/foods/{food_slug}/rollup")

    assert response.status_code == 200
    payload = response.json()
    assert payload["food_slug"] == food_slug
    assert payload["overall_level"] in {"none", "low", "moderate", "high", "unknown"}
    assert 0 <= payload["known_subtypes_count"] <= 6
    assert 0 <= payload["coverage_ratio"] <= 1
    assert payload["source_slug"]
    assert payload["rollup_computed_at"]


def test_get_rollup_not_available(client, db_conn, integration_guard) -> None:
    food_slug = _slug_without_rollup(db_conn)
    if food_slug is None:
        pytest.skip("no food without rollup available in dataset")

    response = client.get(f"/v0/foods/{food_slug}/rollup")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "rollup_not_available"


def test_get_subtypes_by_slug(client, db_conn, integration_guard) -> None:
    food_slug = _first_rollup_slug(db_conn)
    expected_count = _rollup_food_subtypes_count(db_conn, food_slug)

    response = client.get(f"/v0/foods/{food_slug}/subtypes")
    assert response.status_code == 200

    payload = response.json()
    assert payload["food_slug"] == food_slug
    assert payload["canonical_name_fr"]
    assert payload["canonical_name_en"]
    assert payload["total"] == len(payload["items"]) == expected_count
    assert payload["total"] >= 1

    item = payload["items"][0]
    assert item["subtype_code"]
    assert item["subtype_level"] in {"none", "low", "moderate", "high", "unknown"}
    assert "amount_g_per_serving" in item
    assert "low_max_g" in item
    assert "moderate_max_g" in item
    assert "burden_ratio" in item
    assert "is_default_threshold" in item
    assert "is_polyol_proxy" in item
    assert item["computed_at"]


def test_get_subtypes_not_available(client, db_conn, integration_guard) -> None:
    food_slug = _slug_without_rollup(db_conn)
    if food_slug is None:
        pytest.skip("no food without rollup available in dataset")

    response = client.get(f"/v0/foods/{food_slug}/subtypes")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "rollup_not_available"


def test_get_traits_existing_food(client, db_conn, integration_guard) -> None:
    food_slug = _slug_with_traits(db_conn)
    response = client.get(f"/v0/foods/{food_slug}/traits")

    assert response.status_code == 200
    payload = response.json()
    assert payload["food_slug"] == food_slug
    assert payload["canonical_name_fr"]
    assert payload["canonical_name_en"]

    total_traits = (
        len(payload["culinary_roles"])
        + len(payload["flavor_profiles"])
        + len(payload["texture_profiles"])
        + len(payload["cooking_behaviors"])
        + len(payload["cuisine_affinities"])
    )
    assert total_traits > 0


def test_get_traits_empty_arrays_when_not_curated(client, db_conn, integration_guard) -> None:
    food_slug = _slug_without_traits(db_conn)
    if food_slug is None:
        pytest.skip("no food without traits available in dataset")

    response = client.get(f"/v0/foods/{food_slug}/traits")
    assert response.status_code == 200
    payload = response.json()

    assert payload["food_slug"] == food_slug
    assert payload["culinary_roles"] == []
    assert payload["flavor_profiles"] == []
    assert payload["texture_profiles"] == []
    assert payload["cooking_behaviors"] == []
    assert payload["cuisine_affinities"] == []
