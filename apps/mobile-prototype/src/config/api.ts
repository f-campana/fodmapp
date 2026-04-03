import type { ApiClientConfig } from "@fodmapp/api-client";

export function getPublicCatalogApiClientConfig(): ApiClientConfig {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  return {
    apiBaseUrl: apiBaseUrl ? apiBaseUrl : null,
  };
}
