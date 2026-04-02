import { afterEach, describe, expect, it, vi } from "vitest";

import { getSafeHarbors } from "../lib/api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("safe-harbor helper", () => {
  it("returns api_not_configured when the API base URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    const result = await getSafeHarbors();

    expect(result).toEqual({
      ok: false,
      status: 0,
      error: "api_not_configured",
    });
  });
});
