const API_VERSION_PREFIX = "/v0";

export interface ApiClientConfig {
  apiBaseUrl: string | null;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveApiBase(apiBase: string | null): string | null {
  if (!apiBase) {
    return null;
  }

  const normalized = trimTrailingSlash(apiBase);
  return normalized.endsWith(API_VERSION_PREFIX)
    ? normalized
    : `${normalized}${API_VERSION_PREFIX}`;
}

export function buildApiUrl(
  path: string,
  apiBase: string | null,
): string | null {
  const base = resolveApiBase(apiBase);
  if (!base) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//i.test(base)) {
    return `${base}${normalizedPath}`;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return `${window.location.protocol}//${window.location.host}${base}${normalizedPath}`;
}
