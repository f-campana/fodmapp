"use client";

export interface PreviewProtectedApiAuth {
  mode: "preview";
  userId: string;
}

export interface RuntimeProtectedApiAuth {
  mode: "runtime";
  getToken: () => Promise<string | null>;
}

export type ProtectedApiAuth =
  | PreviewProtectedApiAuth
  | RuntimeProtectedApiAuth;

export async function buildProtectedApiHeaders(
  auth: ProtectedApiAuth,
  headersInit?: HeadersInit,
  options: { json?: boolean } = {},
): Promise<Headers> {
  const headers = new Headers(headersInit ?? {});

  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth.mode === "preview") {
    headers.set("X-User-Id", auth.userId);
    return headers;
  }

  const token = await auth.getToken();
  if (!token) {
    throw new Error("protected-api error 0: session_token_unavailable");
  }

  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}
