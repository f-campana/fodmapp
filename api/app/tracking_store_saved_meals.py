from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, Iterable, Optional
from uuid import UUID, uuid4

from psycopg import Connection

from app.errors import bad_request, not_found
from app.models import (
    SavedMeal,
    SavedMealCreateRequest,
    SavedMealItem,
    SavedMealUpdateRequest,
    TrackingItemInput,
)
from app.tracking_store import _normalize_item_input, _normalize_text, _required_text


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


def _saved_meal_row_to_model(row: Dict[str, Any], items: list[SavedMealItem]) -> SavedMeal:
    return SavedMeal(
        saved_meal_id=row["saved_meal_id"],
        label=row["label"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
        items=items,
    )


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
    return _saved_meal_row_to_model(row, items)


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
    return [_saved_meal_row_to_model(row, items_by_saved_meal.get(row["saved_meal_id"], [])) for row in rows]


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
