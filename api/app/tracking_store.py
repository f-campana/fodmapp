from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from psycopg import Connection
from psycopg.types.json import Jsonb

from app import sql as app_sql
from app.errors import bad_request, locked, not_found
from app.models import (
    CustomFood,
    CustomFoodCreateRequest,
    CustomFoodUpdateRequest,
    TrackingItemInput,
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


def _custom_food_row_to_model(row: Dict[str, Any]) -> CustomFood:
    return CustomFood(
        custom_food_id=row["custom_food_id"],
        label=row["label"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
    )


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
    return [_custom_food_row_to_model(dict(row)) for row in rows]


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
    return _custom_food_row_to_model(dict(row))


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
    return _custom_food_row_to_model(dict(row))


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
