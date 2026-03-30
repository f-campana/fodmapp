import type { components, operations } from "@fodmapp/types";

import type {
  CuratedFood,
  CuratedFoodProfile,
  CuratedFoodReference,
  CuratedFoodSearchResult,
  CuratedFoodSummary,
} from "../catalog/foods";
import type { CuratedSwap, CuratedSwapList } from "../catalog/swaps";
import {
  getCuratedFoodCapabilities,
  getCuratedFoodProvenance,
  getCuratedSwapCapabilities,
  getCuratedSwapProvenance,
} from "../policies/capabilities";

type FoodSearchResponse =
  operations["searchFoods"]["responses"][200]["content"]["application/json"];
type FoodResponse =
  operations["getFoodBySlug"]["responses"][200]["content"]["application/json"];
type FoodRollupResponse =
  operations["getFoodRollupBySlug"]["responses"][200]["content"]["application/json"];
type FoodSearchItem = components["schemas"]["FoodSearchItem"];
type SwapItem = components["schemas"]["SwapItem"];
type SwapListResponse =
  operations["listSwaps"]["responses"][200]["content"]["application/json"];

export function mapFoodSearchItemToCuratedFoodSummary(
  item: FoodSearchItem,
): CuratedFoodSummary {
  return {
    kind: "curated_food",
    slug: item.food_slug,
    names: {
      fr: item.canonical_name_fr,
      en: item.canonical_name_en,
    },
    overallLevel: item.overall_level ?? null,
    driverSubtype: item.driver_subtype ?? null,
    coverageRatio: item.coverage_ratio ?? null,
    rollupComputedAt: item.rollup_computed_at ?? null,
    provenance: getCuratedFoodProvenance(null, item.rollup_computed_at ?? null),
    evidenceTier: "curated",
    capabilities: getCuratedFoodCapabilities(),
  };
}

export function mapFoodRollupToCuratedFoodProfile(
  rollup: FoodRollupResponse,
): CuratedFoodProfile {
  return {
    rollupServingGrams: rollup.rollup_serving_g ?? null,
    overallLevel: rollup.overall_level,
    driverSubtype: rollup.driver_subtype ?? null,
    knownSubtypesCount: rollup.known_subtypes_count,
    coverageRatio: rollup.coverage_ratio,
    sourceSlug: rollup.source_slug,
    rollupComputedAt: rollup.rollup_computed_at,
    scoringVersion: rollup.scoring_version ?? null,
  };
}

export function mapFoodResponseToCuratedFood(
  food: FoodResponse,
  rollup?: FoodRollupResponse | null,
): CuratedFood {
  const resolvedSourceSlug = food.source_slug ?? rollup?.source_slug ?? null;
  const resolvedCapturedAt = rollup?.rollup_computed_at ?? null;

  return {
    kind: "curated_food",
    slug: food.food_slug,
    names: {
      fr: food.canonical_name_fr,
      en: food.canonical_name_en,
    },
    preparationState: food.preparation_state ?? null,
    status: food.status ?? null,
    sourceSlug: resolvedSourceSlug,
    profile: rollup ? mapFoodRollupToCuratedFoodProfile(rollup) : null,
    provenance: getCuratedFoodProvenance(
      resolvedSourceSlug,
      resolvedCapturedAt,
    ),
    evidenceTier: "curated",
    capabilities: getCuratedFoodCapabilities(),
  };
}

export function mapFoodSearchResponseToCuratedFoodSearchResult(
  response: FoodSearchResponse,
): CuratedFoodSearchResult {
  return {
    query: response.query,
    limit: response.limit,
    total: response.total,
    items: response.items.map(mapFoodSearchItemToCuratedFoodSummary),
  };
}

function mapSwapFoodReference(
  slug: string,
  nameFr?: string | null,
  nameEn?: string | null,
  overallLevel?: CuratedFoodReference["overallLevel"],
): CuratedFoodReference {
  return {
    slug,
    names: {
      fr: nameFr ?? null,
      en: nameEn ?? null,
    },
    overallLevel: overallLevel ?? null,
  };
}

export function mapSwapItemToCuratedSwap(item: SwapItem): CuratedSwap {
  return {
    kind: "curated_swap",
    id: `${item.from_food_slug}->${item.to_food_slug}`,
    from: mapSwapFoodReference(
      item.from_food_slug,
      item.from_food_name_fr ?? null,
      item.from_food_name_en ?? null,
      item.from_overall_level,
    ),
    to: mapSwapFoodReference(
      item.to_food_slug,
      item.to_food_name_fr ?? null,
      item.to_food_name_en ?? null,
      item.to_overall_level,
    ),
    instruction: {
      fr: item.instruction_fr,
      en: item.instruction_en,
    },
    driverSubtype: item.driver_subtype ?? null,
    fromBurdenRatio: item.from_burden_ratio ?? null,
    toBurdenRatio: item.to_burden_ratio ?? null,
    coverageRatio: item.coverage_ratio,
    fodmapSafetyScore: item.fodmap_safety_score,
    overallScore: item.overall_score,
    ruleStatus: item.rule_status,
    scoringVersion: item.scoring_version,
    rollupComputedAt: item.rollup_computed_at,
    provenance: getCuratedSwapProvenance(
      item.source_slug ?? null,
      item.rollup_computed_at,
    ),
    evidenceTier: "curated",
    capabilities: getCuratedSwapCapabilities(),
  };
}

export function mapSwapListResponseToCuratedSwapList(
  response: SwapListResponse,
): CuratedSwapList {
  return {
    fromFoodSlug: response.from_food_slug,
    total: response.total,
    appliedFilters: response.applied_filters
      ? {
          limit: response.applied_filters.limit,
          minSafetyScore: response.applied_filters.min_safety_score,
        }
      : null,
    items: response.items.map(mapSwapItemToCuratedSwap),
  };
}
