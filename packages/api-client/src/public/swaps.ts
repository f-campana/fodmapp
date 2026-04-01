import type { CuratedSwapList } from "@fodmapp/domain";
import type { operations } from "@fodmapp/types";

import { requestJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import type { ApiResult } from "../core/result";
import { mapSwapListApiResult } from "../mapping/swaps";

type SwapListResponse =
  operations["listSwaps"]["responses"][200]["content"]["application/json"];

export interface CuratedSwapListOptions {
  limit?: number;
  minSafetyScore?: number;
}

async function getSwaps(
  config: ApiClientConfig,
  fromSlug: string,
  options: CuratedSwapListOptions = {},
): Promise<ApiResult<SwapListResponse>> {
  const params = new URLSearchParams();
  params.set("from", fromSlug);
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.minSafetyScore !== undefined) {
    params.set("min_safety_score", String(options.minSafetyScore));
  }

  return requestJson<SwapListResponse>(config, `/swaps?${params.toString()}`);
}

export async function listCuratedSwaps(
  config: ApiClientConfig,
  fromSlug: string,
  options: CuratedSwapListOptions = {},
): Promise<ApiResult<CuratedSwapList>> {
  const result = await getSwaps(config, fromSlug, options);
  return mapSwapListApiResult(result);
}
