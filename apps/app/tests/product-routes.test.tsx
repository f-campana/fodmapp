import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import FoodDetailPage from "../app/aliments/[slug]/page";
import FoodsLoading from "../app/aliments/loading";
import AlimentsPage from "../app/aliments/page";
import DecouvrirLoading from "../app/decouvrir/loading";
import DecouvrirPage from "../app/decouvrir/page";
import HomePage from "../app/page";
import {
  getFoodDetail,
  getFoodRollup,
  getSafeHarbors,
  getSwaps,
  searchFoods,
} from "../lib/api";

vi.mock("../lib/api", () => ({
  getFoodDetail: vi.fn(),
  getFoodRollup: vi.fn(),
  getSafeHarbors: vi.fn(),
  getSwaps: vi.fn(),
  searchFoods: vi.fn(),
}));

const mockedGetSafeHarbors = vi.mocked(getSafeHarbors);
const mockedSearchFoods = vi.mocked(searchFoods);
const mockedGetFoodDetail = vi.mocked(getFoodDetail);
const mockedGetFoodRollup = vi.mocked(getFoodRollup);
const mockedGetSwaps = vi.mocked(getSwaps);

afterEach(() => {
  vi.clearAllMocks();
});

describe("product routes", () => {
  it("renders the safe-harbor page with a partial cohort set", async () => {
    mockedGetSafeHarbors.mockResolvedValue({
      ok: true,
      data: {
        cohorts: [
          {
            cohort_code: "cohort_oil_fat",
            label_fr: "Huiles et matières grasses",
            label_en: "Oils and fats",
            rationale_fr: "Bases simples pour cuisiner.",
            rationale_en: "Simple cooking bases.",
            caveat_fr: "Utiliser des versions simples et non aromatisées.",
            caveat_en: "Use plain, non-flavored versions.",
            items: [
              {
                food_slug: "phase2-huile-olive",
                canonical_name_fr: "Huile d'olive",
                canonical_name_en: "Olive oil",
              },
            ],
            total: 1,
          },
        ],
        meta: {
          total_cohorts: 1,
          total_foods: 1,
          cohort_rule_source_slug: "safe-harbor-v1",
          cohort_rule_version: "2026-03-13",
          data_source_slug: "ciqual",
          data_source_name: "CIQUAL",
          attribution: "Attribution CIQUAL",
          no_endorsement_notice: "Sans endorsement",
        },
      },
    });

    const html = renderToStaticMarkup(await DecouvrirPage());

    expect(html).toContain("Huiles et matières grasses");
    expect(html).toContain("Utiliser des versions simples et non aromatisées.");
    expect(html).toContain("Attribution CIQUAL");
    expect(html).toContain('href="/aliments/phase2-huile-olive"');
  });

  it("renders the safe-harbor empty state when no cohorts are returned", async () => {
    mockedGetSafeHarbors.mockResolvedValue({
      ok: true,
      data: {
        cohorts: [],
        meta: {
          total_cohorts: 0,
          total_foods: 0,
          cohort_rule_source_slug: "safe-harbor-v1",
          cohort_rule_version: "2026-03-13",
          data_source_slug: "ciqual",
          data_source_name: "CIQUAL",
          attribution: "Attribution CIQUAL",
          no_endorsement_notice: "Sans endorsement",
        },
      },
    });

    const html = renderToStaticMarkup(await DecouvrirPage());

    expect(html).toContain("Aucune base disponible pour le moment");
    expect(html).toContain('href="/aliments"');
  });

  it("treats missing safe-harbor meta as an error", async () => {
    mockedGetSafeHarbors.mockResolvedValue({
      ok: true,
      data: {
        cohorts: [],
        meta: {} as never,
      },
    });

    const html = renderToStaticMarkup(await DecouvrirPage());

    expect(html).toContain("Métadonnées indisponibles");
  });

  it("renders the safe-harbor loading route", () => {
    const html = renderToStaticMarkup(<DecouvrirLoading />);

    expect(html).toContain("Chargement des bases alimentaires");
  });

  it("renders search results for a URL-driven query", async () => {
    mockedSearchFoods.mockResolvedValue({
      ok: true,
      data: {
        query: "ail",
        limit: 12,
        total: 1,
        items: [
          {
            food_slug: "phase2-ail-cru",
            canonical_name_fr: "Ail cru",
            canonical_name_en: "Raw garlic",
            overall_level: "high",
          },
        ],
      },
    });

    const html = renderToStaticMarkup(
      await AlimentsPage({ searchParams: Promise.resolve({ q: "ail" }) }),
    );

    expect(html).toContain("1 résultat");
    expect(html).toContain("Ail cru");
    expect(html).toContain('href="/aliments/phase2-ail-cru"');
  });

  it("renders the no-match state when search returns zero results", async () => {
    mockedSearchFoods.mockResolvedValue({
      ok: true,
      data: {
        query: "tomate",
        limit: 12,
        total: 0,
        items: [],
      },
    });

    const html = renderToStaticMarkup(
      await AlimentsPage({ searchParams: Promise.resolve({ q: "tomate" }) }),
    );

    expect(html).toContain("Aucun aliment trouvé pour « tomate »");
    expect(html).toContain('href="/decouvrir"');
  });

  it("renders the aliments loading route", () => {
    const html = renderToStaticMarkup(<FoodsLoading />);

    expect(html).toContain("Chargement de la recherche");
  });

  it("renders the empty-swap CTA to /decouvrir", async () => {
    mockedGetFoodDetail.mockResolvedValue({
      ok: true,
      data: {
        food_slug: "phase2-ail-cru",
        canonical_name_fr: "Ail cru",
        canonical_name_en: "Raw garlic",
        preparation_state: "unknown",
        status: "draft",
      },
    });
    mockedGetFoodRollup.mockResolvedValue({
      ok: true,
      data: {
        food_slug: "phase2-ail-cru",
        canonical_name_fr: "Ail cru",
        canonical_name_en: "Raw garlic",
        overall_level: "high",
        known_subtypes_count: 6,
        coverage_ratio: 1,
        source_slug: "phase3",
        rollup_computed_at: "2026-03-16T10:00:00Z",
      },
    });
    mockedGetSwaps.mockResolvedValue({
      ok: true,
      data: {
        from_food_slug: "phase2-ail-cru",
        items: [],
        total: 0,
      },
    });

    const html = renderToStaticMarkup(
      await FoodDetailPage({
        params: Promise.resolve({ slug: "phase2-ail-cru" }),
      }),
    );

    expect(html).toContain("Pas de substitut documenté pour le moment");
    expect(html).toContain('href="/decouvrir"');
    expect(html).not.toContain("Préparation:");
    expect(html).not.toContain("Statut:");
    expect(html).not.toContain("unknown");
    expect(html).not.toContain("draft");
  });

  it("renders swaps while showing a rollup-unavailable state", async () => {
    mockedGetFoodDetail.mockResolvedValue({
      ok: true,
      data: {
        food_slug: "phase2-ail-cru",
        canonical_name_fr: "Ail cru",
        canonical_name_en: "Raw garlic",
      },
    });
    mockedGetFoodRollup.mockResolvedValue({
      ok: false,
      status: 500,
      error: "request_failed",
    });
    mockedGetSwaps.mockResolvedValue({
      ok: true,
      data: {
        from_food_slug: "phase2-ail-cru",
        total: 1,
        items: [
          {
            from_food_slug: "phase2-ail-cru",
            to_food_slug: "phase2-huile-olive",
            to_food_name_fr: "Huile d'olive",
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
            rollup_computed_at: "2026-03-16T10:00:00Z",
            from_food_name_fr: "Ail cru",
            from_food_name_en: "Raw garlic",
            to_food_name_en: "Olive oil",
          },
        ],
      },
    });

    const html = renderToStaticMarkup(
      await FoodDetailPage({
        params: Promise.resolve({ slug: "phase2-ail-cru" }),
      }),
    );

    expect(html).toContain("Données incomplètes");
    expect(html).toContain("Huile d&#x27;olive");
    expect(html).toContain("Données partielles");
  });

  it("calls notFound when the food detail endpoint returns 404", async () => {
    mockedGetFoodDetail.mockResolvedValue({
      ok: false,
      status: 404,
      error: "not_found",
    });
    mockedGetFoodRollup.mockResolvedValue({
      ok: false,
      status: 404,
      error: "not_found",
    });
    mockedGetSwaps.mockResolvedValue({
      ok: false,
      status: 404,
      error: "not_found",
    });

    await expect(
      FoodDetailPage({ params: Promise.resolve({ slug: "missing-food" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("keeps the home page links minimal but discoverable", async () => {
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain('href="/aliments"');
    expect(html).toContain('href="/decouvrir"');
    expect(html).toContain('href="/espace"');
  });
});
