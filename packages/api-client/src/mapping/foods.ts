import {
  type CuratedFood,
  type CuratedFoodProfile,
  type CuratedFoodSearchResult,
  mapFoodResponseToCuratedFood,
  mapFoodRollupToCuratedFoodProfile,
  mapFoodSearchResponseToCuratedFoodSearchResult,
} from "@fodmapp/domain";
import type { operations } from "@fodmapp/types";

import { type ApiResult, mapApiResult } from "../core/result";

type FoodSearchResponse =
  operations["searchFoods"]["responses"][200]["content"]["application/json"];
type FoodResponse =
  operations["getFoodBySlug"]["responses"][200]["content"]["application/json"];
type FoodRollupResponse =
  operations["getFoodRollupBySlug"]["responses"][200]["content"]["application/json"];

export function mapFoodSearchApiResult(
  result: ApiResult<FoodSearchResponse>,
): ApiResult<CuratedFoodSearchResult> {
  return mapApiResult(result, mapFoodSearchResponseToCuratedFoodSearchResult);
}

export function mapFoodRollupApiResult(
  result: ApiResult<FoodRollupResponse>,
): ApiResult<CuratedFoodProfile> {
  return mapApiResult(result, mapFoodRollupToCuratedFoodProfile);
}

export function mapFoodDetailApiResult(
  foodResult: ApiResult<FoodResponse>,
  rollupResult: ApiResult<FoodRollupResponse>,
): ApiResult<CuratedFood> {
  return mapApiResult(foodResult, (food) =>
    mapFoodResponseToCuratedFood(
      food,
      rollupResult.ok ? rollupResult.data : null,
    ),
  );
}
