import type { ApiClientConfig } from "@fodmapp/api-client";

import { getClientRuntimeEnv } from "./env.client";

function getRuntimeApiClientConfig(): ApiClientConfig {
  return {
    apiBaseUrl: getClientRuntimeEnv().apiBaseUrl,
  };
}

export function getPublicApiClientConfig(): ApiClientConfig {
  return getRuntimeApiClientConfig();
}

export function getProtectedApiClientConfig(): ApiClientConfig {
  return getRuntimeApiClientConfig();
}
