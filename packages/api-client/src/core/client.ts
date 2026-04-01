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
