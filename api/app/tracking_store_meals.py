from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, Iterable, Optional
from uuid import UUID, uuid4

from psycopg import Connection

from app.errors import bad_request, not_found
from app.models import (
    MealLog,
    MealLogCreateRequest,
    MealLogItem,
    MealLogUpdateRequest,
    TrackingItemInput,
)
from app.tracking_store import _normalize_item_input, _normalize_text


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


def _meal_log_row_to_model(row: Dict[str, Any], items: list[MealLogItem]) -> MealLog:
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
    return _meal_log_row_to_model(row, items)


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
    return [_meal_log_row_to_model(row, items_by_meal.get(row["meal_log_id"], [])) for row in rows]


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
