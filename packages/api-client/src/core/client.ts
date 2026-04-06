import { buildProtectedApiHeaders, type ProtectedApiAuthInput } from "./auth";
import { type ApiClientConfig, buildApiUrl } from "./config";
import { parseErrorResponse } from "./errors";
import type { ApiResult } from "./result";

export async function requestJson<T>(
  config: ApiClientConfig,
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const url = buildApiUrl(path, config.apiBaseUrl);
  if (!url) {
    return {
      ok: false,
      status: 0,
      error: "api_not_configured",
    };
  }

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: new Headers(init.headers ?? {}),
    });

    if (!response.ok) {
      return {
        ok: false,
        ...(await parseErrorResponse(response, "request_failed")),
      };
    }

    const data = (await response.json().catch(() => null)) as T | null;
    if (data === null) {
      return {
        ok: false,
        status: response.status,
        error: "invalid_json",
      };
    }

    return {
      ok: true,
      data,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      error: "request_failed",
    };
  }
}

export async function requestProtectedJson<T>(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  path: string,
  init: RequestInit = {},
  options: { errorPrefix?: string } = {},
): Promise<T> {
  const errorPrefix = options.errorPrefix ?? "protected-api";
  const headers = await buildProtectedApiHeaders(auth, init.headers, {
    json: Boolean(init.body),
  });

  const url = buildApiUrl(path, config.apiBaseUrl);
  if (!url) {
    throw new Error(`${errorPrefix} error 0: api_not_configured`);
  }

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body && "error" in body
        ? JSON.stringify(body)
        : await response.text().catch(() => "");
    throw new Error(`${errorPrefix} error ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
