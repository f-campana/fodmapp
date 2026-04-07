import { describe, expect, it, vi } from "vitest";

import { buildProtectedApiHeaders, normalizeProtectedApiAuth } from "../src";

describe("@fodmapp/api-client protected auth helpers", () => {
  it("accepts a token getter function directly", async () => {
    const getToken = vi.fn().mockResolvedValue("token_123");

    const headers = await buildProtectedApiHeaders(getToken);

    expect(getToken).toHaveBeenCalledTimes(1);
    expect(headers.get("Authorization")).toBe("Bearer token_123");
  });

  it("accepts a bearer token string directly", async () => {
    const headers = await buildProtectedApiHeaders("token_123");

    expect(headers.get("Authorization")).toBe("Bearer token_123");
  });

  it("normalizes token getter and bearer token inputs into explicit auth modes", () => {
    const getToken = vi.fn();

    expect(normalizeProtectedApiAuth(getToken)).toEqual({
      mode: "runtime",
      getToken,
    });
    expect(normalizeProtectedApiAuth("token_123")).toEqual({
      mode: "bearer",
      token: "token_123",
    });
  });
});
