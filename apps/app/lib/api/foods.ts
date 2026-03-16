import type { operations } from "@fodmap/types";

import { type ApiResult, requestJson } from "./client";

export type FoodSearchResponse =
  operations["searchFoods"]["responses"][200]["content"]["application/json"];
export type FoodDetailResponse =
  operations["getFoodBySlug"]["responses"][200]["content"]["application/json"];
export type FoodRollupResponse =
  operations["getFoodRollupBySlug"]["responses"][200]["content"]["application/json"];
export type SwapListResponse =
  operations["listSwaps"]["responses"][200]["content"]["application/json"];

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
