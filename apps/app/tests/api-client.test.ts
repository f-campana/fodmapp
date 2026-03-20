import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getFoodDetail,
  getFoodRollup,
  getSafeHarbors,
  getSwaps,
  searchFoods,
} from "../lib/api";
import {
  createTrackingSymptom,
  deleteTrackingMeal,
  getTrackingFeed,
} from "../lib/tracking";

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

describe("tracking client", () => {
  it("sends X-User-Id on authenticated feed requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          total: 0,
          limit: 50,
          items: [],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getTrackingFeed("user_123", 50);

    expect(result).toEqual({
      total: 0,
      limit: 50,
      items: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/tracking/feed?limit=50",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get("X-User-Id")).toBe("user_123");
  });

  it("posts symptom payloads and keeps JSON headers", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          symptom_log_id: "symptom-1",
          symptom_type: "bloating",
          severity: 4,
          noted_at_utc: "2026-03-20T10:00:00Z",
          note: null,
          version: 1,
          created_at_utc: "2026-03-20T10:00:00Z",
          updated_at_utc: "2026-03-20T10:00:00Z",
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createTrackingSymptom("user_123", {
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: null,
    });

    expect(result.symptom_type).toBe("bloating");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("returns undefined on 204 delete responses", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    const result = await deleteTrackingMeal("user_123", "meal-1");

    expect(result).toBeUndefined();
  });
});
