import {
  type CuratedSwapList,
  mapSwapListResponseToCuratedSwapList,
} from "@fodmapp/domain";
import type { operations } from "@fodmapp/types";

import { type ApiResult, mapApiResult } from "../core/result";

type SwapListResponse =
  operations["listSwaps"]["responses"][200]["content"]["application/json"];

export function mapSwapListApiResult(
  result: ApiResult<SwapListResponse>,
): ApiResult<CuratedSwapList> {
  return mapApiResult(result, mapSwapListResponseToCuratedSwapList);
}
