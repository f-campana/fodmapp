"""Focused unit tests for _compute_daily_counts in tracking_store.py.

Pure-computation helper — no DB or FastAPI dependency.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

from app.models import MealLog, SymptomLog
from app.tracking_store import _compute_daily_counts

_ANCHOR = date(2026, 3, 20)  # Friday


def _symptom(day: date, *, severity: int = 5, symptom_type: str = "bloating") -> SymptomLog:
    return SymptomLog(
        symptom_log_id=uuid4(),
        symptom_type=symptom_type,
        severity=severity,
        noted_at_utc=datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc).replace(hour=12),
        note=None,
        version=1,
        created_at_utc=datetime.now(tz=timezone.utc),
        updated_at_utc=datetime.now(tz=timezone.utc),
    )


def _meal(day: date, *, title: str = "Lunch") -> MealLog:
    return MealLog(
        meal_log_id=uuid4(),
        title=title,
        occurred_at_utc=datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc).replace(hour=12),
        note=None,
        version=1,
        created_at_utc=datetime.now(tz=timezone.utc),
        updated_at_utc=datetime.now(tz=timezone.utc),
        items=[],
    )


# ---------------------------------------------------------------------------
# daily_counts grid shape
# ---------------------------------------------------------------------------


class TestDailyCountsGrid:
    def test_always_returns_7_entries(self):
        daily_counts, _, _ = _compute_daily_counts([], [], _ANCHOR)
        assert len(daily_counts) == 7

    def test_dates_span_anchor_minus_6_to_anchor(self):
        daily_counts, _, _ = _compute_daily_counts([], [], _ANCHOR)
        dates = [dc.date for dc in daily_counts]
        assert dates[0] == date(2026, 3, 14)
        assert dates[-1] == date(2026, 3, 20)

    def test_dates_are_ascending(self):
        daily_counts, _, _ = _compute_daily_counts([], [], _ANCHOR)
        dates = [dc.date for dc in daily_counts]
        assert dates == sorted(dates)

    def test_empty_inputs_give_zero_counts(self):
        daily_counts, _, _ = _compute_daily_counts([], [], _ANCHOR)
        assert all(dc.meal_count == 0 for dc in daily_counts)
        assert all(dc.symptom_count == 0 for dc in daily_counts)


# ---------------------------------------------------------------------------
# Meal and symptom tallying
# ---------------------------------------------------------------------------


class TestMealTallying:
    def test_single_meal_on_anchor(self):
        daily_counts, _, _ = _compute_daily_counts([_meal(_ANCHOR)], [], _ANCHOR)
        anchor_entry = [dc for dc in daily_counts if dc.date == _ANCHOR][0]
        assert anchor_entry.meal_count == 1

    def test_multiple_meals_same_day(self):
        meals = [_meal(_ANCHOR), _meal(_ANCHOR)]
        daily_counts, _, _ = _compute_daily_counts(meals, [], _ANCHOR)
        anchor_entry = [dc for dc in daily_counts if dc.date == _ANCHOR][0]
        assert anchor_entry.meal_count == 2

    def test_meal_on_different_day(self):
        day = date(2026, 3, 16)
        daily_counts, _, _ = _compute_daily_counts([_meal(day)], [], _ANCHOR)
        entry = [dc for dc in daily_counts if dc.date == day][0]
        assert entry.meal_count == 1
        anchor_entry = [dc for dc in daily_counts if dc.date == _ANCHOR][0]
        assert anchor_entry.meal_count == 0


class TestSymptomTallying:
    def test_single_symptom(self):
        daily_counts, _, _ = _compute_daily_counts([], [_symptom(_ANCHOR)], _ANCHOR)
        anchor_entry = [dc for dc in daily_counts if dc.date == _ANCHOR][0]
        assert anchor_entry.symptom_count == 1

    def test_symptoms_on_different_days(self):
        s1 = _symptom(date(2026, 3, 18))
        s2 = _symptom(date(2026, 3, 19))
        daily_counts, _, _ = _compute_daily_counts([], [s1, s2], _ANCHOR)
        counts = {dc.date: dc.symptom_count for dc in daily_counts}
        assert counts[date(2026, 3, 18)] == 1
        assert counts[date(2026, 3, 19)] == 1
        assert counts[_ANCHOR] == 0


# ---------------------------------------------------------------------------
# Symptom-type counts
# ---------------------------------------------------------------------------


class TestSymptomTypeCounts:
    def test_empty_returns_empty(self):
        _, symptom_counts, _ = _compute_daily_counts([], [], _ANCHOR)
        assert symptom_counts == {}

    def test_single_type(self):
        _, symptom_counts, _ = _compute_daily_counts([], [_symptom(_ANCHOR, symptom_type="bloating")], _ANCHOR)
        assert symptom_counts == {"bloating": 1}

    def test_multiple_types(self):
        symptoms = [
            _symptom(_ANCHOR, symptom_type="bloating"),
            _symptom(_ANCHOR, symptom_type="nausea"),
            _symptom(_ANCHOR, symptom_type="bloating"),
        ]
        _, symptom_counts, _ = _compute_daily_counts([], symptoms, _ANCHOR)
        assert symptom_counts == {"bloating": 2, "nausea": 1}


# ---------------------------------------------------------------------------
# Severities
# ---------------------------------------------------------------------------


class TestSeverities:
    def test_empty_returns_empty(self):
        _, _, severities = _compute_daily_counts([], [], _ANCHOR)
        assert severities == []

    def test_collects_all_severities(self):
        symptoms = [
            _symptom(_ANCHOR, severity=3),
            _symptom(_ANCHOR, severity=7),
            _symptom(_ANCHOR, severity=1),
        ]
        _, _, severities = _compute_daily_counts([], symptoms, _ANCHOR)
        assert sorted(severities) == [1, 3, 7]
