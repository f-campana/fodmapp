import type {
  CuratedFood,
  CuratedFoodProfile,
  CuratedFoodSearchResult,
  CuratedSwapList,
} from "@fodmapp/domain";
import type { operations } from "@fodmapp/types";

import { requestJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import type { ApiResult } from "../core/result";
import {
  mapFoodDetailApiResult,
  mapFoodRollupApiResult,
  mapFoodSearchApiResult,
} from "../mapping/foods";
import { listCuratedSwaps } from "./swaps";

type FoodSearchResponse =
  operations["searchFoods"]["responses"][200]["content"]["application/json"];
type FoodResponse =
  operations["getFoodBySlug"]["responses"][200]["content"]["application/json"];
type FoodRollupResponse =
  operations["getFoodRollupBySlug"]["responses"][200]["content"]["application/json"];

export interface CuratedFoodDetailPageData {
  foodResult: ApiResult<CuratedFood>;
  rollupResult: ApiResult<CuratedFoodProfile>;
  swapsResult: ApiResult<CuratedSwapList>;
}

async function searchFoods(
  config: ApiClientConfig,
  q: string,
  limit?: number,
): Promise<ApiResult<FoodSearchResponse>> {
  const params = new URLSearchParams();
  params.set("q", q);
  if (limit !== undefined) {
    params.set("limit", String(limit));
  }

  return requestJson<FoodSearchResponse>(config, `/foods?${params.toString()}`);
}

async function getFoodDetail(
  config: ApiClientConfig,
  slug: string,
): Promise<ApiResult<FoodResponse>> {
  return requestJson<FoodResponse>(
    config,
    `/foods/${encodeURIComponent(slug)}`,
  );
}

async function getFoodRollup(
  config: ApiClientConfig,
  slug: string,
): Promise<ApiResult<FoodRollupResponse>> {
  return requestJson<FoodRollupResponse>(
    config,
    `/foods/${encodeURIComponent(slug)}/rollup`,
  );
}

export async function searchCuratedFoods(
  config: ApiClientConfig,
  q: string,
  limit?: number,
): Promise<ApiResult<CuratedFoodSearchResult>> {
  const result = await searchFoods(config, q, limit);
  return mapFoodSearchApiResult(result);
}

export async function getCuratedFoodDetailPageData(
  config: ApiClientConfig,
  slug: string,
): Promise<CuratedFoodDetailPageData> {
  const [foodResult, rollupResult, swapsResult] = await Promise.all([
    getFoodDetail(config, slug),
    getFoodRollup(config, slug),
    listCuratedSwaps(config, slug),
  ]);

  return {
    foodResult: mapFoodDetailApiResult(foodResult, rollupResult),
    rollupResult: mapFoodRollupApiResult(rollupResult),
    swapsResult,
  };
}
