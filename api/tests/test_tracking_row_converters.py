"""Focused unit tests for row-to-model converters in tracking_store.py.

Pure functions that convert DB row dicts to Pydantic models.
No DB or FastAPI dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.tracking_store import _custom_food_row_to_model
from app.tracking_store_meals import _meal_item_row_to_model
from app.tracking_store_saved_meals import _saved_meal_item_row_to_model
from app.tracking_store_symptoms import _symptom_row_to_model

_NOW = datetime.now(tz=timezone.utc)


# ---------------------------------------------------------------------------
# _custom_food_row_to_model
# ---------------------------------------------------------------------------


class TestCustomFoodRowToModel:
    def _make_row(self, **overrides):
        base = {
            "custom_food_id": uuid4(),
            "label": "My granola",
            "note": "homemade",
            "version": 3,
            "created_at_utc": _NOW,
            "updated_at_utc": _NOW,
        }
        base.update(overrides)
        return base

    def test_all_fields_mapped(self):
        row = self._make_row()
        model = _custom_food_row_to_model(row)
        assert model.custom_food_id == row["custom_food_id"]
        assert model.label == "My granola"
        assert model.note == "homemade"
        assert model.version == 3
        assert model.created_at_utc == _NOW
        assert model.updated_at_utc == _NOW

    def test_version_coerced_to_int(self):
        row = self._make_row(version="7")
        model = _custom_food_row_to_model(row)
        assert model.version == 7
        assert isinstance(model.version, int)

    def test_note_none(self):
        row = self._make_row(note=None)
        model = _custom_food_row_to_model(row)
        assert model.note is None


# ---------------------------------------------------------------------------
# _symptom_row_to_model
# ---------------------------------------------------------------------------


class TestSymptomRowToModel:
    def _make_row(self, **overrides):
        base = {
            "symptom_log_id": uuid4(),
            "symptom_type": "bloating",
            "severity": 5,
            "noted_at_utc": _NOW,
            "note": None,
            "version": 1,
            "created_at_utc": _NOW,
            "updated_at_utc": _NOW,
        }
        base.update(overrides)
        return base

    def test_all_fields_mapped(self):
        row = self._make_row()
        model = _symptom_row_to_model(row)
        assert model.symptom_log_id == row["symptom_log_id"]
        assert model.symptom_type == "bloating"
        assert model.severity == 5
        assert model.version == 1

    def test_version_coerced_to_int(self):
        row = self._make_row(version="2")
        model = _symptom_row_to_model(row)
        assert model.version == 2
        assert isinstance(model.version, int)

    def test_severity_coerced_to_int(self):
        row = self._make_row(severity="8")
        model = _symptom_row_to_model(row)
        assert model.severity == 8
        assert isinstance(model.severity, int)


# ---------------------------------------------------------------------------
# _meal_item_row_to_model
# ---------------------------------------------------------------------------


class TestMealItemRowToModel:
    def _make_row(self, **overrides):
        base = {
            "meal_log_item_id": uuid4(),
            "sort_order": 0,
            "item_kind": "canonical_food",
            "label_snapshot": "Tomate",
            "food_slug_snapshot": "tomato",
            "custom_food_id": None,
            "quantity_text": "100g",
            "note": None,
        }
        base.update(overrides)
        return base

    def test_all_fields_mapped(self):
        row = self._make_row()
        model = _meal_item_row_to_model(row)
        assert model.meal_log_item_id == row["meal_log_item_id"]
        assert model.sort_order == 0
        assert model.item_kind == "canonical_food"
        assert model.label == "Tomate"
        assert model.food_slug == "tomato"
        assert model.quantity_text == "100g"

    def test_sort_order_coerced_to_int(self):
        row = self._make_row(sort_order="3")
        model = _meal_item_row_to_model(row)
        assert model.sort_order == 3
        assert isinstance(model.sort_order, int)

    def test_free_text_item(self):
        row = self._make_row(
            item_kind="free_text",
            food_slug_snapshot=None,
            label_snapshot="morning coffee",
        )
        model = _meal_item_row_to_model(row)
        assert model.item_kind == "free_text"
        assert model.label == "morning coffee"
        assert model.food_slug is None


# ---------------------------------------------------------------------------
# _saved_meal_item_row_to_model
# ---------------------------------------------------------------------------


class TestSavedMealItemRowToModel:
    def _make_row(self, **overrides):
        base = {
            "saved_meal_item_id": uuid4(),
            "sort_order": 0,
            "item_kind": "canonical_food",
            "label_snapshot": "Riz",
            "food_slug_snapshot": "rice",
            "custom_food_id": None,
            "quantity_text": None,
            "note": None,
        }
        base.update(overrides)
        return base

    def test_all_fields_mapped(self):
        row = self._make_row()
        model = _saved_meal_item_row_to_model(row)
        assert model.saved_meal_item_id == row["saved_meal_item_id"]
        assert model.label == "Riz"
        assert model.food_slug == "rice"

    def test_sort_order_coerced_to_int(self):
        row = self._make_row(sort_order="1")
        model = _saved_meal_item_row_to_model(row)
        assert model.sort_order == 1
        assert isinstance(model.sort_order, int)
