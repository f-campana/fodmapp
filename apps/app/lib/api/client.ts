import {
  type ApiResult,
  requestJson as requestSharedJson,
} from "@fodmapp/api-client";

import { getPublicApiClientConfig } from "../apiClientConfig";

export type { ApiResult } from "@fodmapp/api-client";

export function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  return requestSharedJson<T>(getPublicApiClientConfig(), path, init);
}
