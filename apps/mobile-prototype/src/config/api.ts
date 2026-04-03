import type { ApiClientConfig } from "@fodmapp/api-client";

function readExpoPublicEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getPublicCatalogApiClientConfig(): ApiClientConfig {
  return {
    apiBaseUrl: readExpoPublicEnv("EXPO_PUBLIC_API_BASE_URL"),
  };
}
