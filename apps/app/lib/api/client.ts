import type { operations } from "@fodmap/types";

import { buildApiUrl } from "./base";

type ErrorResponse =
  operations["getFoodBySlug"]["responses"][404]["content"]["application/json"];

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function parseError(
  response: Response,
  fallbackError: string,
): Promise<{ status: number; error: string }> {
  const body = await response.json().catch(() => null);
  const error =
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ErrorResponse).error?.code === "string"
      ? (body as ErrorResponse).error.code
      : fallbackError;

  return {
    status: response.status,
    error,
  };
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const url = buildApiUrl(path);
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
        ...(await parseError(response, "request_failed")),
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
