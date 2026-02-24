import { describe, expect, it, vi } from "vitest";

import { BarcodeClientError, createBarcodeClient } from "../index";

describe("createBarcodeClient", () => {
  it("calls lookup endpoint", async () => {
    const fetchImpl = vi.fn(async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          query_code: "036000291452",
          normalized_code: "0036000291452",
          canonical_format: "EAN13",
          resolution_status: "unresolved",
          cache_status: "miss",
          candidates: [],
          provider: "open_food_facts",
        }),
      }) as Response,
    );

    const client = createBarcodeClient({ baseUrl: "https://api.example", fetchImpl: fetchImpl as unknown as typeof fetch });
    const payload = await client.lookupBarcode("036000291452");

    expect(payload.normalized_code).toBe("0036000291452");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example/v0/barcodes/036000291452",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("sends auth and actor headers for manual mutation", async () => {
    const fetchImpl = vi.fn(async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          normalized_code: "0036000291452",
          canonical_format: "EAN13",
          action: "set_manual",
          food_slug: "riz_blanche_cuit",
        }),
      }) as Response,
    );

    const client = createBarcodeClient({
      baseUrl: "https://api.example",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      internal: {
        token: "secret",
        defaultActor: "integration-test",
      },
    });

    await client.setManualBarcodeLink("036000291452", "riz_blanche_cuit");

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example/v0/internal/barcodes/036000291452/link",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
          "X-Actor": "integration-test",
        }),
      }),
    );
  });

  it("throws typed error when backend fails", async () => {
    const fetchImpl = vi.fn(async () =>
      ({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            code: "provider_unavailable",
            message: "Provider unavailable",
          },
        }),
      }) as Response,
    );

    const client = createBarcodeClient({ baseUrl: "https://api.example", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(client.lookupBarcode("036000291452")).rejects.toBeInstanceOf(BarcodeClientError);
  });
});
