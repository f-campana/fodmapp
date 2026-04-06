import type { ApiClientConfig } from "@fodmapp/api-client";

function getExpoApiBaseUrl(): string | null {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  return apiBaseUrl ? apiBaseUrl : null;
}

export function getPublicCatalogApiClientConfig(): ApiClientConfig {
  return {
    apiBaseUrl: getExpoApiBaseUrl(),
  };
}

export function getProtectedApiClientConfig(): ApiClientConfig {
  return {
    apiBaseUrl: getExpoApiBaseUrl(),
  };
}
