import type { ApiClientConfig } from "@fodmapp/api-client";

import { getClientRuntimeEnv } from "./env.client";

export function getPublicApiClientConfig(): ApiClientConfig {
  return {
    apiBaseUrl: getClientRuntimeEnv().apiBaseUrl,
  };
}
