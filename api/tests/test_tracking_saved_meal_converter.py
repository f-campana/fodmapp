"""Focused unit tests for _saved_meal_row_to_model in tracking_store.py.

Pure function that converts a DB row dict + items list to a SavedMeal model.
No DB or FastAPI dependency.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.models import SavedMealItem
from app.tracking_store import _saved_meal_row_to_model

_NOW = datetime.now(tz=timezone.utc)


def _make_row(**overrides):
    base = {
        "saved_meal_id": uuid4(),
        "label": "Petit-déjeuner",
        "note": "quotidien",
        "version": 1,
        "created_at_utc": _NOW,
        "updated_at_utc": _NOW,
    }
    base.update(overrides)
    return base


def _make_item(**overrides):
    base = {
        "saved_meal_item_id": uuid4(),
        "sort_order": 0,
        "item_kind": "canonical_food",
        "label": "Riz",
        "food_slug": "rice",
        "custom_food_id": None,
        "quantity_text": None,
        "note": None,
    }
    base.update(overrides)
    return SavedMealItem(**base)


class TestSavedMealRowToModel:
    def test_all_fields_mapped(self):
        row = _make_row()
        items = [_make_item()]
        model = _saved_meal_row_to_model(row, items)
        assert model.saved_meal_id == row["saved_meal_id"]
        assert model.label == "Petit-déjeuner"
        assert model.note == "quotidien"
        assert model.version == 1
        assert model.created_at_utc == _NOW
        assert model.updated_at_utc == _NOW
        assert model.items == items

    def test_version_coerced_to_int(self):
        row = _make_row(version="3")
        model = _saved_meal_row_to_model(row, [])
        assert model.version == 3
        assert isinstance(model.version, int)

    def test_note_none(self):
        row = _make_row(note=None)
        model = _saved_meal_row_to_model(row, [])
        assert model.note is None

    def test_empty_items(self):
        row = _make_row()
        model = _saved_meal_row_to_model(row, [])
        assert model.items == []

    def test_multiple_items_preserved(self):
        row = _make_row()
        items = [_make_item(sort_order=0), _make_item(sort_order=1)]
        model = _saved_meal_row_to_model(row, items)
        assert len(model.items) == 2
        assert model.items[0].sort_order == 0
        assert model.items[1].sort_order == 1
