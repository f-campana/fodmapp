"""Focused unit tests for the four update-request validators in api/app/models.py.

Covers MealLogUpdateRequest, SymptomLogUpdateRequest, CustomFoodUpdateRequest,
and SavedMealUpdateRequest validate_update methods.  Pure Pydantic validation,
no DB or FastAPI dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.models import (
    CustomFoodUpdateRequest,
    MealLogUpdateRequest,
    SavedMealUpdateRequest,
    SymptomLogUpdateRequest,
    TrackingItemInput,
)

_NOW = datetime.now(tz=timezone.utc)
_ITEM = TrackingItemInput(item_kind="free_text", free_text_label="coffee")

# ---------------------------------------------------------------------------
# MealLogUpdateRequest
# ---------------------------------------------------------------------------


class TestMealLogUpdateRequest:
    def test_valid_single_field(self):
        req = MealLogUpdateRequest(title="Lunch")
        assert req.title == "Lunch"

    def test_valid_items(self):
        req = MealLogUpdateRequest(items=[_ITEM])
        assert len(req.items) == 1

    def test_rejects_empty_body(self):
        with pytest.raises(ValidationError, match="at least one meal field must be provided"):
            MealLogUpdateRequest()

    def test_rejects_empty_items_list(self):
        with pytest.raises(ValidationError, match="items cannot be empty"):
            MealLogUpdateRequest(items=[])


# ---------------------------------------------------------------------------
# SymptomLogUpdateRequest
# ---------------------------------------------------------------------------


class TestSymptomLogUpdateRequest:
    def test_valid_single_field(self):
        req = SymptomLogUpdateRequest(severity=5)
        assert req.severity == 5

    def test_valid_noted_at(self):
        req = SymptomLogUpdateRequest(noted_at_utc=_NOW)
        assert req.noted_at_utc == _NOW

    def test_rejects_empty_body(self):
        with pytest.raises(ValidationError, match="at least one symptom field must be provided"):
            SymptomLogUpdateRequest()


# ---------------------------------------------------------------------------
# CustomFoodUpdateRequest
# ---------------------------------------------------------------------------


class TestCustomFoodUpdateRequest:
    def test_valid_label(self):
        req = CustomFoodUpdateRequest(label="My granola")
        assert req.label == "My granola"

    def test_valid_note(self):
        req = CustomFoodUpdateRequest(note="homemade")
        assert req.note == "homemade"

    def test_rejects_empty_body(self):
        with pytest.raises(ValidationError, match="at least one custom food field must be provided"):
            CustomFoodUpdateRequest()


# ---------------------------------------------------------------------------
# SavedMealUpdateRequest
# ---------------------------------------------------------------------------


class TestSavedMealUpdateRequest:
    def test_valid_single_field(self):
        req = SavedMealUpdateRequest(label="Breakfast bowl")
        assert req.label == "Breakfast bowl"

    def test_valid_items(self):
        req = SavedMealUpdateRequest(items=[_ITEM])
        assert len(req.items) == 1

    def test_rejects_empty_body(self):
        with pytest.raises(ValidationError, match="at least one saved meal field must be provided"):
            SavedMealUpdateRequest()

    def test_rejects_empty_items_list(self):
        with pytest.raises(ValidationError, match="items cannot be empty"):
            SavedMealUpdateRequest(items=[])
