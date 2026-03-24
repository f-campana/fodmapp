"""Focused unit tests for _compute_proximity_groups in tracking_store.py.

Pure-computation helper — no DB or FastAPI dependency.  Tests use
hand-built SymptomLog / MealLog model instances.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.models import MealLog, MealLogItem, SymptomLog
from app.tracking_store import _compute_proximity_groups

_BASE = datetime(2026, 3, 20, 12, 0, 0, tzinfo=timezone.utc)


def _symptom(*, offset_hours: float = 0, severity: int = 5, symptom_type: str = "bloating") -> SymptomLog:
    return SymptomLog(
        symptom_log_id=uuid4(),
        symptom_type=symptom_type,
        severity=severity,
        noted_at_utc=_BASE.replace(hour=12 + int(offset_hours), minute=int((offset_hours % 1) * 60)),
        note=None,
        version=1,
        created_at_utc=_BASE,
        updated_at_utc=_BASE,
    )


def _meal(*, offset_hours: float = 0, title: str = "Lunch", items: list[MealLogItem] | None = None) -> MealLog:
    return MealLog(
        meal_log_id=uuid4(),
        title=title,
        occurred_at_utc=_BASE.replace(hour=12 + int(offset_hours), minute=int((offset_hours % 1) * 60)),
        note=None,
        version=1,
        created_at_utc=_BASE,
        updated_at_utc=_BASE,
        items=items or [],
    )


def _meal_item(label: str = "tomato") -> MealLogItem:
    return MealLogItem(
        meal_log_item_id=uuid4(),
        sort_order=0,
        item_kind="canonical_food",
        label=label,
        food_slug="tomato",
    )


# ---------------------------------------------------------------------------
# Empty inputs
# ---------------------------------------------------------------------------


class TestEmptyInputs:
    def test_no_symptoms(self):
        assert _compute_proximity_groups([], [_meal()]) == []

    def test_no_meals(self):
        groups = _compute_proximity_groups([_symptom()], [])
        assert len(groups) == 1
        assert groups[0].nearby_meals == []

    def test_both_empty(self):
        assert _compute_proximity_groups([], []) == []


# ---------------------------------------------------------------------------
# Time-window filtering
# ---------------------------------------------------------------------------


class TestTimeWindowFiltering:
    def test_meal_within_6h_is_included(self):
        symptom = _symptom(offset_hours=5)
        meal = _meal(offset_hours=0)  # 5 hours before symptom
        groups = _compute_proximity_groups([symptom], [meal])
        assert len(groups[0].nearby_meals) == 1
        assert groups[0].nearby_meals[0].hours_before_symptom == 5.0

    def test_meal_exactly_at_symptom_time_is_included(self):
        symptom = _symptom(offset_hours=0)
        meal = _meal(offset_hours=0)
        groups = _compute_proximity_groups([symptom], [meal])
        assert len(groups[0].nearby_meals) == 1
        assert groups[0].nearby_meals[0].hours_before_symptom == 0.0

    def test_meal_after_symptom_is_excluded(self):
        symptom = _symptom(offset_hours=0)
        meal = _meal(offset_hours=1)  # 1 hour AFTER symptom
        groups = _compute_proximity_groups([symptom], [meal])
        assert groups[0].nearby_meals == []

    def test_meal_more_than_6h_before_is_excluded(self):
        symptom = _symptom(offset_hours=7)
        meal = _meal(offset_hours=0)  # 7 hours before symptom
        groups = _compute_proximity_groups([symptom], [meal])
        assert groups[0].nearby_meals == []

    def test_meal_exactly_6h_before_is_included(self):
        symptom = _symptom(offset_hours=6)
        meal = _meal(offset_hours=0)  # exactly 6 hours
        groups = _compute_proximity_groups([symptom], [meal])
        assert len(groups[0].nearby_meals) == 1
        assert groups[0].nearby_meals[0].hours_before_symptom == 6.0


# ---------------------------------------------------------------------------
# Output structure
# ---------------------------------------------------------------------------


class TestOutputStructure:
    def test_group_carries_symptom_metadata(self):
        symptom = _symptom(severity=7, symptom_type="nausea")
        groups = _compute_proximity_groups([symptom], [])
        g = groups[0]
        assert g.symptom_log_id == symptom.symptom_log_id
        assert g.symptom_type == "nausea"
        assert g.severity == 7
        assert g.noted_at_utc == symptom.noted_at_utc

    def test_nearby_meal_carries_item_labels(self):
        symptom = _symptom(offset_hours=2)
        meal = _meal(offset_hours=0, items=[_meal_item("rice"), _meal_item("chicken")])
        groups = _compute_proximity_groups([symptom], [meal])
        assert groups[0].nearby_meals[0].item_labels == ["rice", "chicken"]

    def test_nearby_meals_sorted_most_recent_first(self):
        symptom = _symptom(offset_hours=5)
        meal_early = _meal(offset_hours=0, title="Early")
        meal_late = _meal(offset_hours=3, title="Late")
        groups = _compute_proximity_groups([symptom], [meal_early, meal_late])
        titles = [m.title for m in groups[0].nearby_meals]
        assert titles == ["Late", "Early"]


# ---------------------------------------------------------------------------
# Multiple symptoms
# ---------------------------------------------------------------------------


class TestMultipleSymptoms:
    def test_each_symptom_gets_own_group(self):
        s1 = _symptom(offset_hours=2, symptom_type="bloating")
        s2 = _symptom(offset_hours=4, symptom_type="nausea")
        meal = _meal(offset_hours=0)
        groups = _compute_proximity_groups([s1, s2], [meal])
        assert len(groups) == 2

    def test_meal_can_appear_in_multiple_groups(self):
        s1 = _symptom(offset_hours=2)
        s2 = _symptom(offset_hours=4)
        meal = _meal(offset_hours=0)
        groups = _compute_proximity_groups([s1, s2], [meal])
        assert len(groups[0].nearby_meals) == 1
        assert len(groups[1].nearby_meals) == 1
        assert groups[0].nearby_meals[0].meal_log_id == groups[1].nearby_meals[0].meal_log_id
