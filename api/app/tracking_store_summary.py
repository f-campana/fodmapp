from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from uuid import UUID

from psycopg import Connection

from app.models import (
    DailyTrackingCount,
    MealLog,
    ProximityMeal,
    SymptomLog,
    SymptomProximityGroup,
    SymptomTypeCount,
    TrackingFeedEntry,
    TrackingFeedResponse,
    TrackingSeveritySummary,
    WeeklyTrackingSummaryResponse,
)
from app.tracking_store import _now_utc, _symptom_row_to_model, list_symptom_logs
from app.tracking_store_meals import _fetch_meal_items, _meal_log_row_to_model, list_meal_logs


def build_tracking_feed(conn: Connection, user_id: UUID, limit: int = 50) -> TrackingFeedResponse:
    symptoms = list_symptom_logs(conn, user_id, limit=limit)
    meals = list_meal_logs(conn, user_id, limit=limit)
    symptom_total = conn.execute(
        """
        SELECT COUNT(*) AS count
        FROM symptom_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"user_id": user_id},
    ).fetchone()
    meal_total = conn.execute(
        """
        SELECT COUNT(*) AS count
        FROM meal_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"user_id": user_id},
    ).fetchone()
    items: list[TrackingFeedEntry] = [
        TrackingFeedEntry(entry_type="symptom", occurred_at_utc=item.noted_at_utc, symptom=item) for item in symptoms
    ] + [TrackingFeedEntry(entry_type="meal", occurred_at_utc=item.occurred_at_utc, meal=item) for item in meals]
    items.sort(
        key=lambda item: (
            item.occurred_at_utc,
            item.meal.meal_log_id if item.meal else UUID(int=0),
            item.symptom.symptom_log_id if item.symptom else UUID(int=0),
        ),
        reverse=True,
    )
    limited = items[:limit]
    total = int(symptom_total["count"] or 0) + int(meal_total["count"] or 0)
    return TrackingFeedResponse(total=total, limit=limit, items=limited)


def _compute_daily_counts(
    meals: list[MealLog],
    symptoms: list[SymptomLog],
    anchor: date,
) -> tuple[list[DailyTrackingCount], dict[str, int], list[int]]:
    """Aggregate per-day meal/symptom counts, symptom-type tallies, and severities.

    Returns ``(daily_counts, symptom_type_counts, severities)``
    where *daily_counts* is a 7-element list from ``anchor - 6 days`` to *anchor*.
    """
    daily_meals: dict[date, int] = defaultdict(int)
    daily_symptoms: dict[date, int] = defaultdict(int)
    symptom_type_counts: dict[str, int] = defaultdict(int)
    severities: list[int] = []

    for meal in meals:
        daily_meals[meal.occurred_at_utc.date()] += 1
    for symptom in symptoms:
        daily_symptoms[symptom.noted_at_utc.date()] += 1
        symptom_type_counts[symptom.symptom_type] += 1
        severities.append(symptom.severity)

    daily_counts = [
        DailyTrackingCount(
            date=anchor - timedelta(days=6 - offset),
            meal_count=daily_meals[anchor - timedelta(days=6 - offset)],
            symptom_count=daily_symptoms[anchor - timedelta(days=6 - offset)],
        )
        for offset in range(7)
    ]

    return daily_counts, dict(symptom_type_counts), severities


def _compute_proximity_groups(
    symptoms: list[SymptomLog],
    meals: list[MealLog],
) -> list[SymptomProximityGroup]:
    """Find meals within 6 hours before each symptom."""
    groups: list[SymptomProximityGroup] = []
    for symptom in symptoms:
        nearby_meals = []
        for meal in meals:
            if meal.occurred_at_utc > symptom.noted_at_utc:
                continue
            delta = symptom.noted_at_utc - meal.occurred_at_utc
            if delta > timedelta(hours=6):
                continue
            nearby_meals.append(
                ProximityMeal(
                    meal_log_id=meal.meal_log_id,
                    title=meal.title,
                    occurred_at_utc=meal.occurred_at_utc,
                    hours_before_symptom=round(delta.total_seconds() / 3600, 2),
                    item_labels=[item.label for item in meal.items],
                )
            )
        groups.append(
            SymptomProximityGroup(
                symptom_log_id=symptom.symptom_log_id,
                symptom_type=symptom.symptom_type,
                severity=symptom.severity,
                noted_at_utc=symptom.noted_at_utc,
                nearby_meals=sorted(nearby_meals, key=lambda m: m.occurred_at_utc, reverse=True),
            )
        )
    return groups


def build_weekly_summary(
    conn: Connection,
    user_id: UUID,
    anchor_date: Optional[date] = None,
) -> WeeklyTrackingSummaryResponse:
    anchor = anchor_date or _now_utc().date()
    window_end = datetime.combine(anchor + timedelta(days=1), time.min, tzinfo=timezone.utc)
    window_start = window_end - timedelta(days=7)

    symptom_rows = conn.execute(
        """
        SELECT
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM symptom_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
          AND noted_at_utc >= %(window_start)s
          AND noted_at_utc < %(window_end)s
        ORDER BY noted_at_utc DESC
        """,
        {"user_id": user_id, "window_start": window_start, "window_end": window_end},
    ).fetchall()
    meal_rows = conn.execute(
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
          AND occurred_at_utc >= %(window_start)s
          AND occurred_at_utc < %(window_end)s
        ORDER BY occurred_at_utc DESC
        """,
        {"user_id": user_id, "window_start": window_start, "window_end": window_end},
    ).fetchall()

    meal_ids = [row["meal_log_id"] for row in meal_rows]
    meal_items = _fetch_meal_items(conn, meal_ids)
    symptoms = [_symptom_row_to_model(dict(row)) for row in symptom_rows]
    meals = [_meal_log_row_to_model(row, meal_items.get(row["meal_log_id"], [])) for row in meal_rows]

    daily_counts, symptom_counts, severities = _compute_daily_counts(meals, symptoms, anchor)

    proximity_groups = _compute_proximity_groups(symptoms, meals)

    average = None
    if severities:
        average = round(sum(severities) / len(severities), 2)

    return WeeklyTrackingSummaryResponse(
        anchor_date=anchor,
        window_start_utc=window_start,
        window_end_utc=window_end,
        daily_counts=daily_counts,
        symptom_counts=[
            SymptomTypeCount(symptom_type=symptom_type, count=count)
            for symptom_type, count in sorted(symptom_counts.items())
        ],
        severity=TrackingSeveritySummary(
            average=average,
            maximum=max(severities) if severities else None,
        ),
        proximity_groups=proximity_groups,
    )
