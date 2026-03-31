import { describe, expect, it } from "vitest";

import {
  mapCustomFoodUpdateRequestToCustomFoodPatch,
  mapMealLogUpdateRequestToMealEntryPatch,
  mapSavedMealUpdateRequestToSavedMealPatch,
  mapSymptomLogUpdateRequestToSymptomEntryPatch,
  mapTrackingFeedResponse,
  mapWeeklyTrackingSummaryResponse,
} from "./tracking";

describe("tracking derived projections", () => {
  it("keeps nested tracking records raw while marking feed projections as derived", () => {
    const feed = mapTrackingFeedResponse({
      total: 2,
      limit: 50,
      items: [
        {
          entry_type: "meal",
          occurred_at_utc: "2026-03-22T10:00:00Z",
          meal: {
            meal_log_id: "meal-1",
            title: "Lunch",
            occurred_at_utc: "2026-03-22T10:00:00Z",
            note: null,
            version: 1,
            created_at_utc: "2026-03-22T10:00:00Z",
            updated_at_utc: "2026-03-22T10:05:00Z",
            items: [],
          },
        },
        {
          entry_type: "symptom",
          occurred_at_utc: "2026-03-22T12:00:00Z",
          symptom: {
            symptom_log_id: "symptom-1",
            symptom_type: "bloating",
            severity: 4,
            noted_at_utc: "2026-03-22T12:00:00Z",
            note: null,
            version: 1,
            created_at_utc: "2026-03-22T12:00:00Z",
            updated_at_utc: "2026-03-22T12:10:00Z",
          },
        },
      ],
    });

    expect(feed.provenance).toEqual({
      kind: "tracking_projection",
      provider: "fodmapp",
      sourceSlug: "tracking_feed",
      capturedAt: null,
    });
    expect(feed.evidenceTier).toBe("derived");
    expect(feed.items[0]?.provenance.kind).toBe("tracking_projection");
    expect(feed.items[0]?.evidenceTier).toBe("derived");
    expect(feed.items[0]?.entryType).toBe("meal");
    if (feed.items[0]?.entryType !== "meal") {
      throw new Error("expected_meal_entry");
    }
    expect(feed.items[0].meal.provenance.kind).toBe("tracking_log");
    expect(feed.items[0].meal.evidenceTier).toBe("user_entered");
    expect(feed.items[1]?.provenance.kind).toBe("tracking_projection");
    expect(feed.items[1]?.evidenceTier).toBe("derived");
    expect(feed.items[1]?.entryType).toBe("symptom");
    if (feed.items[1]?.entryType !== "symptom") {
      throw new Error("expected_symptom_entry");
    }
    expect(feed.items[1].symptom.provenance.kind).toBe("tracking_log");
    expect(feed.items[1].symptom.evidenceTier).toBe("user_entered");
  });

  it("marks weekly summaries as derived tracking projections", () => {
    const summary = mapWeeklyTrackingSummaryResponse({
      anchor_date: "2026-03-22",
      window_start_utc: "2026-03-15T00:00:00Z",
      window_end_utc: "2026-03-22T23:59:59Z",
      daily_counts: [],
      symptom_counts: [],
      severity: {
        average: 3,
        maximum: 5,
      },
      proximity_groups: [],
    });

    expect(summary.provenance).toEqual({
      kind: "tracking_projection",
      provider: "fodmapp",
      sourceSlug: "weekly_tracking_summary",
      capturedAt: "2026-03-22T23:59:59Z",
    });
    expect(summary.evidenceTier).toBe("derived");
  });

  it("preserves explicit null values in update patch mappers", () => {
    expect(
      mapMealLogUpdateRequestToMealEntryPatch({
        occurred_at_utc: null,
        title: null,
        note: null,
        items: undefined,
      }),
    ).toEqual({
      occurredAtUtc: null,
      title: null,
      note: null,
      items: undefined,
    });

    expect(
      mapSymptomLogUpdateRequestToSymptomEntryPatch({
        symptom_type: "bloating",
        severity: null,
        noted_at_utc: null,
        note: null,
      }),
    ).toEqual({
      symptomType: "bloating",
      severity: null,
      notedAtUtc: null,
      note: null,
    });

    expect(
      mapCustomFoodUpdateRequestToCustomFoodPatch({
        label: null,
        note: null,
      }),
    ).toEqual({
      label: null,
      note: null,
    });

    expect(
      mapSavedMealUpdateRequestToSavedMealPatch({
        label: null,
        note: null,
        items: undefined,
      }),
    ).toEqual({
      label: null,
      note: null,
      items: undefined,
    });
  });
});
