import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  getCatalogFoodDetailPage,
  searchCatalogFoods,
} from "../src/data/catalogRepository.ts";

const originalFetch = globalThis.fetch;
const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  }

  if (originalApiBaseUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  }
});

void test("searchCatalogFoods returns api_not_configured when Expo API base is missing", async () => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;

  const result = await searchCatalogFoods("ail");

  assert.deepEqual(result, {
    ok: false,
    status: 0,
    error: "api_not_configured",
  });
});

void test("searchCatalogFoods maps shared-client search results into domain-backed items", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  const fetchCalls: Array<[unknown, unknown]> = [];
  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    fetchCalls.push([input, init]);

    return new Response(
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
    );
  }) as typeof fetch;

  const result = await searchCatalogFoods(" ail ");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.data.query, "ail");
  assert.equal(result.data.items[0]?.slug, "phase2-ail-cru");
  assert.equal(result.data.items[0]?.names.fr, "Ail cru");
  assert.equal(
    fetchCalls[0]?.[0],
    "https://api.fodmap.example/v0/foods?q=ail&limit=12",
  );
});

void test("getCatalogFoodDetailPage composes food detail and swaps through the shared client boundary", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  globalThis.fetch = (async (input: URL | RequestInfo) => {
    const url = String(input);

    if (url.endsWith("/v0/foods/phase2-ail-cru")) {
      return new Response(
        JSON.stringify({
          food_slug: "phase2-ail-cru",
          canonical_name_fr: "Ail cru",
          canonical_name_en: "Raw garlic",
          preparation_state: "raw",
          status: "active",
          source_slug: "phase3",
        }),
        { status: 200 },
      );
    }

    if (url.endsWith("/v0/foods/phase2-ail-cru/rollup")) {
      return new Response(
        JSON.stringify({
          food_slug: "phase2-ail-cru",
          canonical_name_fr: "Ail cru",
          canonical_name_en: "Raw garlic",
          rollup_serving_g: 12,
          overall_level: "high",
          driver_subtype: "fructan",
          known_subtypes_count: 4,
          coverage_ratio: 0.67,
          source_slug: "phase3",
          rollup_computed_at: "2026-03-20T10:00:00Z",
          scoring_version: "v2",
        }),
        { status: 200 },
      );
    }

    if (url.endsWith("/v0/swaps?from=phase2-ail-cru")) {
      return new Response(
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
              instruction_fr: "Utiliser l'huile a la place de l'ail.",
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
      );
    }

    throw new Error(`Unexpected URL: ${url}`);
  }) as typeof fetch;

  const result = await getCatalogFoodDetailPage("phase2-ail-cru");

  assert.equal(result.foodResult.ok, true);
  assert.equal(result.rollupResult.ok, true);
  assert.equal(result.swapsResult.ok, true);

  if (
    !result.foodResult.ok ||
    !result.rollupResult.ok ||
    !result.swapsResult.ok
  ) {
    return;
  }

  assert.equal(result.foodResult.data.slug, "phase2-ail-cru");
  assert.equal(result.foodResult.data.names.fr, "Ail cru");
  assert.equal(result.rollupResult.data.overallLevel, "high");
  assert.equal(result.swapsResult.data.items[0]?.to.slug, "phase2-huile-olive");
  assert.equal(
    result.swapsResult.data.items[0]?.instruction.fr,
    "Utiliser l'huile a la place de l'ail.",
  );
});
