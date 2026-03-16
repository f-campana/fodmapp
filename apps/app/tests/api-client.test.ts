import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getFoodDetail,
  getFoodRollup,
  getSafeHarbors,
  getSwaps,
  searchFoods,
} from "../lib/api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("public read client", () => {
  it("builds the search URL under /v0 and omits auth headers", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          query: "ail",
          limit: 12,
          items: [],
          total: 0,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchFoods("ail", 12);

    expect(result).toEqual({
      ok: true,
      data: {
        query: "ail",
        limit: 12,
        items: [],
        total: 0,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/foods?q=ail&limit=12",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).has("X-User-Id")).toBe(false);
  });

  it("returns api_not_configured when the API base URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    const result = await getSafeHarbors();

    expect(result).toEqual({
      ok: false,
      status: 0,
      error: "api_not_configured",
    });
  });

  it("maps 404 errors to not_found", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "not_found",
              message: "Food not found",
            },
          }),
          { status: 404 },
        ),
      ),
    );

    const result = await getFoodDetail("missing-food");

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "not_found",
    });
  });

  it("returns invalid_json when a successful response body cannot be parsed", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
      }),
    );

    const result = await getFoodRollup("phase2-ail-cru");

    expect(result).toEqual({
      ok: false,
      status: 200,
      error: "invalid_json",
    });
  });

  it("maps network failures to request_failed", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await getSwaps("phase2-ail-cru");

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "request_failed",
    });
  });
});
