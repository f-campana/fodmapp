import {
  type CuratedFood,
  type CuratedFoodProfile,
  type CuratedFoodSearchResult,
  type CuratedFoodSummary,
  type CuratedSwapList,
  mapFoodResponseToCuratedFood,
  mapFoodRollupToCuratedFoodProfile,
  mapFoodSearchResponseToCuratedFoodSearchResult,
  mapSwapListResponseToCuratedSwapList,
} from "@fodmapp/domain";
import type { operations } from "@fodmapp/types";

import { type ApiResult, requestJson } from "./client";

export type FoodSearchResponse =
  operations["searchFoods"]["responses"][200]["content"]["application/json"];
export type FoodDetailResponse =
  operations["getFoodBySlug"]["responses"][200]["content"]["application/json"];
export type FoodRollupResponse =
  operations["getFoodRollupBySlug"]["responses"][200]["content"]["application/json"];
export type SwapListResponse =
  operations["listSwaps"]["responses"][200]["content"]["application/json"];
export interface CuratedFoodDetailPageData {
  foodResult: ApiResult<CuratedFood>;
  rollupResult: ApiResult<CuratedFoodProfile>;
  swapsResult: ApiResult<CuratedSwapList>;
}
export interface TrackingCanonicalFoodOption {
  slug: string;
  label: string;
}
export interface TrackingCanonicalFoodSearchResult {
  query: string;
  limit: number;
  total: number;
  items: TrackingCanonicalFoodOption[];
}
export type {
  CuratedFood,
  CuratedFoodProfile,
  CuratedFoodSearchResult,
  CuratedFoodSummary,
  CuratedSwapList,
};

function mapApiResult<TInput, TOutput>(
  result: ApiResult<TInput>,
  mapper: (value: TInput) => TOutput,
): ApiResult<TOutput> {
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: mapper(result.data),
  };
}

export async function searchFoods(
  q: string,
  limit?: number,
): Promise<ApiResult<FoodSearchResponse>> {
  const params = new URLSearchParams();
  params.set("q", q);
  if (limit !== undefined) {
    params.set("limit", String(limit));
  }

  return requestJson<FoodSearchResponse>(`/foods?${params.toString()}`);
}

export async function searchCuratedFoods(
  q: string,
  limit?: number,
): Promise<ApiResult<CuratedFoodSearchResult>> {
  const result = await searchFoods(q, limit);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: mapFoodSearchResponseToCuratedFoodSearchResult(result.data),
  };
}

function mapCuratedFoodSummaryToTrackingCanonicalFoodOption(
  food: CuratedFoodSummary,
): TrackingCanonicalFoodOption {
  return {
    slug: food.slug,
    label: food.names.fr,
  };
}

export async function searchTrackingCanonicalFoods(
  q: string,
  limit = 5,
): Promise<ApiResult<TrackingCanonicalFoodSearchResult>> {
  const result = await searchCuratedFoods(q, limit);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: {
      query: result.data.query,
      limit: result.data.limit,
      total: result.data.total,
      items: result.data.items.map(
        mapCuratedFoodSummaryToTrackingCanonicalFoodOption,
      ),
    },
  };
}

export async function getFoodDetail(
  slug: string,
): Promise<ApiResult<FoodDetailResponse>> {
  return requestJson<FoodDetailResponse>(`/foods/${encodeURIComponent(slug)}`);
}

export async function getFoodRollup(
  slug: string,
): Promise<ApiResult<FoodRollupResponse>> {
  return requestJson<FoodRollupResponse>(
    `/foods/${encodeURIComponent(slug)}/rollup`,
  );
}

export async function getSwaps(
  fromSlug: string,
  options: { limit?: number; minSafetyScore?: number } = {},
): Promise<ApiResult<SwapListResponse>> {
  const params = new URLSearchParams();
  params.set("from", fromSlug);
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.minSafetyScore !== undefined) {
    params.set("min_safety_score", String(options.minSafetyScore));
  }

  return requestJson<SwapListResponse>(`/swaps?${params.toString()}`);
}

export async function getCuratedFoodDetailPageData(
  slug: string,
): Promise<CuratedFoodDetailPageData> {
  const [foodResult, rollupResult, swapsResult] = await Promise.all([
    getFoodDetail(slug),
    getFoodRollup(slug),
    getSwaps(slug),
  ]);

  return {
    foodResult: mapApiResult(foodResult, (food) =>
      mapFoodResponseToCuratedFood(
        food,
        rollupResult.ok ? rollupResult.data : null,
      ),
    ),
    rollupResult: mapApiResult(rollupResult, mapFoodRollupToCuratedFoodProfile),
    swapsResult: mapApiResult(
      swapsResult,
      mapSwapListResponseToCuratedSwapList,
    ),
  };
}
