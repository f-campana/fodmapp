import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCustomFoodRecord,
  createMealEntry,
  createSavedMealRecord,
  createSymptomEntry,
  deleteCustomFoodRecord,
  deleteMealEntry,
  deleteSavedMealRecord,
  deleteSymptomEntry,
  getTrackingFeed,
  getTrackingHubReadModel,
  getWeeklyTrackingSummary,
  listCustomFoodRecords,
  listMealEntries,
  listSavedMealRecords,
  listSymptomEntries,
  type ProtectedApiAuth,
  updateCustomFoodRecord,
  updateMealEntry,
  updateSavedMealRecord,
  updateSymptomEntry,
} from "../src";

const apiConfig = {
  apiBaseUrl: "https://api.fodmap.example",
};

function createRuntimeAuth(): ProtectedApiAuth {
  return {
    mode: "runtime",
    getToken: vi.fn().mockResolvedValue("token_123"),
  };
}

function getJsonBody(init: RequestInit | undefined): unknown {
  return JSON.parse(String(init?.body));
}

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

describe("@fodmapp/api-client protected tracking writes", () => {
  it("maps symptom drafts into preview create requests and domain entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          symptom_log_id: "symptom-1",
          symptom_type: "bloating",
          severity: 4,
          noted_at_utc: "2026-03-20T10:00:00Z",
          note: null,
          version: 1,
          created_at_utc: "2026-03-20T10:00:00Z",
          updated_at_utc: "2026-03-20T10:00:00Z",
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSymptomEntry(
      apiConfig,
      {
        mode: "preview",
        userId: "11111111-1111-4111-8111-111111111111",
      },
      {
        symptomType: "bloating",
        severity: 4,
        notedAtUtc: "2026-03-20T10:00:00Z",
        note: null,
      },
    );

    expect(result).toMatchObject({
      kind: "symptom_log",
      symptomLogId: "symptom-1",
      symptomType: "bloating",
      severity: 4,
      evidenceTier: "user_entered",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/tracking/symptoms",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(getJsonBody(init)).toEqual({
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: null,
    });
    expect((init.headers as Headers).get("X-User-Id")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("maps symptom drafts into runtime update requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          symptom_log_id: "symptom-1",
          symptom_type: "pain",
          severity: 2,
          noted_at_utc: "2026-03-21T08:00:00Z",
          note: "Mieux",
          version: 2,
          created_at_utc: "2026-03-20T10:00:00Z",
          updated_at_utc: "2026-03-21T08:00:00Z",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    const result = await updateSymptomEntry(apiConfig, auth, "symptom-1", {
      symptomType: "pain",
      severity: 2,
      notedAtUtc: "2026-03-21T08:00:00Z",
      note: "Mieux",
    });

    expect(result).toMatchObject({
      symptomLogId: "symptom-1",
      symptomType: "pain",
      severity: 2,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.fodmap.example/v0/me/tracking/symptoms/symptom-1",
    );
    expect(init.method).toBe("PATCH");
    expect(getJsonBody(init)).toEqual({
      symptom_type: "pain",
      severity: 2,
      noted_at_utc: "2026-03-21T08:00:00Z",
      note: "Mieux",
    });
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token_123",
    );
  });

  it("maps meal drafts into create requests and domain entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meal_log_id: "meal-1",
          title: "Déjeuner",
          occurred_at_utc: "2026-03-20T12:30:00Z",
          note: "Test digestif",
          version: 1,
          created_at_utc: "2026-03-20T12:30:00Z",
          updated_at_utc: "2026-03-20T12:30:00Z",
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
            {
              meal_log_item_id: "meal-item-2",
              sort_order: 2,
              item_kind: "custom_food",
              label: "Sauce maison",
              custom_food_id: "11111111-1111-4111-8111-111111111111",
              quantity_text: null,
              note: "Maison",
            },
            {
              meal_log_item_id: "meal-item-3",
              sort_order: 3,
              item_kind: "free_text",
              label: "Snack libre",
              quantity_text: "1 portion",
              note: null,
            },
          ],
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createMealEntry(
      apiConfig,
      {
        mode: "runtime",
        getToken: vi.fn().mockResolvedValue("token_123"),
      },
      {
        title: "Déjeuner",
        occurredAtUtc: "2026-03-20T12:30:00Z",
        note: "Test digestif",
        items: [
          {
            reference: {
              kind: "canonical_food",
              foodSlug: "phase2-ail-cru",
            },
            quantityText: "10 g",
            note: null,
          },
          {
            reference: {
              kind: "custom_food",
              customFoodId: "11111111-1111-4111-8111-111111111111",
            },
            quantityText: null,
            note: "Maison",
          },
          {
            reference: {
              kind: "free_text",
              label: "Snack libre",
            },
            quantityText: "1 portion",
            note: null,
          },
        ],
      },
    );

    expect(result).toMatchObject({
      kind: "meal_log",
      mealLogId: "meal-1",
      title: "Déjeuner",
      items: [
        {
          reference: {
            kind: "canonical_food",
            foodSlug: "phase2-ail-cru",
          },
        },
        {
          reference: {
            kind: "custom_food",
            customFoodId: "11111111-1111-4111-8111-111111111111",
          },
        },
        {
          reference: {
            kind: "free_text",
            label: "Snack libre",
          },
        },
      ],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.fodmap.example/v0/me/tracking/meals");
    expect(init.method).toBe("POST");
    expect(getJsonBody(init)).toEqual({
      title: "Déjeuner",
      occurred_at_utc: "2026-03-20T12:30:00Z",
      note: "Test digestif",
      items: [
        {
          item_kind: "canonical_food",
          food_slug: "phase2-ail-cru",
          quantity_text: "10 g",
          note: null,
        },
        {
          item_kind: "custom_food",
          custom_food_id: "11111111-1111-4111-8111-111111111111",
          quantity_text: null,
          note: "Maison",
        },
        {
          item_kind: "free_text",
          free_text_label: "Snack libre",
          quantity_text: "1 portion",
          note: null,
        },
      ],
    });
  });

  it("maps meal drafts into update requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meal_log_id: "meal-1",
          title: "Dîner",
          occurred_at_utc: "2026-03-20T19:00:00Z",
          note: null,
          version: 2,
          created_at_utc: "2026-03-20T12:30:00Z",
          updated_at_utc: "2026-03-20T19:00:00Z",
          items: [
            {
              meal_log_item_id: "meal-item-1",
              sort_order: 1,
              item_kind: "free_text",
              label: "Soupe",
              quantity_text: "1 bol",
              note: null,
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateMealEntry(
      apiConfig,
      {
        mode: "runtime",
        getToken: vi.fn().mockResolvedValue("token_123"),
      },
      "meal-1",
      {
        title: "Dîner",
        occurredAtUtc: "2026-03-20T19:00:00Z",
        note: null,
        items: [
          {
            reference: {
              kind: "free_text",
              label: "Soupe",
            },
            quantityText: "1 bol",
            note: null,
          },
        ],
      },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.fodmap.example/v0/me/tracking/meals/meal-1");
    expect(init.method).toBe("PATCH");
    expect(getJsonBody(init)).toEqual({
      title: "Dîner",
      occurred_at_utc: "2026-03-20T19:00:00Z",
      note: null,
      items: [
        {
          item_kind: "free_text",
          free_text_label: "Soupe",
          quantity_text: "1 bol",
          note: null,
        },
      ],
    });
  });

  it("maps custom food drafts into create requests and domain records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          custom_food_id: "custom-1",
          label: "Pain maison",
          note: "Recette perso pauvre en lactose",
          version: 1,
          created_at_utc: "2026-03-20T10:00:00Z",
          updated_at_utc: "2026-03-20T10:00:00Z",
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCustomFoodRecord(
      apiConfig,
      {
        mode: "runtime",
        getToken: vi.fn().mockResolvedValue("token_123"),
      },
      {
        label: "Pain maison",
        note: "Recette perso pauvre en lactose",
      },
    );

    expect(result).toMatchObject({
      kind: "custom_food",
      customFoodId: "custom-1",
      label: "Pain maison",
      note: "Recette perso pauvre en lactose",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.fodmap.example/v0/me/tracking/custom-foods");
    expect(init.method).toBe("POST");
    expect(getJsonBody(init)).toEqual({
      label: "Pain maison",
      note: "Recette perso pauvre en lactose",
    });
  });

  it("maps custom food drafts into update requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          custom_food_id: "custom-1",
          label: "Pain du soir",
          note: null,
          version: 2,
          created_at_utc: "2026-03-20T10:00:00Z",
          updated_at_utc: "2026-03-21T10:00:00Z",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateCustomFoodRecord(
      apiConfig,
      {
        mode: "runtime",
        getToken: vi.fn().mockResolvedValue("token_123"),
      },
      "custom-1",
      {
        label: "Pain du soir",
        note: null,
      },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.fodmap.example/v0/me/tracking/custom-foods/custom-1",
    );
    expect(init.method).toBe("PATCH");
    expect(getJsonBody(init)).toEqual({
      label: "Pain du soir",
      note: null,
    });
  });

  it("maps saved meal drafts into create requests and domain records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          saved_meal_id: "saved-meal-1",
          label: "Petit-déjeuner type",
          note: "À réutiliser les jours sensibles",
          version: 1,
          created_at_utc: "2026-03-20T08:00:00Z",
          updated_at_utc: "2026-03-20T08:00:00Z",
          items: [
            {
              saved_meal_item_id: "saved-item-1",
              sort_order: 1,
              item_kind: "canonical_food",
              label: "Pain blanc",
              food_slug: "phase2-pain-blanc",
              quantity_text: "2 tranches",
              note: null,
            },
            {
              saved_meal_item_id: "saved-item-2",
              sort_order: 2,
              item_kind: "custom_food",
              label: "Version maison",
              custom_food_id: "22222222-2222-4222-8222-222222222222",
              quantity_text: null,
              note: "Version maison",
            },
            {
              saved_meal_item_id: "saved-item-3",
              sort_order: 3,
              item_kind: "free_text",
              label: "Boisson chaude",
              quantity_text: "1 tasse",
              note: null,
            },
          ],
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSavedMealRecord(
      apiConfig,
      {
        mode: "runtime",
        getToken: vi.fn().mockResolvedValue("token_123"),
      },
      {
        label: "Petit-déjeuner type",
        note: "À réutiliser les jours sensibles",
        items: [
          {
            reference: {
              kind: "canonical_food",
              foodSlug: "phase2-pain-blanc",
            },
            quantityText: "2 tranches",
            note: null,
          },
          {
            reference: {
              kind: "custom_food",
              customFoodId: "22222222-2222-4222-8222-222222222222",
            },
            quantityText: null,
            note: "Version maison",
          },
          {
            reference: {
              kind: "free_text",
              label: "Boisson chaude",
            },
            quantityText: "1 tasse",
            note: null,
          },
        ],
      },
    );

    expect(result).toMatchObject({
      kind: "saved_meal",
      savedMealId: "saved-meal-1",
      label: "Petit-déjeuner type",
      items: [
        {
          reference: {
            kind: "canonical_food",
            foodSlug: "phase2-pain-blanc",
          },
        },
        {
          reference: {
            kind: "custom_food",
            customFoodId: "22222222-2222-4222-8222-222222222222",
          },
        },
        {
          reference: {
            kind: "free_text",
            label: "Boisson chaude",
          },
        },
      ],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.fodmap.example/v0/me/tracking/saved-meals");
    expect(init.method).toBe("POST");
    expect(getJsonBody(init)).toEqual({
      label: "Petit-déjeuner type",
      note: "À réutiliser les jours sensibles",
      items: [
        {
          item_kind: "canonical_food",
          food_slug: "phase2-pain-blanc",
          quantity_text: "2 tranches",
          note: null,
        },
        {
          item_kind: "custom_food",
          custom_food_id: "22222222-2222-4222-8222-222222222222",
          quantity_text: null,
          note: "Version maison",
        },
        {
          item_kind: "free_text",
          free_text_label: "Boisson chaude",
          quantity_text: "1 tasse",
          note: null,
        },
      ],
    });
  });

  it("maps saved meal drafts into update requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          saved_meal_id: "saved-meal-1",
          label: "Collation type",
          note: null,
          version: 2,
          created_at_utc: "2026-03-20T08:00:00Z",
          updated_at_utc: "2026-03-21T08:00:00Z",
          items: [
            {
              saved_meal_item_id: "saved-item-1",
              sort_order: 1,
              item_kind: "free_text",
              label: "Infusion",
              quantity_text: "1 tasse",
              note: null,
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateSavedMealRecord(
      apiConfig,
      {
        mode: "runtime",
        getToken: vi.fn().mockResolvedValue("token_123"),
      },
      "saved-meal-1",
      {
        label: "Collation type",
        note: null,
        items: [
          {
            reference: {
              kind: "free_text",
              label: "Infusion",
            },
            quantityText: "1 tasse",
            note: null,
          },
        ],
      },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.fodmap.example/v0/me/tracking/saved-meals/saved-meal-1",
    );
    expect(init.method).toBe("PATCH");
    expect(getJsonBody(init)).toEqual({
      label: "Collation type",
      note: null,
      items: [
        {
          item_kind: "free_text",
          free_text_label: "Infusion",
          quantity_text: "1 tasse",
          note: null,
        },
      ],
    });
  });

  it("maps symptom list responses into domain entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            symptom_log_id: "symptom-1",
            symptom_type: "bloating",
            severity: 3,
            noted_at_utc: "2026-03-21T09:00:00Z",
            note: "Après le déjeuner",
            version: 1,
            created_at_utc: "2026-03-21T09:00:00Z",
            updated_at_utc: "2026-03-21T09:05:00Z",
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSymptomEntries(apiConfig, createRuntimeAuth(), 25);

    expect(result).toMatchObject([
      {
        symptomLogId: "symptom-1",
        symptomType: "bloating",
        severity: 3,
        note: "Après le déjeuner",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/tracking/symptoms?limit=25",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
  });

  it("maps meal list responses into domain entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            meal_log_id: "meal-1",
            title: "Déjeuner",
            occurred_at_utc: "2026-03-21T12:00:00Z",
            note: null,
            version: 1,
            created_at_utc: "2026-03-21T12:00:00Z",
            updated_at_utc: "2026-03-21T12:10:00Z",
            items: [
              {
                meal_log_item_id: "meal-item-1",
                sort_order: 1,
                item_kind: "free_text",
                label: "Soupe",
                quantity_text: "1 bol",
                note: null,
              },
            ],
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await listMealEntries(apiConfig, createRuntimeAuth(), 10);

    expect(result).toMatchObject([
      {
        mealLogId: "meal-1",
        title: "Déjeuner",
        items: [
          {
            reference: {
              kind: "free_text",
              label: "Soupe",
            },
            quantityText: "1 bol",
          },
        ],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/tracking/meals?limit=10",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
  });

  it("maps custom food list responses into domain records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            custom_food_id: "custom-1",
            label: "Pain du soir",
            note: null,
            version: 3,
            created_at_utc: "2026-03-20T08:00:00Z",
            updated_at_utc: "2026-03-21T08:00:00Z",
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await listCustomFoodRecords(apiConfig, createRuntimeAuth());

    expect(result).toMatchObject([
      {
        kind: "custom_food",
        customFoodId: "custom-1",
        label: "Pain du soir",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/tracking/custom-foods",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
  });

  it("maps saved meal list responses into domain records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            saved_meal_id: "saved-meal-1",
            label: "Petit-déjeuner type",
            note: "À réutiliser",
            version: 1,
            created_at_utc: "2026-03-20T08:00:00Z",
            updated_at_utc: "2026-03-20T08:00:00Z",
            items: [
              {
                saved_meal_item_id: "saved-item-1",
                sort_order: 1,
                item_kind: "canonical_food",
                label: "Pain blanc",
                food_slug: "phase2-pain-blanc",
                quantity_text: "2 tranches",
                note: null,
              },
            ],
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSavedMealRecords(apiConfig, createRuntimeAuth());

    expect(result).toMatchObject([
      {
        kind: "saved_meal",
        savedMealId: "saved-meal-1",
        label: "Petit-déjeuner type",
        items: [
          {
            reference: {
              kind: "canonical_food",
              foodSlug: "phase2-pain-blanc",
            },
          },
        ],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/tracking/saved-meals",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
  });

  it("deletes symptom entries through the protected client seam", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteSymptomEntry(apiConfig, createRuntimeAuth(), "symptom-1"),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.fodmap.example/v0/me/tracking/symptoms/symptom-1",
    );
    expect(init.method).toBe("DELETE");
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token_123",
    );
  });

  it("deletes meal entries through the protected client seam", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteMealEntry(apiConfig, createRuntimeAuth(), "meal-1"),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.fodmap.example/v0/me/tracking/meals/meal-1");
    expect(init.method).toBe("DELETE");
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token_123",
    );
  });

  it("deletes custom food records through the protected client seam", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteCustomFoodRecord(apiConfig, createRuntimeAuth(), "custom-1"),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.fodmap.example/v0/me/tracking/custom-foods/custom-1",
    );
    expect(init.method).toBe("DELETE");
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token_123",
    );
  });

  it("deletes saved meal records through the protected client seam", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteSavedMealRecord(apiConfig, createRuntimeAuth(), "saved-meal-1"),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.fodmap.example/v0/me/tracking/saved-meals/saved-meal-1",
    );
    expect(init.method).toBe("DELETE");
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token_123",
    );
  });
});
