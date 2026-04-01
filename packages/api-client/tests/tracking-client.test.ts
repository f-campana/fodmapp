import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getTrackingFeed,
  getTrackingHubReadModel,
  getWeeklyTrackingSummary,
  type ProtectedApiAuth,
} from "../src";

const apiConfig = {
  apiBaseUrl: "https://api.fodmap.example",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("@fodmapp/api-client protected tracking reads", () => {
  it("sends Authorization bearer headers on runtime feed requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          total: 0,
          limit: 50,
          items: [],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    const result = await getTrackingFeed(apiConfig, auth, 50);

    expect(result).toMatchObject({
      total: 0,
      limit: 50,
      items: [],
      evidenceTier: "derived",
      provenance: {
        kind: "tracking_projection",
        sourceSlug: "tracking_feed",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/tracking/feed?limit=50",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token_123",
    );
    expect((init.headers as Headers).has("X-User-Id")).toBe(false);
  });

  it("maps tracking hub feed and summary responses into domain read models", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total: 1,
            limit: 25,
            items: [
              {
                entry_type: "meal",
                occurred_at_utc: "2026-03-22T10:00:00Z",
                meal: {
                  meal_log_id: "meal-1",
                  title: "Déjeuner",
                  occurred_at_utc: "2026-03-22T10:00:00Z",
                  note: null,
                  version: 1,
                  created_at_utc: "2026-03-22T10:00:00Z",
                  updated_at_utc: "2026-03-22T10:05:00Z",
                  items: [
                    {
                      meal_log_item_id: "meal-item-1",
                      sort_order: 1,
                      item_kind: "canonical_food",
                      label: "Ail cru",
                      food_slug: "phase2-ail-cru",
                      quantity_text: "10 g",
                      note: null,
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            anchor_date: "2026-03-22",
            window_start_utc: "2026-03-15T00:00:00Z",
            window_end_utc: "2026-03-22T23:59:59Z",
            daily_counts: [
              {
                date: "2026-03-22",
                meal_count: 1,
                symptom_count: 1,
              },
            ],
            symptom_counts: [
              {
                symptom_type: "bloating",
                count: 1,
              },
            ],
            severity: {
              average: 3,
              maximum: 5,
            },
            proximity_groups: [
              {
                symptom_log_id: "symptom-1",
                symptom_type: "bloating",
                severity: 4,
                noted_at_utc: "2026-03-22T12:00:00Z",
                nearby_meals: [
                  {
                    meal_log_id: "meal-1",
                    title: "Déjeuner",
                    occurred_at_utc: "2026-03-22T10:00:00Z",
                    hours_before_symptom: 2,
                    item_labels: ["Ail cru"],
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    const result = await getTrackingHubReadModel(apiConfig, auth, {
      anchorDate: "2026-03-22",
      feedLimit: 25,
    });

    expect(result).toMatchObject({
      feed: {
        total: 1,
        limit: 25,
        evidenceTier: "derived",
        provenance: {
          kind: "tracking_projection",
          sourceSlug: "tracking_feed",
        },
        items: [
          {
            entryType: "meal",
            meal: {
              mealLogId: "meal-1",
              occurredAtUtc: "2026-03-22T10:00:00Z",
              evidenceTier: "user_entered",
              items: [
                {
                  reference: {
                    kind: "canonical_food",
                    foodSlug: "phase2-ail-cru",
                    label: "Ail cru",
                  },
                  quantityText: "10 g",
                },
              ],
            },
          },
        ],
      },
      summary: {
        anchorDate: "2026-03-22",
        evidenceTier: "derived",
        provenance: {
          kind: "tracking_projection",
          sourceSlug: "weekly_tracking_summary",
        },
        dailyCounts: [
          {
            date: "2026-03-22",
            mealCount: 1,
            symptomCount: 1,
          },
        ],
        symptomCounts: [
          {
            symptomType: "bloating",
            count: 1,
          },
        ],
        proximityGroups: [
          {
            symptomLogId: "symptom-1",
            nearbyMeals: [
              {
                mealLogId: "meal-1",
                hoursBeforeSymptom: 2,
                itemLabels: ["Ail cru"],
              },
            ],
          },
        ],
      },
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://api.fodmap.example/v0/me/tracking/feed?limit=25",
      "https://api.fodmap.example/v0/me/tracking/summary/weekly?anchor_date=2026-03-22",
    ]);
  });

  it("skips malformed tracking feed rows instead of failing the hub read", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total: 2,
            limit: 25,
            items: [
              {
                entry_type: "meal",
                occurred_at_utc: "2026-03-22T10:00:00Z",
                meal: null,
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
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            anchor_date: "2026-03-22",
            window_start_utc: "2026-03-15T00:00:00Z",
            window_end_utc: "2026-03-22T23:59:59Z",
            daily_counts: [],
            symptom_counts: [],
            severity: {
              average: null,
              maximum: null,
            },
            proximity_groups: [],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    const result = await getTrackingHubReadModel(apiConfig, auth, {
      anchorDate: "2026-03-22",
      feedLimit: 25,
    });

    expect(result.feed.items).toHaveLength(1);
    expect(result.feed.items[0]?.entryType).toBe("symptom");
    expect(result.feed.total).toBe(2);
  });

  it("uses the preview auth seam for protected weekly summaries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          anchor_date: "2026-03-22",
          window_start_utc: "2026-03-15T00:00:00Z",
          window_end_utc: "2026-03-22T23:59:59Z",
          daily_counts: [],
          symptom_counts: [],
          severity: {
            average: null,
            maximum: null,
          },
          proximity_groups: [],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getWeeklyTrackingSummary(
      apiConfig,
      {
        mode: "preview",
        userId: "11111111-1111-4111-8111-111111111111",
      },
      "2026-03-22",
    );

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get("X-User-Id")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect((init.headers as Headers).has("Authorization")).toBe(false);
  });

  it("fails fast when a runtime session token is unavailable", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue(null),
    };

    await expect(getTrackingFeed(apiConfig, auth, 50)).rejects.toThrow(
      "session_token_unavailable",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when the API base URL is missing", async () => {
    vi.stubGlobal("fetch", vi.fn());

    await expect(
      getTrackingFeed(
        { apiBaseUrl: null },
        { mode: "preview", userId: "preview-user" },
        50,
      ),
    ).rejects.toThrow("tracking-api error 0: api_not_configured");
  });
});
