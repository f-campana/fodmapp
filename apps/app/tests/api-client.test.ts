import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCuratedFoodDetailPageData,
  getFoodDetail,
  getFoodRollup,
  getSafeHarbors,
  getSwaps,
  searchCuratedFoods,
  searchFoods,
  searchTrackingCanonicalFoods,
} from "../lib/api";
import type { ProtectedApiAuth } from "../lib/protectedApiAuth";
import {
  buildMealLogCreateRequestFromDraft,
  buildMealLogUpdateRequestFromDraft,
  buildSavedMealLogCreateRequestFromDraft,
  buildSavedMealLogUpdateRequestFromDraft,
  buildSymptomLogCreateRequestFromDraft,
  buildSymptomLogUpdateRequestFromDraft,
  createTrackingSymptom,
  deleteTrackingMeal,
  getTrackingFeed,
  getTrackingHubReadModel,
} from "../lib/tracking";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("public read client", () => {
  it("builds the search URL under /v0 and omits auth headers", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          query: "ail",
          limit: 12,
          items: [],
          total: 0,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchFoods("ail", 12);

    expect(result).toEqual({
      ok: true,
      data: {
        query: "ail",
        limit: 12,
        items: [],
        total: 0,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/foods?q=ail&limit=12",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).has("X-User-Id")).toBe(false);
  });

  it("maps raw food search responses into domain search results", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            query: "ail",
            limit: 12,
            total: 1,
            items: [
              {
                food_slug: "phase2-ail-cru",
                canonical_name_fr: "Ail cru",
                canonical_name_en: "Raw garlic",
                overall_level: "high",
                driver_subtype: "fructan",
                coverage_ratio: 1,
                rollup_computed_at: "2026-03-20T10:00:00Z",
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await searchCuratedFoods("ail", 12);

    expect(result).toMatchObject({
      ok: true,
      data: {
        query: "ail",
        limit: 12,
        total: 1,
        items: [
          {
            kind: "curated_food",
            slug: "phase2-ail-cru",
            names: {
              fr: "Ail cru",
              en: "Raw garlic",
            },
            overallLevel: "high",
            driverSubtype: "fructan",
            coverageRatio: 1,
            rollupComputedAt: "2026-03-20T10:00:00Z",
            evidenceTier: "curated",
          },
        ],
      },
    });
  });

  it("maps curated food search results into tracking canonical options", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            query: "ail",
            limit: 5,
            total: 1,
            items: [
              {
                food_slug: "phase2-ail-cru",
                canonical_name_fr: "Ail cru",
                canonical_name_en: "Raw garlic",
                overall_level: "high",
                driver_subtype: "fructan",
                coverage_ratio: 1,
                rollup_computed_at: "2026-03-20T10:00:00Z",
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await searchTrackingCanonicalFoods("ail");

    expect(result).toEqual({
      ok: true,
      data: {
        query: "ail",
        limit: 5,
        total: 1,
        items: [
          {
            slug: "phase2-ail-cru",
            label: "Ail cru",
          },
        ],
      },
    });
  });

  it("maps food detail route responses into domain-shaped results", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            food_slug: "phase2-ail-cru",
            canonical_name_fr: "Ail cru",
            canonical_name_en: "Raw garlic",
            preparation_state: "raw",
            status: "active",
            source_slug: "phase3",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            food_slug: "phase2-ail-cru",
            canonical_name_fr: "Ail cru",
            canonical_name_en: "Raw garlic",
            rollup_serving_g: 75,
            overall_level: "high",
            driver_subtype: "fructan",
            known_subtypes_count: 6,
            coverage_ratio: 1,
            source_slug: "phase3",
            rollup_computed_at: "2026-03-20T10:00:00Z",
            scoring_version: "v2",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            from_food_slug: "phase2-ail-cru",
            total: 1,
            items: [
              {
                from_food_slug: "phase2-ail-cru",
                to_food_slug: "phase2-huile-olive",
                from_food_name_fr: "Ail cru",
                from_food_name_en: "Raw garlic",
                to_food_name_fr: "Huile d'olive",
                to_food_name_en: "Olive oil",
                instruction_fr: "Utiliser l'huile à la place de l'ail.",
                instruction_en: "Use oil instead of garlic.",
                from_overall_level: "high",
                to_overall_level: "low",
                driver_subtype: "fructan",
                from_burden_ratio: 4.1,
                to_burden_ratio: 1.2,
                coverage_ratio: 0.4,
                fodmap_safety_score: 0.72,
                overall_score: 0.7,
                rule_status: "active",
                scoring_version: "v2",
                source_slug: "phase3",
                rollup_computed_at: "2026-03-20T10:00:00Z",
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getCuratedFoodDetailPageData("phase2-ail-cru");

    expect(result).toMatchObject({
      foodResult: {
        ok: true,
        data: {
          kind: "curated_food",
          slug: "phase2-ail-cru",
          names: {
            fr: "Ail cru",
            en: "Raw garlic",
          },
          preparationState: "raw",
          status: "active",
          sourceSlug: "phase3",
          profile: {
            rollupServingGrams: 75,
            overallLevel: "high",
            driverSubtype: "fructan",
            knownSubtypesCount: 6,
            coverageRatio: 1,
            sourceSlug: "phase3",
            rollupComputedAt: "2026-03-20T10:00:00Z",
            scoringVersion: "v2",
          },
        },
      },
      rollupResult: {
        ok: true,
        data: {
          overallLevel: "high",
          driverSubtype: "fructan",
          knownSubtypesCount: 6,
          coverageRatio: 1,
        },
      },
      swapsResult: {
        ok: true,
        data: {
          fromFoodSlug: "phase2-ail-cru",
          total: 1,
          items: [
            {
              kind: "curated_swap",
              to: {
                slug: "phase2-huile-olive",
                names: {
                  fr: "Huile d'olive",
                  en: "Olive oil",
                },
                overallLevel: "low",
              },
              instruction: {
                fr: "Utiliser l'huile à la place de l'ail.",
                en: "Use oil instead of garlic.",
              },
              fodmapSafetyScore: 0.72,
            },
          ],
        },
      },
    });
  });

  it("keeps food detail normalized when the rollup request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              food_slug: "phase2-ail-cru",
              canonical_name_fr: "Ail cru",
              canonical_name_en: "Raw garlic",
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: {
                code: "request_failed",
                message: "rollup unavailable",
              },
            }),
            { status: 500 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              from_food_slug: "phase2-ail-cru",
              total: 0,
              items: [],
            }),
            { status: 200 },
          ),
        ),
    );

    const result = await getCuratedFoodDetailPageData("phase2-ail-cru");

    expect(result.foodResult).toMatchObject({
      ok: true,
      data: {
        slug: "phase2-ail-cru",
        profile: null,
      },
    });
    expect(result.rollupResult).toEqual({
      ok: false,
      status: 500,
      error: "request_failed",
    });
    expect(result.swapsResult).toMatchObject({
      ok: true,
      data: {
        total: 0,
      },
    });
  });

  it("returns api_not_configured when the API base URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    const result = await getSafeHarbors();

    expect(result).toEqual({
      ok: false,
      status: 0,
      error: "api_not_configured",
    });
  });

  it("maps 404 errors to not_found", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "not_found",
              message: "Food not found",
            },
          }),
          { status: 404 },
        ),
      ),
    );

    const result = await getFoodDetail("missing-food");

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "not_found",
    });
  });

  it("returns invalid_json when a successful response body cannot be parsed", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
      }),
    );

    const result = await getFoodRollup("phase2-ail-cru");

    expect(result).toEqual({
      ok: false,
      status: 200,
      error: "invalid_json",
    });
  });

  it("maps network failures to request_failed", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await getSwaps("phase2-ail-cru");

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "request_failed",
    });
  });
});

describe("tracking client", () => {
  it("builds meal transport payloads from a domain draft", () => {
    const draft = {
      title: "Déjeuner",
      occurredAtUtc: "2026-03-20T12:30:00Z",
      note: "Test digestif",
      items: [
        {
          reference: {
            kind: "canonical_food" as const,
            foodSlug: "phase2-ail-cru",
          },
          quantityText: "10 g",
          note: null,
        },
        {
          reference: {
            kind: "custom_food" as const,
            customFoodId: "11111111-1111-4111-8111-111111111111",
          },
          quantityText: null,
          note: "Maison",
        },
        {
          reference: {
            kind: "free_text" as const,
            label: "Snack libre",
          },
          quantityText: "1 portion",
          note: null,
        },
      ],
    };

    expect(buildMealLogCreateRequestFromDraft(draft)).toEqual({
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
    expect(buildMealLogUpdateRequestFromDraft(draft)).toEqual({
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

  it("builds saved meal transport payloads from a domain draft", () => {
    const draft = {
      label: "Petit-déjeuner type",
      note: "À réutiliser les jours sensibles",
      items: [
        {
          reference: {
            kind: "canonical_food" as const,
            foodSlug: "phase2-pain-blanc",
          },
          quantityText: "2 tranches",
          note: null,
        },
        {
          reference: {
            kind: "custom_food" as const,
            customFoodId: "22222222-2222-4222-8222-222222222222",
          },
          quantityText: null,
          note: "Version maison",
        },
        {
          reference: {
            kind: "free_text" as const,
            label: "Boisson chaude",
          },
          quantityText: "1 tasse",
          note: null,
        },
      ],
    };

    expect(buildSavedMealLogCreateRequestFromDraft(draft)).toEqual({
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
    expect(buildSavedMealLogUpdateRequestFromDraft(draft)).toEqual({
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

  it("builds symptom transport payloads from a domain draft", () => {
    const draft = {
      symptomType: "bloating" as const,
      severity: 4,
      notedAtUtc: "2026-03-20T10:00:00Z",
      note: "Après déjeuner",
    };

    expect(buildSymptomLogCreateRequestFromDraft(draft)).toEqual({
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: "Après déjeuner",
    });
    expect(buildSymptomLogUpdateRequestFromDraft(draft)).toEqual({
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: "Après déjeuner",
    });
  });

  it("sends Authorization bearer headers on runtime feed requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
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

    const result = await getTrackingFeed(auth, 50);

    expect(result).toEqual({
      total: 0,
      limit: 50,
      items: [],
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
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
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

    const result = await getTrackingHubReadModel(auth, {
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
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
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

    const result = await getTrackingHubReadModel(auth, {
      anchorDate: "2026-03-22",
      feedLimit: 25,
    });

    expect(result.feed.items).toHaveLength(1);
    expect(result.feed.items[0]?.entryType).toBe("symptom");
    expect(result.feed.total).toBe(2);
  });

  it("keeps preview mode on X-User-Id for local validation", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
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
    const auth: ProtectedApiAuth = {
      mode: "preview",
      userId: "11111111-1111-4111-8111-111111111111",
    };

    const result = await createTrackingSymptom(auth, {
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: null,
    });

    expect(result.symptom_type).toBe("bloating");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect((init.headers as Headers).get("X-User-Id")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("fails fast when a runtime session token is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue(null),
    };

    await expect(getTrackingFeed(auth, 50)).rejects.toThrow(
      "session_token_unavailable",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns undefined on 204 delete responses", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    const result = await deleteTrackingMeal(auth, "meal-1");

    expect(result).toBeUndefined();
  });
});
