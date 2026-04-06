export interface PreviewProtectedApiAuth {
  mode: "preview";
  userId: string;
}

export interface RuntimeProtectedApiAuth {
  mode: "runtime";
  getToken: () => Promise<string | null>;
}

export interface BearerProtectedApiAuth {
  mode: "bearer";
  token: string;
}

export type ProtectedApiAuth =
  | PreviewProtectedApiAuth
  | RuntimeProtectedApiAuth
  | BearerProtectedApiAuth;

export type ProtectedApiAuthInput =
  | ProtectedApiAuth
  | RuntimeProtectedApiAuth["getToken"]
  | string;

export function normalizeProtectedApiAuth(
  auth: ProtectedApiAuthInput,
): ProtectedApiAuth {
  if (typeof auth === "function") {
    return {
      mode: "runtime",
      getToken: auth,
    };
  }

  if (typeof auth === "string") {
    return {
      mode: "bearer",
      token: auth,
    };
  }

  return auth;
}

export async function buildProtectedApiHeaders(
  authInput: ProtectedApiAuthInput,
  headersInit?: HeadersInit,
  options: { json?: boolean } = {},
): Promise<Headers> {
  const auth = normalizeProtectedApiAuth(authInput);
  const headers = new Headers(headersInit ?? {});

  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth.mode === "preview") {
    headers.set("X-User-Id", auth.userId);
    return headers;
  }

  if (auth.mode === "bearer") {
    if (!auth.token.trim()) {
      throw new Error("protected-api error 0: session_token_unavailable");
    }

    headers.set("Authorization", `Bearer ${auth.token}`);
    return headers;
  }

  const token = await auth.getToken();
  if (!token) {
    throw new Error("protected-api error 0: session_token_unavailable");
  }

  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}
