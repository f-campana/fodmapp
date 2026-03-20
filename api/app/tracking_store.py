from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, Iterable, Optional
from uuid import UUID, uuid4

from psycopg import Connection
from psycopg.types.json import Jsonb

from app import sql as app_sql
from app.errors import bad_request, locked, not_found
from app.models import (
    CustomFood,
    CustomFoodCreateRequest,
    CustomFoodUpdateRequest,
    DailyTrackingCount,
    MealLog,
    MealLogCreateRequest,
    MealLogItem,
    MealLogUpdateRequest,
    ProximityMeal,
    SavedMeal,
    SavedMealCreateRequest,
    SavedMealItem,
    SavedMealUpdateRequest,
    SymptomLog,
    SymptomLogCreateRequest,
    SymptomLogUpdateRequest,
    SymptomProximityGroup,
    SymptomTypeCount,
    TrackingFeedEntry,
    TrackingFeedResponse,
    TrackingItemInput,
    TrackingSeveritySummary,
    WeeklyTrackingSummaryResponse,
)

TRACKING_ENTITY_SCOPE = {
    "symptom_log": "symptom_logs",
    "meal_log": "diet_logs",
    "custom_food": "diet_logs",
    "saved_meal": "diet_logs",
}


def _jsonb(value: Any) -> Any:
    return Jsonb(value) if value is not None else None


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _required_text(value: Optional[str], field_name: str) -> str:
    normalized = _normalize_text(value)
    if normalized is None:
        raise bad_request(f"{field_name} is required")
    return normalized


def _fetch_scope(conn: Connection, user_id: UUID) -> dict[str, bool]:
    row = app_sql.fetch_one(conn, app_sql.SQL_GET_SYNC_SCOPE, {"user_id": user_id})
    if row is None:
        return {}
    return row["consent_scope"] or {}


def has_tracking_scope(scope: dict[str, bool], scope_name: str) -> bool:
    if scope_name == "symptom_logs":
        return bool(scope.get("symptom_logs") or scope.get("symptoms"))
    return bool(scope.get(scope_name))


def require_tracking_scope(conn: Connection, user_id: UUID, scope_name: str) -> None:
    scope = _fetch_scope(conn, user_id)
    if not has_tracking_scope(scope, scope_name):
        raise locked(f"{scope_name} disabled by consent")


def tracking_scope_for_entity(entity_type: str) -> Optional[str]:
    return TRACKING_ENTITY_SCOPE.get(entity_type)


def get_entity_version(conn: Connection, user_id: UUID, entity_type: str, entity_id: str) -> int:
    row = conn.execute(
        app_sql.SQL_GET_ENTITY_VERSION,
        {
            "user_id": user_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
        },
    ).fetchone()
    if row is None or row["current_version"] is None:
        return 0
    return int(row["current_version"])


def set_entity_version(conn: Connection, user_id: UUID, entity_type: str, entity_id: str, version: int) -> None:
    conn.execute(
        app_sql.SQL_UPSERT_ENTITY_VERSION,
        {
            "user_id": user_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "current_version": version,
        },
    )


def _resolve_food(conn: Connection, food_slug: str) -> Dict[str, Any]:
    row = app_sql.fetch_one(conn, app_sql.SQL_GET_FOOD_IDENTITY, {"food_slug": food_slug})
    if row is None:
        raise bad_request(f"Unknown food_slug: {food_slug}")
    return row


def _resolve_custom_food(conn: Connection, user_id: UUID, custom_food_id: UUID) -> Dict[str, Any]:
    row = conn.execute(
        """
        SELECT custom_food_id, label
        FROM custom_foods
        WHERE custom_food_id = %(custom_food_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"custom_food_id": custom_food_id, "user_id": user_id},
    ).fetchone()
    if row is None:
        raise bad_request("Unknown custom_food_id")
    return dict(row)


def _normalize_item_input(
    conn: Connection,
    user_id: UUID,
    item: TrackingItemInput,
) -> dict[str, Any]:
    quantity_text = _normalize_text(item.quantity_text)
    note = _normalize_text(item.note)

    if item.item_kind == "canonical_food":
        assert item.food_slug is not None
        food = _resolve_food(conn, item.food_slug)
        return {
            "item_kind": "canonical_food",
            "food_id": food["food_id"],
            "food_slug_snapshot": food["food_slug"],
            "custom_food_id": None,
            "free_text_label": None,
            "label_snapshot": food["canonical_name_fr"] or food["food_slug"],
            "quantity_text": quantity_text,
            "note": note,
        }

    if item.item_kind == "custom_food":
        assert item.custom_food_id is not None
        custom_food = _resolve_custom_food(conn, user_id, item.custom_food_id)
        return {
            "item_kind": "custom_food",
            "food_id": None,
            "food_slug_snapshot": None,
            "custom_food_id": custom_food["custom_food_id"],
            "free_text_label": None,
            "label_snapshot": custom_food["label"],
            "quantity_text": quantity_text,
            "note": note,
        }

    label = _normalize_text(item.free_text_label)
    if label is None:
        raise bad_request("free_text items require free_text_label")

    return {
        "item_kind": "free_text",
        "food_id": None,
        "food_slug_snapshot": None,
        "custom_food_id": None,
        "free_text_label": label,
        "label_snapshot": label,
        "quantity_text": quantity_text,
        "note": note,
    }


def _symptom_row_to_model(row: Dict[str, Any]) -> SymptomLog:
    return SymptomLog(
        symptom_log_id=row["symptom_log_id"],
        symptom_type=row["symptom_type"],
        severity=int(row["severity"]),
        noted_at_utc=row["noted_at_utc"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
    )


def _meal_item_row_to_model(row: Dict[str, Any]) -> MealLogItem:
    return MealLogItem(
        meal_log_item_id=row["meal_log_item_id"],
        sort_order=int(row["sort_order"]),
        item_kind=row["item_kind"],
        label=row["label_snapshot"],
        food_slug=row["food_slug_snapshot"],
        custom_food_id=row["custom_food_id"],
        quantity_text=row["quantity_text"],
        note=row["note"],
    )


def _saved_meal_item_row_to_model(row: Dict[str, Any]) -> SavedMealItem:
    return SavedMealItem(
        saved_meal_item_id=row["saved_meal_item_id"],
        sort_order=int(row["sort_order"]),
        item_kind=row["item_kind"],
        label=row["label_snapshot"],
        food_slug=row["food_slug_snapshot"],
        custom_food_id=row["custom_food_id"],
        quantity_text=row["quantity_text"],
        note=row["note"],
    )


def _fetch_meal_items(conn: Connection, meal_ids: Iterable[UUID]) -> dict[UUID, list[MealLogItem]]:
    ids = list(meal_ids)
    if not ids:
        return {}
    rows = conn.execute(
        """
        SELECT
          meal_log_item_id,
          meal_log_id,
          sort_order,
          item_kind,
          food_slug_snapshot,
          custom_food_id,
          label_snapshot,
          quantity_text,
          note
        FROM meal_log_items
        WHERE meal_log_id = ANY(%(meal_ids)s)
        ORDER BY meal_log_id, sort_order ASC
        """,
        {"meal_ids": ids},
    ).fetchall()
    grouped: dict[UUID, list[MealLogItem]] = defaultdict(list)
    for row in rows:
        grouped[row["meal_log_id"]].append(_meal_item_row_to_model(dict(row)))
    return grouped


def _fetch_saved_meal_items(conn: Connection, saved_meal_ids: Iterable[UUID]) -> dict[UUID, list[SavedMealItem]]:
    ids = list(saved_meal_ids)
    if not ids:
        return {}
    rows = conn.execute(
        """
        SELECT
          saved_meal_item_id,
          saved_meal_id,
          sort_order,
          item_kind,
          food_slug_snapshot,
          custom_food_id,
          label_snapshot,
          quantity_text,
          note
        FROM saved_meal_items
        WHERE saved_meal_id = ANY(%(saved_meal_ids)s)
        ORDER BY saved_meal_id, sort_order ASC
        """,
        {"saved_meal_ids": ids},
    ).fetchall()
    grouped: dict[UUID, list[SavedMealItem]] = defaultdict(list)
    for row in rows:
        grouped[row["saved_meal_id"]].append(_saved_meal_item_row_to_model(dict(row)))
    return grouped


def list_symptom_logs(conn: Connection, user_id: UUID, limit: int = 100) -> list[SymptomLog]:
    rows = conn.execute(
        """
        SELECT
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM symptom_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        ORDER BY noted_at_utc DESC, created_at_utc DESC
        LIMIT %(limit)s
        """,
        {"user_id": user_id, "limit": limit},
    ).fetchall()
    return [_symptom_row_to_model(dict(row)) for row in rows]


def create_symptom_log(
    conn: Connection,
    user_id: UUID,
    payload: SymptomLogCreateRequest,
    *,
    symptom_log_id: Optional[UUID] = None,
    version: int,
) -> SymptomLog:
    normalized_note = _normalize_text(payload.note)
    row = conn.execute(
        """
        INSERT INTO symptom_logs (
          symptom_log_id,
          user_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version
        )
        VALUES (
          %(symptom_log_id)s,
          %(user_id)s,
          %(symptom_type)s,
          %(severity)s,
          %(noted_at_utc)s,
          %(note)s,
          %(version)s
        )
        RETURNING
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        """,
        {
            "symptom_log_id": symptom_log_id or uuid4(),
            "user_id": user_id,
            "symptom_type": payload.symptom_type,
            "severity": payload.severity,
            "noted_at_utc": payload.noted_at_utc,
            "note": normalized_note,
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not create symptom log")
    return _symptom_row_to_model(dict(row))


def update_symptom_log(
    conn: Connection,
    user_id: UUID,
    symptom_log_id: UUID,
    payload: SymptomLogUpdateRequest,
    *,
    version: int,
) -> SymptomLog:
    existing = conn.execute(
        """
        SELECT symptom_log_id, symptom_type, severity, noted_at_utc, note
        FROM symptom_logs
        WHERE symptom_log_id = %(symptom_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"symptom_log_id": symptom_log_id, "user_id": user_id},
    ).fetchone()
    if existing is None:
        raise not_found("Symptom log not found")

    row = conn.execute(
        """
        UPDATE symptom_logs
        SET symptom_type = %(symptom_type)s,
            severity = %(severity)s,
            noted_at_utc = %(noted_at_utc)s,
            note = %(note)s,
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE symptom_log_id = %(symptom_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        """,
        {
            "symptom_log_id": symptom_log_id,
            "user_id": user_id,
            "symptom_type": payload.symptom_type or existing["symptom_type"],
            "severity": payload.severity if payload.severity is not None else existing["severity"],
            "noted_at_utc": payload.noted_at_utc or existing["noted_at_utc"],
            "note": _normalize_text(payload.note) if "note" in payload.model_fields_set else existing["note"],
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not update symptom log")
    return _symptom_row_to_model(dict(row))


def delete_symptom_log(conn: Connection, user_id: UUID, symptom_log_id: UUID, *, version: int) -> None:
    row = conn.execute(
        """
        UPDATE symptom_logs
        SET deleted_at = NOW(),
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE symptom_log_id = %(symptom_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING symptom_log_id
        """,
        {"symptom_log_id": symptom_log_id, "user_id": user_id, "version": version},
    ).fetchone()
    if row is None:
        raise not_found("Symptom log not found")


def list_custom_foods(conn: Connection, user_id: UUID) -> list[CustomFood]:
    rows = conn.execute(
        """
        SELECT
          custom_food_id,
          label,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM custom_foods
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        ORDER BY updated_at_utc DESC, created_at_utc DESC
        """,
        {"user_id": user_id},
    ).fetchall()
    return [
        CustomFood(
            custom_food_id=row["custom_food_id"],
            label=row["label"],
            note=row["note"],
            version=int(row["version"]),
            created_at_utc=row["created_at_utc"],
            updated_at_utc=row["updated_at_utc"],
        )
        for row in rows
    ]


def create_custom_food(
    conn: Connection,
    user_id: UUID,
    payload: CustomFoodCreateRequest,
    *,
    custom_food_id: Optional[UUID] = None,
    version: int,
) -> CustomFood:
    row = conn.execute(
        """
        INSERT INTO custom_foods (
          custom_food_id,
          user_id,
          label,
          note,
          version
        )
        VALUES (
          %(custom_food_id)s,
          %(user_id)s,
          %(label)s,
          %(note)s,
          %(version)s
        )
        RETURNING
          custom_food_id,
          label,
          note,
          version,
          created_at_utc,
          updated_at_utc
        """,
        {
            "custom_food_id": custom_food_id or uuid4(),
            "user_id": user_id,
            "label": _required_text(payload.label, "label"),
            "note": _normalize_text(payload.note),
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not create custom food")
    return CustomFood(
        custom_food_id=row["custom_food_id"],
        label=row["label"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
    )


def update_custom_food(
    conn: Connection,
    user_id: UUID,
    custom_food_id: UUID,
    payload: CustomFoodUpdateRequest,
    *,
    version: int,
) -> CustomFood:
    existing = conn.execute(
        """
        SELECT custom_food_id, label, note
        FROM custom_foods
        WHERE custom_food_id = %(custom_food_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"custom_food_id": custom_food_id, "user_id": user_id},
    ).fetchone()
    if existing is None:
        raise not_found("Custom food not found")

    row = conn.execute(
        """
        UPDATE custom_foods
        SET label = %(label)s,
            note = %(note)s,
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE custom_food_id = %(custom_food_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING
          custom_food_id,
          label,
          note,
          version,
          created_at_utc,
          updated_at_utc
        """,
        {
            "custom_food_id": custom_food_id,
            "user_id": user_id,
            "label": (
                _required_text(payload.label, "label") if "label" in payload.model_fields_set else existing["label"]
            ),
            "note": _normalize_text(payload.note) if "note" in payload.model_fields_set else existing["note"],
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not update custom food")
    return CustomFood(
        custom_food_id=row["custom_food_id"],
        label=row["label"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
    )


def delete_custom_food(conn: Connection, user_id: UUID, custom_food_id: UUID, *, version: int) -> None:
    row = conn.execute(
        """
        UPDATE custom_foods
        SET deleted_at = NOW(),
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE custom_food_id = %(custom_food_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING custom_food_id
        """,
        {"custom_food_id": custom_food_id, "user_id": user_id, "version": version},
    ).fetchone()
    if row is None:
        raise not_found("Custom food not found")


def _replace_meal_items(conn: Connection, meal_log_id: UUID, user_id: UUID, items: list[TrackingItemInput]) -> None:
    conn.execute("DELETE FROM meal_log_items WHERE meal_log_id = %(meal_log_id)s", {"meal_log_id": meal_log_id})
    for index, item in enumerate(items):
        normalized = _normalize_item_input(conn, user_id, item)
        conn.execute(
            """
            INSERT INTO meal_log_items (
              meal_log_item_id,
              meal_log_id,
              sort_order,
              item_kind,
              food_id,
              food_slug_snapshot,
              custom_food_id,
              free_text_label,
              label_snapshot,
              quantity_text,
              note
            )
            VALUES (
              %(meal_log_item_id)s,
              %(meal_log_id)s,
              %(sort_order)s,
              %(item_kind)s,
              %(food_id)s,
              %(food_slug_snapshot)s,
              %(custom_food_id)s,
              %(free_text_label)s,
              %(label_snapshot)s,
              %(quantity_text)s,
              %(note)s
            )
            """,
            {
                "meal_log_item_id": uuid4(),
                "meal_log_id": meal_log_id,
                "sort_order": index,
                **normalized,
            },
        )


def _replace_saved_meal_items(
    conn: Connection,
    saved_meal_id: UUID,
    user_id: UUID,
    items: list[TrackingItemInput],
) -> None:
    conn.execute(
        "DELETE FROM saved_meal_items WHERE saved_meal_id = %(saved_meal_id)s",
        {"saved_meal_id": saved_meal_id},
    )
    for index, item in enumerate(items):
        normalized = _normalize_item_input(conn, user_id, item)
        conn.execute(
            """
            INSERT INTO saved_meal_items (
              saved_meal_item_id,
              saved_meal_id,
              sort_order,
              item_kind,
              food_id,
              food_slug_snapshot,
              custom_food_id,
              free_text_label,
              label_snapshot,
              quantity_text,
              note
            )
            VALUES (
              %(saved_meal_item_id)s,
              %(saved_meal_id)s,
              %(sort_order)s,
              %(item_kind)s,
              %(food_id)s,
              %(food_slug_snapshot)s,
              %(custom_food_id)s,
              %(free_text_label)s,
              %(label_snapshot)s,
              %(quantity_text)s,
              %(note)s
            )
            """,
            {
                "saved_meal_item_id": uuid4(),
                "saved_meal_id": saved_meal_id,
                "sort_order": index,
                **normalized,
            },
        )


def _fetch_meal_log(conn: Connection, user_id: UUID, meal_log_id: UUID) -> MealLog:
    row = conn.execute(
        """
        SELECT
          meal_log_id,
          title,
          occurred_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM meal_logs
        WHERE meal_log_id = %(meal_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"meal_log_id": meal_log_id, "user_id": user_id},
    ).fetchone()
    if row is None:
        raise not_found("Meal log not found")
    items = _fetch_meal_items(conn, [meal_log_id]).get(meal_log_id, [])
    return MealLog(
        meal_log_id=row["meal_log_id"],
        title=row["title"],
        occurred_at_utc=row["occurred_at_utc"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
        items=items,
    )


def list_meal_logs(conn: Connection, user_id: UUID, limit: int = 100) -> list[MealLog]:
    rows = conn.execute(
        """
        SELECT
          meal_log_id,
          title,
          occurred_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM meal_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        ORDER BY occurred_at_utc DESC, created_at_utc DESC
        LIMIT %(limit)s
        """,
        {"user_id": user_id, "limit": limit},
    ).fetchall()
    meal_ids = [row["meal_log_id"] for row in rows]
    items_by_meal = _fetch_meal_items(conn, meal_ids)
    return [
        MealLog(
            meal_log_id=row["meal_log_id"],
            title=row["title"],
            occurred_at_utc=row["occurred_at_utc"],
            note=row["note"],
            version=int(row["version"]),
            created_at_utc=row["created_at_utc"],
            updated_at_utc=row["updated_at_utc"],
            items=items_by_meal.get(row["meal_log_id"], []),
        )
        for row in rows
    ]


def create_meal_log(
    conn: Connection,
    user_id: UUID,
    payload: MealLogCreateRequest,
    *,
    meal_log_id: Optional[UUID] = None,
    version: int,
) -> MealLog:
    row = conn.execute(
        """
        INSERT INTO meal_logs (
          meal_log_id,
          user_id,
          title,
          occurred_at_utc,
          note,
          version
        )
        VALUES (
          %(meal_log_id)s,
          %(user_id)s,
          %(title)s,
          %(occurred_at_utc)s,
          %(note)s,
          %(version)s
        )
        RETURNING meal_log_id
        """,
        {
            "meal_log_id": meal_log_id or uuid4(),
            "user_id": user_id,
            "title": _normalize_text(payload.title),
            "occurred_at_utc": payload.occurred_at_utc,
            "note": _normalize_text(payload.note),
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not create meal log")
    meal_log_id = row["meal_log_id"]
    _replace_meal_items(conn, meal_log_id, user_id, payload.items)
    return _fetch_meal_log(conn, user_id, meal_log_id)


def update_meal_log(
    conn: Connection,
    user_id: UUID,
    meal_log_id: UUID,
    payload: MealLogUpdateRequest,
    *,
    version: int,
) -> MealLog:
    existing = conn.execute(
        """
        SELECT meal_log_id, title, occurred_at_utc, note
        FROM meal_logs
        WHERE meal_log_id = %(meal_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"meal_log_id": meal_log_id, "user_id": user_id},
    ).fetchone()
    if existing is None:
        raise not_found("Meal log not found")

    row = conn.execute(
        """
        UPDATE meal_logs
        SET title = %(title)s,
            occurred_at_utc = %(occurred_at_utc)s,
            note = %(note)s,
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE meal_log_id = %(meal_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING meal_log_id
        """,
        {
            "meal_log_id": meal_log_id,
            "user_id": user_id,
            "title": _normalize_text(payload.title) if "title" in payload.model_fields_set else existing["title"],
            "occurred_at_utc": payload.occurred_at_utc or existing["occurred_at_utc"],
            "note": _normalize_text(payload.note) if "note" in payload.model_fields_set else existing["note"],
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not update meal log")
    if payload.items is not None:
        _replace_meal_items(conn, meal_log_id, user_id, payload.items)
    return _fetch_meal_log(conn, user_id, meal_log_id)


def delete_meal_log(conn: Connection, user_id: UUID, meal_log_id: UUID, *, version: int) -> None:
    row = conn.execute(
        """
        UPDATE meal_logs
        SET deleted_at = NOW(),
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE meal_log_id = %(meal_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING meal_log_id
        """,
        {"meal_log_id": meal_log_id, "user_id": user_id, "version": version},
    ).fetchone()
    if row is None:
        raise not_found("Meal log not found")


def _fetch_saved_meal(conn: Connection, user_id: UUID, saved_meal_id: UUID) -> SavedMeal:
    row = conn.execute(
        """
        SELECT
          saved_meal_id,
          label,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM saved_meals
        WHERE saved_meal_id = %(saved_meal_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"saved_meal_id": saved_meal_id, "user_id": user_id},
    ).fetchone()
    if row is None:
        raise not_found("Saved meal not found")
    items = _fetch_saved_meal_items(conn, [saved_meal_id]).get(saved_meal_id, [])
    return SavedMeal(
        saved_meal_id=row["saved_meal_id"],
        label=row["label"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
        items=items,
    )


def list_saved_meals(conn: Connection, user_id: UUID) -> list[SavedMeal]:
    rows = conn.execute(
        """
        SELECT
          saved_meal_id,
          label,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM saved_meals
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        ORDER BY updated_at_utc DESC, created_at_utc DESC
        """,
        {"user_id": user_id},
    ).fetchall()
    saved_meal_ids = [row["saved_meal_id"] for row in rows]
    items_by_saved_meal = _fetch_saved_meal_items(conn, saved_meal_ids)
    return [
        SavedMeal(
            saved_meal_id=row["saved_meal_id"],
            label=row["label"],
            note=row["note"],
            version=int(row["version"]),
            created_at_utc=row["created_at_utc"],
            updated_at_utc=row["updated_at_utc"],
            items=items_by_saved_meal.get(row["saved_meal_id"], []),
        )
        for row in rows
    ]


def create_saved_meal(
    conn: Connection,
    user_id: UUID,
    payload: SavedMealCreateRequest,
    *,
    saved_meal_id: Optional[UUID] = None,
    version: int,
) -> SavedMeal:
    row = conn.execute(
        """
        INSERT INTO saved_meals (
          saved_meal_id,
          user_id,
          label,
          note,
          version
        )
        VALUES (
          %(saved_meal_id)s,
          %(user_id)s,
          %(label)s,
          %(note)s,
          %(version)s
        )
        RETURNING saved_meal_id
        """,
        {
            "saved_meal_id": saved_meal_id or uuid4(),
            "user_id": user_id,
            "label": _required_text(payload.label, "label"),
            "note": _normalize_text(payload.note),
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not create saved meal")
    saved_meal_id = row["saved_meal_id"]
    _replace_saved_meal_items(conn, saved_meal_id, user_id, payload.items)
    return _fetch_saved_meal(conn, user_id, saved_meal_id)


def update_saved_meal(
    conn: Connection,
    user_id: UUID,
    saved_meal_id: UUID,
    payload: SavedMealUpdateRequest,
    *,
    version: int,
) -> SavedMeal:
    existing = conn.execute(
        """
        SELECT saved_meal_id, label, note
        FROM saved_meals
        WHERE saved_meal_id = %(saved_meal_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"saved_meal_id": saved_meal_id, "user_id": user_id},
    ).fetchone()
    if existing is None:
        raise not_found("Saved meal not found")

    row = conn.execute(
        """
        UPDATE saved_meals
        SET label = %(label)s,
            note = %(note)s,
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE saved_meal_id = %(saved_meal_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING saved_meal_id
        """,
        {
            "saved_meal_id": saved_meal_id,
            "user_id": user_id,
            "label": (
                _required_text(payload.label, "label") if "label" in payload.model_fields_set else existing["label"]
            ),
            "note": _normalize_text(payload.note) if "note" in payload.model_fields_set else existing["note"],
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not update saved meal")
    if payload.items is not None:
        _replace_saved_meal_items(conn, saved_meal_id, user_id, payload.items)
    return _fetch_saved_meal(conn, user_id, saved_meal_id)


def delete_saved_meal(conn: Connection, user_id: UUID, saved_meal_id: UUID, *, version: int) -> None:
    row = conn.execute(
        """
        UPDATE saved_meals
        SET deleted_at = NOW(),
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE saved_meal_id = %(saved_meal_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING saved_meal_id
        """,
        {"saved_meal_id": saved_meal_id, "user_id": user_id, "version": version},
    ).fetchone()
    if row is None:
        raise not_found("Saved meal not found")


def build_tracking_feed(conn: Connection, user_id: UUID, limit: int = 50) -> TrackingFeedResponse:
    symptoms = list_symptom_logs(conn, user_id, limit=limit)
    meals = list_meal_logs(conn, user_id, limit=limit)
    symptom_total = conn.execute(
        """
        SELECT COUNT(*) AS count
        FROM symptom_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"user_id": user_id},
    ).fetchone()
    meal_total = conn.execute(
        """
        SELECT COUNT(*) AS count
        FROM meal_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"user_id": user_id},
    ).fetchone()
    items: list[TrackingFeedEntry] = [
        TrackingFeedEntry(entry_type="symptom", occurred_at_utc=item.noted_at_utc, symptom=item) for item in symptoms
    ] + [TrackingFeedEntry(entry_type="meal", occurred_at_utc=item.occurred_at_utc, meal=item) for item in meals]
    items.sort(
        key=lambda item: (
            item.occurred_at_utc,
            item.meal.meal_log_id if item.meal else UUID(int=0),
            item.symptom.symptom_log_id if item.symptom else UUID(int=0),
        ),
        reverse=True,
    )
    limited = items[:limit]
    total = int(symptom_total["count"] or 0) + int(meal_total["count"] or 0)
    return TrackingFeedResponse(total=total, limit=limit, items=limited)


def build_weekly_summary(
    conn: Connection,
    user_id: UUID,
    anchor_date: Optional[date] = None,
) -> WeeklyTrackingSummaryResponse:
    anchor = anchor_date or _now_utc().date()
    window_end = datetime.combine(anchor + timedelta(days=1), time.min, tzinfo=timezone.utc)
    window_start = window_end - timedelta(days=7)

    symptom_rows = conn.execute(
        """
        SELECT
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM symptom_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
          AND noted_at_utc >= %(window_start)s
          AND noted_at_utc < %(window_end)s
        ORDER BY noted_at_utc DESC
        """,
        {"user_id": user_id, "window_start": window_start, "window_end": window_end},
    ).fetchall()
    meal_rows = conn.execute(
        """
        SELECT
          meal_log_id,
          title,
          occurred_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM meal_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
          AND occurred_at_utc >= %(window_start)s
          AND occurred_at_utc < %(window_end)s
        ORDER BY occurred_at_utc DESC
        """,
        {"user_id": user_id, "window_start": window_start, "window_end": window_end},
    ).fetchall()

    meal_ids = [row["meal_log_id"] for row in meal_rows]
    meal_items = _fetch_meal_items(conn, meal_ids)
    symptoms = [_symptom_row_to_model(dict(row)) for row in symptom_rows]
    meals = [
        MealLog(
            meal_log_id=row["meal_log_id"],
            title=row["title"],
            occurred_at_utc=row["occurred_at_utc"],
            note=row["note"],
            version=int(row["version"]),
            created_at_utc=row["created_at_utc"],
            updated_at_utc=row["updated_at_utc"],
            items=meal_items.get(row["meal_log_id"], []),
        )
        for row in meal_rows
    ]

    daily_meals = defaultdict(int)
    daily_symptoms = defaultdict(int)
    symptom_counts = defaultdict(int)
    severities: list[int] = []

    for meal in meals:
        daily_meals[meal.occurred_at_utc.date()] += 1
    for symptom in symptoms:
        daily_symptoms[symptom.noted_at_utc.date()] += 1
        symptom_counts[symptom.symptom_type] += 1
        severities.append(symptom.severity)

    daily_counts = []
    for offset in range(7):
        current_date = anchor - timedelta(days=6 - offset)
        daily_counts.append(
            DailyTrackingCount(
                date=current_date,
                meal_count=daily_meals[current_date],
                symptom_count=daily_symptoms[current_date],
            )
        )

    proximity_groups: list[SymptomProximityGroup] = []
    for symptom in symptoms:
        nearby_meals = []
        for meal in meals:
            if meal.occurred_at_utc > symptom.noted_at_utc:
                continue
            delta = symptom.noted_at_utc - meal.occurred_at_utc
            if delta > timedelta(hours=6):
                continue
            nearby_meals.append(
                ProximityMeal(
                    meal_log_id=meal.meal_log_id,
                    title=meal.title,
                    occurred_at_utc=meal.occurred_at_utc,
                    hours_before_symptom=round(delta.total_seconds() / 3600, 2),
                    item_labels=[item.label for item in meal.items],
                )
            )
        proximity_groups.append(
            SymptomProximityGroup(
                symptom_log_id=symptom.symptom_log_id,
                symptom_type=symptom.symptom_type,
                severity=symptom.severity,
                noted_at_utc=symptom.noted_at_utc,
                nearby_meals=sorted(nearby_meals, key=lambda meal: meal.occurred_at_utc, reverse=True),
            )
        )

    average = None
    if severities:
        average = round(sum(severities) / len(severities), 2)

    return WeeklyTrackingSummaryResponse(
        anchor_date=anchor,
        window_start_utc=window_start,
        window_end_utc=window_end,
        daily_counts=daily_counts,
        symptom_counts=[
            SymptomTypeCount(symptom_type=symptom_type, count=count)
            for symptom_type, count in sorted(symptom_counts.items())
        ],
        severity=TrackingSeveritySummary(
            average=average,
            maximum=max(severities) if severities else None,
        ),
        proximity_groups=proximity_groups,
    )


def count_tracking_rows_for_export(conn: Connection, user_id: UUID) -> dict[str, int]:
    symptom_row = conn.execute(
        """
        SELECT COUNT(*) AS count
        FROM symptom_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"user_id": user_id},
    ).fetchone()
    diet_row = conn.execute(
        """
        SELECT
          COALESCE((
            SELECT COUNT(*)
            FROM meal_logs
            WHERE user_id = %(user_id)s
              AND deleted_at IS NULL
          ), 0)
          + COALESCE((
            SELECT COUNT(*)
            FROM meal_log_items i
            JOIN meal_logs m ON m.meal_log_id = i.meal_log_id
            WHERE m.user_id = %(user_id)s
              AND m.deleted_at IS NULL
          ), 0)
          + COALESCE((
            SELECT COUNT(*)
            FROM custom_foods
            WHERE user_id = %(user_id)s
              AND deleted_at IS NULL
          ), 0)
          + COALESCE((
            SELECT COUNT(*)
            FROM saved_meals
            WHERE user_id = %(user_id)s
              AND deleted_at IS NULL
          ), 0)
          + COALESCE((
            SELECT COUNT(*)
            FROM saved_meal_items i
            JOIN saved_meals s ON s.saved_meal_id = i.saved_meal_id
            WHERE s.user_id = %(user_id)s
              AND s.deleted_at IS NULL
          ), 0) AS count
        """,
        {"user_id": user_id},
    ).fetchone()
    return {
        "symptoms": int((symptom_row["count"] if symptom_row else 0) or 0),
        "diet_logs": int((diet_row["count"] if diet_row else 0) or 0),
    }


def hard_delete_tracking_data(conn: Connection, user_id: UUID, scope: str = "all") -> tuple[int, int]:
    delete_symptoms = scope in {"all", "symptoms_only"}
    delete_diet = scope in {"all", "diet_only"}

    symptom_count = 0
    diet_count = 0

    if delete_symptoms:
        row = conn.execute(
            """
            SELECT COUNT(*) AS count
            FROM symptom_logs
            WHERE user_id = %(user_id)s
            """,
            {"user_id": user_id},
        ).fetchone()
        symptom_count = int((row["count"] if row else 0) or 0)
        conn.execute("DELETE FROM symptom_logs WHERE user_id = %(user_id)s", {"user_id": user_id})

    if delete_diet:
        counts = conn.execute(
            """
            SELECT
              COALESCE((SELECT COUNT(*) FROM meal_logs WHERE user_id = %(user_id)s), 0)
              + COALESCE((
                SELECT COUNT(*)
                FROM meal_log_items i
                JOIN meal_logs m ON m.meal_log_id = i.meal_log_id
                WHERE m.user_id = %(user_id)s
              ), 0)
              + COALESCE((SELECT COUNT(*) FROM custom_foods WHERE user_id = %(user_id)s), 0)
              + COALESCE((SELECT COUNT(*) FROM saved_meals WHERE user_id = %(user_id)s), 0)
              + COALESCE((
                SELECT COUNT(*)
                FROM saved_meal_items i
                JOIN saved_meals s ON s.saved_meal_id = i.saved_meal_id
                WHERE s.user_id = %(user_id)s
              ), 0) AS count
            """,
            {"user_id": user_id},
        ).fetchone()
        diet_count = int((counts["count"] if counts else 0) or 0)
        conn.execute(
            """
            DELETE FROM meal_log_items
            WHERE meal_log_id IN (
              SELECT meal_log_id
              FROM meal_logs
              WHERE user_id = %(user_id)s
            )
            """,
            {"user_id": user_id},
        )
        conn.execute("DELETE FROM meal_logs WHERE user_id = %(user_id)s", {"user_id": user_id})
        conn.execute(
            """
            DELETE FROM saved_meal_items
            WHERE saved_meal_id IN (
              SELECT saved_meal_id
              FROM saved_meals
              WHERE user_id = %(user_id)s
            )
            """,
            {"user_id": user_id},
        )
        conn.execute("DELETE FROM saved_meals WHERE user_id = %(user_id)s", {"user_id": user_id})
        conn.execute("DELETE FROM custom_foods WHERE user_id = %(user_id)s", {"user_id": user_id})

    return symptom_count, diet_count
