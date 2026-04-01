import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildProtectedApiHeaders,
  getCuratedFoodDetailPageData,
  listCuratedSwaps,
  requestJson,
  searchCuratedFoods,
} from "../src";

const apiConfig = {
  apiBaseUrl: "https://api.fodmap.example",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("@fodmapp/api-client core", () => {
  it("builds public URLs under /v0 and omits auth headers", async () => {
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

    const result = await requestJson<{
      query: string;
      limit: number;
      items: [];
      total: number;
    }>(apiConfig, "/foods?q=ail&limit=12");

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

  it("returns api_not_configured when no base URL is available", async () => {
    const result = await requestJson({ apiBaseUrl: null }, "/foods?q=ail");

    expect(result).toEqual({
      ok: false,
      status: 0,
      error: "api_not_configured",
    });
  });

  it("maps error payloads and invalid JSON failures into ApiResult errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: {
                code: "not_found",
                message: "Food not found",
              },
            }),
            { status: 404 },
          ),
        )
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockRejectedValue(new Error("invalid json")),
        }),
    );

    const notFoundResult = await requestJson(apiConfig, "/foods/missing-food");
    const invalidJsonResult = await requestJson(
      apiConfig,
      "/foods/phase2-ail-cru/rollup",
    );

    expect(notFoundResult).toEqual({
      ok: false,
      status: 404,
      error: "not_found",
    });
    expect(invalidJsonResult).toEqual({
      ok: false,
      status: 200,
      error: "invalid_json",
    });
  });

  it("keeps the protected auth seam provider-agnostic", async () => {
    expect(
      await buildProtectedApiHeaders(
        { mode: "preview", userId: "user-preview" },
        undefined,
        { json: true },
      ),
    ).toEqual(
      new Headers({
        "Content-Type": "application/json",
        "X-User-Id": "user-preview",
      }),
    );

    expect(
      await buildProtectedApiHeaders(
        {
          mode: "runtime",
          getToken: vi.fn().mockResolvedValue("token-123"),
        },
        undefined,
        { json: true },
      ),
    ).toEqual(
      new Headers({
        Authorization: "Bearer token-123",
        "Content-Type": "application/json",
      }),
    );
  });
});

describe("@fodmapp/api-client public catalog reads", () => {
  it("maps food search responses into domain-backed search results", async () => {
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

    const result = await searchCuratedFoods(apiConfig, "ail", 12);

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

  it("maps swaps into domain-backed results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            from_food_slug: "phase2-ail-cru",
            total: 1,
            applied_filters: {
              limit: 5,
              min_safety_score: 0.5,
            },
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
      ),
    );

    const result = await listCuratedSwaps(apiConfig, "phase2-ail-cru", {
      limit: 5,
      minSafetyScore: 0.5,
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        fromFoodSlug: "phase2-ail-cru",
        total: 1,
        appliedFilters: {
          limit: 5,
          minSafetyScore: 0.5,
        },
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
    });
  });

  it("composes the curated food detail page data without widening transport shapes", async () => {
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
        ),
    );

    const result = await getCuratedFoodDetailPageData(
      apiConfig,
      "phase2-ail-cru",
    );

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
              },
              fodmapSafetyScore: 0.72,
            },
          ],
        },
      },
    });
  });

  it("keeps the curated food detail normalized when rollup fails", async () => {
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

    const result = await getCuratedFoodDetailPageData(
      apiConfig,
      "phase2-ail-cru",
    );

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
});
