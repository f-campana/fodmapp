"""Focused unit tests for TrackingItemInput.validate_item in api/app/models.py.

Covers the cross-field validator that enforces item_kind-specific field
constraints.  No DB or FastAPI dependency — pure Pydantic model validation.
"""
from __future__ import annotations

from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models import TrackingItemInput

_CID = uuid4()


# ---------------------------------------------------------------------------
# canonical_food
# ---------------------------------------------------------------------------


class TestCanonicalFood:
    def test_valid(self):
        item = TrackingItemInput(item_kind="canonical_food", food_slug="tomato")
        assert item.item_kind == "canonical_food"
        assert item.food_slug == "tomato"

    def test_valid_with_optional_fields(self):
        item = TrackingItemInput(
            item_kind="canonical_food", food_slug="tomato",
            quantity_text="100g", note="fresh",
        )
        assert item.quantity_text == "100g"
        assert item.note == "fresh"

    def test_rejects_missing_food_slug(self):
        with pytest.raises(ValidationError, match="canonical_food items require food_slug only"):
            TrackingItemInput(item_kind="canonical_food")

    def test_rejects_empty_food_slug(self):
        with pytest.raises(ValidationError, match="canonical_food items require food_slug only"):
            TrackingItemInput(item_kind="canonical_food", food_slug="")

    def test_rejects_custom_food_id_present(self):
        with pytest.raises(ValidationError, match="canonical_food items require food_slug only"):
            TrackingItemInput(item_kind="canonical_food", food_slug="tomato", custom_food_id=_CID)

    def test_rejects_free_text_label_present(self):
        with pytest.raises(ValidationError, match="canonical_food items require food_slug only"):
            TrackingItemInput(item_kind="canonical_food", food_slug="tomato", free_text_label="x")


# ---------------------------------------------------------------------------
# custom_food
# ---------------------------------------------------------------------------


class TestCustomFood:
    def test_valid(self):
        item = TrackingItemInput(item_kind="custom_food", custom_food_id=_CID)
        assert item.custom_food_id == _CID

    def test_valid_with_optional_fields(self):
        item = TrackingItemInput(
            item_kind="custom_food", custom_food_id=_CID,
            quantity_text="1 cup", note="homemade",
        )
        assert item.quantity_text == "1 cup"

    def test_rejects_missing_custom_food_id(self):
        with pytest.raises(ValidationError, match="custom_food items require custom_food_id only"):
            TrackingItemInput(item_kind="custom_food")

    def test_rejects_food_slug_present(self):
        with pytest.raises(ValidationError, match="custom_food items require custom_food_id only"):
            TrackingItemInput(item_kind="custom_food", custom_food_id=_CID, food_slug="x")

    def test_rejects_free_text_label_present(self):
        with pytest.raises(ValidationError, match="custom_food items require custom_food_id only"):
            TrackingItemInput(item_kind="custom_food", custom_food_id=_CID, free_text_label="x")


# ---------------------------------------------------------------------------
# free_text
# ---------------------------------------------------------------------------


class TestFreeText:
    def test_valid(self):
        item = TrackingItemInput(item_kind="free_text", free_text_label="morning coffee")
        assert item.free_text_label == "morning coffee"

    def test_valid_with_optional_fields(self):
        item = TrackingItemInput(
            item_kind="free_text", free_text_label="coffee",
            quantity_text="2 cups", note="decaf",
        )
        assert item.quantity_text == "2 cups"

    def test_rejects_missing_free_text_label(self):
        with pytest.raises(ValidationError, match="free_text items require free_text_label only"):
            TrackingItemInput(item_kind="free_text")

    def test_rejects_empty_free_text_label(self):
        with pytest.raises(ValidationError, match="free_text items require free_text_label only"):
            TrackingItemInput(item_kind="free_text", free_text_label="")

    def test_rejects_food_slug_present(self):
        with pytest.raises(ValidationError, match="free_text items require free_text_label only"):
            TrackingItemInput(item_kind="free_text", free_text_label="coffee", food_slug="x")

    def test_rejects_custom_food_id_present(self):
        with pytest.raises(ValidationError, match="free_text items require free_text_label only"):
            TrackingItemInput(item_kind="free_text", free_text_label="coffee", custom_food_id=_CID)
