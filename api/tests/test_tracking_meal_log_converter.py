"""Focused unit tests for _meal_log_row_to_model in tracking_store.py.

Pure function that converts a DB row dict + items list to a MealLog model.
No DB or FastAPI dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.models import MealLogItem
from app.tracking_store import _meal_log_row_to_model

_NOW = datetime.now(tz=timezone.utc)


def _make_row(**overrides):
    base = {
        "meal_log_id": uuid4(),
        "title": "Lunch",
        "occurred_at_utc": _NOW,
        "note": "light meal",
        "version": 2,
        "created_at_utc": _NOW,
        "updated_at_utc": _NOW,
    }
    base.update(overrides)
    return base


def _make_item(**overrides):
    base = {
        "meal_log_item_id": uuid4(),
        "sort_order": 0,
        "item_kind": "canonical_food",
        "label": "Tomato",
        "food_slug": "tomato",
        "custom_food_id": None,
        "quantity_text": "100g",
        "note": None,
    }
    base.update(overrides)
    return MealLogItem(**base)


class TestMealLogRowToModel:
    def test_all_fields_mapped(self):
        row = _make_row()
        items = [_make_item()]
        model = _meal_log_row_to_model(row, items)
        assert model.meal_log_id == row["meal_log_id"]
        assert model.title == "Lunch"
        assert model.occurred_at_utc == _NOW
        assert model.note == "light meal"
        assert model.version == 2
        assert model.created_at_utc == _NOW
        assert model.updated_at_utc == _NOW
        assert model.items == items

    def test_version_coerced_to_int(self):
        row = _make_row(version="5")
        model = _meal_log_row_to_model(row, [])
        assert model.version == 5
        assert isinstance(model.version, int)

    def test_note_none(self):
        row = _make_row(note=None)
        model = _meal_log_row_to_model(row, [])
        assert model.note is None

    def test_empty_items(self):
        row = _make_row()
        model = _meal_log_row_to_model(row, [])
        assert model.items == []

    def test_multiple_items_preserved(self):
        row = _make_row()
        items = [_make_item(sort_order=0), _make_item(sort_order=1)]
        model = _meal_log_row_to_model(row, items)
        assert len(model.items) == 2
        assert model.items[0].sort_order == 0
        assert model.items[1].sort_order == 1
