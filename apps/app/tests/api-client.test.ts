import { afterEach, describe, expect, it, vi } from "vitest";

import { getSafeHarbors } from "../lib/api";
import type { ProtectedApiAuth } from "../lib/protectedApiAuth";
import { deleteTrackingMeal } from "../lib/tracking";

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

describe("tracking app-side helpers", () => {
  it("returns undefined on 204 delete responses", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    const result = await deleteTrackingMeal(auth, "meal-1");

    expect(result).toBeUndefined();
  });
});
