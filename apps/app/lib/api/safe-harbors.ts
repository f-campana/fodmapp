import type { operations } from "@fodmap/types";

import { type ApiResult, requestJson } from "./client";

export type SafeHarborResponse =
  operations["listSafeHarbors"]["responses"][200]["content"]["application/json"];

export async function getSafeHarbors(): Promise<ApiResult<SafeHarborResponse>> {
  return requestJson<SafeHarborResponse>("/safe-harbors");
}
