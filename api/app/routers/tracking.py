from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Query, Request, Response, Security, status

from app import sql, tracking_store, tracking_store_meals, tracking_store_saved_meals
from app.auth import require_api_user_id
from app.db import Database
from app.errors import locked
from app.models import (
    CustomFood,
    CustomFoodCreateRequest,
    CustomFoodUpdateRequest,
    MealLog,
    MealLogCreateRequest,
    MealLogUpdateRequest,
    SavedMeal,
    SavedMealCreateRequest,
    SavedMealUpdateRequest,
    SymptomLog,
    SymptomLogCreateRequest,
    SymptomLogUpdateRequest,
    TrackingFeedResponse,
    WeeklyTrackingSummaryResponse,
)
from app.tracking_store_summary import build_tracking_feed, build_weekly_summary

router = APIRouter(prefix="/v0/me/tracking", tags=["tracking"])


def _get_db(request: Request) -> Database:
    return request.app.state.db


def _next_version(conn, user_id: UUID, entity_type: str, entity_id: str) -> int:
    return tracking_store.get_entity_version(conn, user_id, entity_type, entity_id) + 1


def _require_tracking_write_allowed(conn, user_id: UUID) -> None:
    row = sql.fetch_one(conn, sql.SQL_GET_ACCOUNT_DELETE_STATE, {"user_id": user_id})
    if row is not None:
        raise locked("Tracking writes are locked after deletion request")


@router.get("/feed", response_model=TrackingFeedResponse)
def get_tracking_feed(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    user_id: UUID = Security(require_api_user_id),
) -> TrackingFeedResponse:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        return build_tracking_feed(conn, user_id, limit=limit)


@router.get("/summary/weekly", response_model=WeeklyTrackingSummaryResponse)
def get_weekly_summary(
    request: Request,
    anchor_date: Optional[date] = Query(default=None),
    user_id: UUID = Security(require_api_user_id),
) -> WeeklyTrackingSummaryResponse:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        return build_weekly_summary(conn, user_id, anchor_date=anchor_date)


@router.get("/symptoms", response_model=list[SymptomLog])
def list_symptoms(
    request: Request,
    limit: int = Query(default=100, ge=1, le=200),
    user_id: UUID = Security(require_api_user_id),
) -> list[SymptomLog]:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        return tracking_store.list_symptom_logs(conn, user_id, limit=limit)


@router.post("/symptoms", response_model=SymptomLog, status_code=status.HTTP_201_CREATED)
def create_symptom(
    request: Request,
    payload: SymptomLogCreateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> SymptomLog:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "symptom_logs")
        created = tracking_store.create_symptom_log(conn, user_id, payload, version=1)
        tracking_store.set_entity_version(conn, user_id, "symptom_log", str(created.symptom_log_id), created.version)
        return created


@router.patch("/symptoms/{symptom_log_id}", response_model=SymptomLog)
def update_symptom(
    request: Request,
    symptom_log_id: UUID,
    payload: SymptomLogUpdateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> SymptomLog:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "symptom_logs")
        version = _next_version(conn, user_id, "symptom_log", str(symptom_log_id))
        updated = tracking_store.update_symptom_log(conn, user_id, symptom_log_id, payload, version=version)
        tracking_store.set_entity_version(conn, user_id, "symptom_log", str(symptom_log_id), updated.version)
        return updated


@router.delete("/symptoms/{symptom_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_symptom(
    request: Request,
    symptom_log_id: UUID,
    user_id: UUID = Security(require_api_user_id),
) -> Response:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "symptom_logs")
        version = _next_version(conn, user_id, "symptom_log", str(symptom_log_id))
        tracking_store.delete_symptom_log(conn, user_id, symptom_log_id, version=version)
        tracking_store.set_entity_version(conn, user_id, "symptom_log", str(symptom_log_id), version)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/meals", response_model=list[MealLog])
def list_meals(
    request: Request,
    limit: int = Query(default=100, ge=1, le=200),
    user_id: UUID = Security(require_api_user_id),
) -> list[MealLog]:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        return tracking_store_meals.list_meal_logs(conn, user_id, limit=limit)


@router.post("/meals", response_model=MealLog, status_code=status.HTTP_201_CREATED)
def create_meal(
    request: Request,
    payload: MealLogCreateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> MealLog:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        created = tracking_store_meals.create_meal_log(conn, user_id, payload, version=1)
        tracking_store.set_entity_version(conn, user_id, "meal_log", str(created.meal_log_id), created.version)
        return created


@router.patch("/meals/{meal_log_id}", response_model=MealLog)
def update_meal(
    request: Request,
    meal_log_id: UUID,
    payload: MealLogUpdateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> MealLog:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        version = _next_version(conn, user_id, "meal_log", str(meal_log_id))
        updated = tracking_store_meals.update_meal_log(conn, user_id, meal_log_id, payload, version=version)
        tracking_store.set_entity_version(conn, user_id, "meal_log", str(meal_log_id), updated.version)
        return updated


@router.delete("/meals/{meal_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(
    request: Request,
    meal_log_id: UUID,
    user_id: UUID = Security(require_api_user_id),
) -> Response:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        version = _next_version(conn, user_id, "meal_log", str(meal_log_id))
        tracking_store_meals.delete_meal_log(conn, user_id, meal_log_id, version=version)
        tracking_store.set_entity_version(conn, user_id, "meal_log", str(meal_log_id), version)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/custom-foods", response_model=list[CustomFood])
def list_custom_foods(
    request: Request,
    user_id: UUID = Security(require_api_user_id),
) -> list[CustomFood]:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        return tracking_store.list_custom_foods(conn, user_id)


@router.post("/custom-foods", response_model=CustomFood, status_code=status.HTTP_201_CREATED)
def create_custom_food(
    request: Request,
    payload: CustomFoodCreateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> CustomFood:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        created = tracking_store.create_custom_food(conn, user_id, payload, version=1)
        tracking_store.set_entity_version(conn, user_id, "custom_food", str(created.custom_food_id), created.version)
        return created


@router.patch("/custom-foods/{custom_food_id}", response_model=CustomFood)
def update_custom_food(
    request: Request,
    custom_food_id: UUID,
    payload: CustomFoodUpdateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> CustomFood:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        version = _next_version(conn, user_id, "custom_food", str(custom_food_id))
        updated = tracking_store.update_custom_food(conn, user_id, custom_food_id, payload, version=version)
        tracking_store.set_entity_version(conn, user_id, "custom_food", str(custom_food_id), updated.version)
        return updated


@router.delete("/custom-foods/{custom_food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_food(
    request: Request,
    custom_food_id: UUID,
    user_id: UUID = Security(require_api_user_id),
) -> Response:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        version = _next_version(conn, user_id, "custom_food", str(custom_food_id))
        tracking_store.delete_custom_food(conn, user_id, custom_food_id, version=version)
        tracking_store.set_entity_version(conn, user_id, "custom_food", str(custom_food_id), version)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/saved-meals", response_model=list[SavedMeal])
def list_saved_meals(
    request: Request,
    user_id: UUID = Security(require_api_user_id),
) -> list[SavedMeal]:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        return tracking_store_saved_meals.list_saved_meals(conn, user_id)


@router.post("/saved-meals", response_model=SavedMeal, status_code=status.HTTP_201_CREATED)
def create_saved_meal(
    request: Request,
    payload: SavedMealCreateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> SavedMeal:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        created = tracking_store_saved_meals.create_saved_meal(conn, user_id, payload, version=1)
        tracking_store.set_entity_version(conn, user_id, "saved_meal", str(created.saved_meal_id), created.version)
        return created


@router.patch("/saved-meals/{saved_meal_id}", response_model=SavedMeal)
def update_saved_meal(
    request: Request,
    saved_meal_id: UUID,
    payload: SavedMealUpdateRequest,
    user_id: UUID = Security(require_api_user_id),
) -> SavedMeal:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        version = _next_version(conn, user_id, "saved_meal", str(saved_meal_id))
        updated = tracking_store_saved_meals.update_saved_meal(conn, user_id, saved_meal_id, payload, version=version)
        tracking_store.set_entity_version(conn, user_id, "saved_meal", str(saved_meal_id), updated.version)
        return updated


@router.delete("/saved-meals/{saved_meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_meal(
    request: Request,
    saved_meal_id: UUID,
    user_id: UUID = Security(require_api_user_id),
) -> Response:
    db = _get_db(request)

    with db.connection() as conn:
        _require_tracking_write_allowed(conn, user_id)
        tracking_store.require_tracking_scope(conn, user_id, "diet_logs")
        version = _next_version(conn, user_id, "saved_meal", str(saved_meal_id))
        tracking_store_saved_meals.delete_saved_meal(conn, user_id, saved_meal_id, version=version)
        tracking_store.set_entity_version(conn, user_id, "saved_meal", str(saved_meal_id), version)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
