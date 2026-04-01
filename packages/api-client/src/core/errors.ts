import type { operations } from "@fodmapp/types";

type ErrorResponse =
  operations["getFoodBySlug"]["responses"][404]["content"]["application/json"];

export async function parseErrorResponse(
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
