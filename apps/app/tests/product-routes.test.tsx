import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCuratedFoodDetailPageData,
  searchCuratedFoods,
} from "@fodmapp/api-client";

import FoodDetailPage from "../app/aliments/[slug]/page";
import FoodsLoading from "../app/aliments/loading";
import AlimentsPage from "../app/aliments/page";
import DecouvrirLoading from "../app/decouvrir/loading";
import DecouvrirPage from "../app/decouvrir/page";
import HomePage from "../app/page";
import { getSafeHarbors } from "../lib/api";

vi.mock("@fodmapp/api-client", () => ({
  getCuratedFoodDetailPageData: vi.fn(),
  searchCuratedFoods: vi.fn(),
}));
vi.mock("../lib/api", () => ({
  getSafeHarbors: vi.fn(),
}));

const mockedGetCuratedFoodDetailPageData = vi.mocked(
  getCuratedFoodDetailPageData,
);
const mockedGetSafeHarbors = vi.mocked(getSafeHarbors);
const mockedSearchCuratedFoods = vi.mocked(searchCuratedFoods);

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
    expect(html).toContain(
      'href="/aliments/phase2-huile-olive?source=decouvrir"',
    );
    expect(html).toContain(
      "Les fiches liées peuvent encore afficher une analyse détaillée en attente.",
    );
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
    mockedSearchCuratedFoods.mockResolvedValue({
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
            driverSubtype: null,
            coverageRatio: null,
            rollupComputedAt: null,
            provenance: {
              kind: "curated_food_catalog",
              provider: "fodmapp",
              sourceSlug: null,
              capturedAt: null,
            },
            evidenceTier: "curated",
            capabilities: {
              canBeSwapOrigin: true,
              canBeSwapTarget: true,
              canAppearInTracking: true,
              canBeSavedMealItem: true,
              hasEvidenceBackedGuidance: true,
              isInformationalOnly: false,
            },
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
    mockedSearchCuratedFoods.mockResolvedValue({
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

  it("distinguishes foods whose public rollup is still pending", async () => {
    mockedSearchCuratedFoods.mockResolvedValue({
      ok: true,
      data: {
        query: "champignons",
        limit: 12,
        total: 1,
        items: [
          {
            kind: "curated_food",
            slug: "phase2-champignon-cru",
            names: {
              fr: "Champignon cru",
              en: "Raw mushroom",
            },
            overallLevel: null,
            driverSubtype: null,
            coverageRatio: null,
            rollupComputedAt: null,
            provenance: {
              kind: "curated_food_catalog",
              provider: "fodmapp",
              sourceSlug: null,
              capturedAt: null,
            },
            evidenceTier: "curated",
            capabilities: {
              canBeSwapOrigin: true,
              canBeSwapTarget: true,
              canAppearInTracking: true,
              canBeSavedMealItem: true,
              hasEvidenceBackedGuidance: true,
              isInformationalOnly: false,
            },
          },
        ],
      },
    });

    const html = renderToStaticMarkup(
      await AlimentsPage({
        searchParams: Promise.resolve({ q: "champignons" }),
      }),
    );

    expect(html).toContain("Analyse détaillée en attente");
    expect(html).toContain("son rollup public n’est pas encore calculé");
  });

  it("renders the aliments loading route", () => {
    const html = renderToStaticMarkup(<FoodsLoading />);

    expect(html).toContain("Chargement de la recherche");
  });

  it("renders the empty-swap CTA to /decouvrir", async () => {
    mockedGetCuratedFoodDetailPageData.mockResolvedValue({
      foodResult: {
        ok: true,
        data: {
          kind: "curated_food",
          slug: "phase2-ail-cru",
          names: {
            fr: "Ail cru",
            en: "Raw garlic",
          },
          preparationState: "unknown",
          status: "draft",
          sourceSlug: "phase3",
          profile: {
            rollupServingGrams: null,
            overallLevel: "high",
            driverSubtype: null,
            knownSubtypesCount: 6,
            coverageRatio: 1,
            sourceSlug: "phase3",
            rollupComputedAt: "2026-03-16T10:00:00Z",
            scoringVersion: null,
          },
          provenance: {
            kind: "curated_food_catalog",
            provider: "fodmapp",
            sourceSlug: "phase3",
            capturedAt: "2026-03-16T10:00:00Z",
          },
          evidenceTier: "curated",
          capabilities: {
            canBeSwapOrigin: true,
            canBeSwapTarget: true,
            canAppearInTracking: true,
            canBeSavedMealItem: true,
            hasEvidenceBackedGuidance: true,
            isInformationalOnly: false,
          },
        },
      },
      rollupResult: {
        ok: true,
        data: {
          rollupServingGrams: null,
          overallLevel: "high",
          driverSubtype: null,
          knownSubtypesCount: 6,
          coverageRatio: 1,
          sourceSlug: "phase3",
          rollupComputedAt: "2026-03-16T10:00:00Z",
          scoringVersion: null,
        },
      },
      swapsResult: {
        ok: true,
        data: {
          fromFoodSlug: "phase2-ail-cru",
          appliedFilters: null,
          items: [],
          total: 0,
        },
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
    mockedGetCuratedFoodDetailPageData.mockResolvedValue({
      foodResult: {
        ok: true,
        data: {
          kind: "curated_food",
          slug: "phase2-ail-cru",
          names: {
            fr: "Ail cru",
            en: "Raw garlic",
          },
          preparationState: null,
          status: null,
          sourceSlug: null,
          profile: null,
          provenance: {
            kind: "curated_food_catalog",
            provider: "fodmapp",
            sourceSlug: null,
            capturedAt: null,
          },
          evidenceTier: "curated",
          capabilities: {
            canBeSwapOrigin: true,
            canBeSwapTarget: true,
            canAppearInTracking: true,
            canBeSavedMealItem: true,
            hasEvidenceBackedGuidance: true,
            isInformationalOnly: false,
          },
        },
      },
      rollupResult: {
        ok: false,
        status: 500,
        error: "request_failed",
      },
      swapsResult: {
        ok: true,
        data: {
          fromFoodSlug: "phase2-ail-cru",
          appliedFilters: null,
          total: 1,
          items: [
            {
              kind: "curated_swap",
              id: "phase2-ail-cru->phase2-huile-olive",
              from: {
                slug: "phase2-ail-cru",
                names: {
                  fr: "Ail cru",
                  en: "Raw garlic",
                },
                overallLevel: "high",
              },
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
              driverSubtype: "fructan",
              fromBurdenRatio: 4.1,
              toBurdenRatio: 1.2,
              coverageRatio: 0.4,
              fodmapSafetyScore: 0.72,
              overallScore: 0.7,
              ruleStatus: "active",
              scoringVersion: "v2",
              rollupComputedAt: "2026-03-16T10:00:00Z",
              provenance: {
                kind: "curated_swap_rule",
                provider: "fodmapp",
                sourceSlug: null,
                capturedAt: "2026-03-16T10:00:00Z",
              },
              evidenceTier: "curated",
              capabilities: {
                canBeSwapOrigin: false,
                canBeSwapTarget: false,
                canAppearInTracking: false,
                canBeSavedMealItem: false,
                hasEvidenceBackedGuidance: true,
                isInformationalOnly: false,
              },
            },
          ],
        },
      },
    });

    const html = renderToStaticMarkup(
      await FoodDetailPage({
        params: Promise.resolve({ slug: "phase2-ail-cru" }),
      }),
    );

    expect(html).toContain("Analyse détaillée en attente");
    expect(html).toContain("Huile d&#x27;olive");
    expect(html).toContain("Données partielles");
  });

  it("keeps discover-linked detail fallback aligned with the safe-harbor promise", async () => {
    mockedGetCuratedFoodDetailPageData.mockResolvedValue({
      foodResult: {
        ok: true,
        data: {
          kind: "curated_food",
          slug: "phase2-huile-olive",
          names: {
            fr: "Huile d'olive",
            en: "Olive oil",
          },
          preparationState: null,
          status: null,
          sourceSlug: null,
          profile: null,
          provenance: {
            kind: "curated_food_catalog",
            provider: "fodmapp",
            sourceSlug: null,
            capturedAt: null,
          },
          evidenceTier: "curated",
          capabilities: {
            canBeSwapOrigin: true,
            canBeSwapTarget: true,
            canAppearInTracking: true,
            canBeSavedMealItem: true,
            hasEvidenceBackedGuidance: true,
            isInformationalOnly: false,
          },
        },
      },
      rollupResult: {
        ok: false,
        status: 500,
        error: "request_failed",
      },
      swapsResult: {
        ok: true,
        data: {
          fromFoodSlug: "phase2-huile-olive",
          appliedFilters: null,
          items: [],
          total: 0,
        },
      },
    });

    const html = renderToStaticMarkup(
      await FoodDetailPage({
        params: Promise.resolve({ slug: "phase2-huile-olive" }),
        searchParams: Promise.resolve({ source: "decouvrir" }),
      }),
    );

    expect(html).toContain("Base compatible simple");
    expect(html).toContain("Découvrir");
    expect(html).toContain(
      "La base compatible présentée dans Découvrir reste le repère principal",
    );
  });

  it("calls notFound when the food detail endpoint returns 404", async () => {
    mockedGetCuratedFoodDetailPageData.mockResolvedValue({
      foodResult: {
        ok: false,
        status: 404,
        error: "not_found",
      },
      rollupResult: {
        ok: false,
        status: 404,
        error: "not_found",
      },
      swapsResult: {
        ok: false,
        status: 404,
        error: "not_found",
      },
    });

    await expect(
      FoodDetailPage({ params: Promise.resolve({ slug: "missing-food" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("keeps the home page route navigation discoverable", async () => {
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain("Repères alimentaires et suivi personnel");
    expect(html).toContain("Rechercher un aliment");
    expect(html).toContain("Ouvrir mon espace");
    expect(html).not.toContain("fodmapp-api@v0");
    expect(html).toContain('href="/aliments"');
    expect(html).toContain('href="/decouvrir"');
    expect(html).toContain('href="/espace"');
  });
});
