from __future__ import annotations

from fastapi import APIRouter, Request

from app.db import Database
from app.errors import not_found, rollup_not_available
from app.models import FoodResponse, FoodRollupResponse, FoodTraitsResponse, TraitLabel
from app import sql

router = APIRouter(prefix="/v0/foods", tags=["foods"])


def _get_db(request: Request) -> Database:
    return request.app.state.db


def _normalize_names(row: dict) -> dict:
    canonical_name_fr = row.get("canonical_name_fr") or row["food_slug"]
    canonical_name_en = row.get("canonical_name_en") or canonical_name_fr
    row["canonical_name_fr"] = canonical_name_fr
    row["canonical_name_en"] = canonical_name_en
    return row


@router.get("/{food_slug}", response_model=FoodResponse)
def get_food(food_slug: str, request: Request) -> FoodResponse:
    db = _get_db(request)
    with db.readonly_connection() as conn:
        row = sql.fetch_one(conn, sql.SQL_GET_FOOD, {"food_slug": food_slug})

    if row is None:
        raise not_found("Food not found")

    return FoodResponse(**_normalize_names(row))


@router.get("/{food_slug}/rollup", response_model=FoodRollupResponse)
def get_food_rollup(food_slug: str, request: Request) -> FoodRollupResponse:
    db = _get_db(request)
    with db.readonly_connection() as conn:
        row = sql.fetch_one(conn, sql.SQL_GET_FOOD_ROLLUP, {"food_slug": food_slug})

    if row is None:
        raise not_found("Food not found")

    if row.get("rollup_computed_at") is None:
        raise rollup_not_available("Rollup not available for this food")

    payload = _normalize_names(row)
    payload["source_slug"] = payload.get("source_slug") or "internal_rules_v1"
    return FoodRollupResponse(**payload)


@router.get("/{food_slug}/traits", response_model=FoodTraitsResponse)
def get_food_traits(food_slug: str, request: Request) -> FoodTraitsResponse:
    db = _get_db(request)
    with db.readonly_connection() as conn:
        food = sql.fetch_one(conn, sql.SQL_GET_FOOD_IDENTITY, {"food_slug": food_slug})
        if food is None:
            raise not_found("Food not found")

        food = _normalize_names(food)
        params = {"food_id": food["food_id"]}
        culinary_roles = [TraitLabel(**row) for row in sql.fetch_all(conn, sql.SQL_GET_TRAIT_ROLE, params)]
        flavor_profiles = [TraitLabel(**row) for row in sql.fetch_all(conn, sql.SQL_GET_TRAIT_FLAVOR, params)]
        texture_profiles = [TraitLabel(**row) for row in sql.fetch_all(conn, sql.SQL_GET_TRAIT_TEXTURE, params)]
        cooking_behaviors = [TraitLabel(**row) for row in sql.fetch_all(conn, sql.SQL_GET_TRAIT_BEHAVIOR, params)]
        cuisine_affinities = [TraitLabel(**row) for row in sql.fetch_all(conn, sql.SQL_GET_TRAIT_CUISINE, params)]

    any_traits = any(
        (
            len(culinary_roles),
            len(flavor_profiles),
            len(texture_profiles),
            len(cooking_behaviors),
            len(cuisine_affinities),
        )
    )

    return FoodTraitsResponse(
        food_slug=food["food_slug"],
        canonical_name_fr=food["canonical_name_fr"],
        canonical_name_en=food["canonical_name_en"],
        source_slug="internal_rules_v1" if any_traits else None,
        culinary_roles=culinary_roles,
        flavor_profiles=flavor_profiles,
        texture_profiles=texture_profiles,
        cooking_behaviors=cooking_behaviors,
        cuisine_affinities=cuisine_affinities,
    )
