import { describe, expect, it, vi } from "vitest";

import {
  getConsentRecord,
  postConsentRecord,
  type ProtectedApiAuth,
} from "../src";

const apiConfig = {
  apiBaseUrl: "https://api.fodmap.example",
} as const;

describe("@fodmapp/api-client consent helpers", () => {
  it("returns null when the consent record is not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "not_found",
              message: "No consent record found",
            },
          }),
          { status: 404 },
        ),
      ),
    );

    const result = await getConsentRecord(apiConfig, {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    });

    expect(result).toBeNull();
  });

  it("posts consent updates through the protected auth seam", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          consent_id: "consent-1",
          status: "active",
          policy_version: "gdpr-v1",
          legal_basis: "consent",
          effective_at_utc: "2026-04-09T12:00:00Z",
          previous_consent_id: null,
          evidence_uri: null,
          evidence_hash: "hash-1",
          history: [],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    await postConsentRecord(apiConfig, auth, {
      action: "grant",
      policy_version: "gdpr-v1",
      scope: {
        symptom_logs: true,
        diet_logs: true,
        sync_mutations: true,
      },
      legal_basis: "consent",
      method: "in_app_sheet",
      source: "mobile_app",
      source_ref: "mobile_tracking_unlock",
      language: "en",
      reason: null,
      signature: null,
      public_key_id: null,
      signature_payload: null,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fodmap.example/v0/me/consent",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token_123",
    );
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      action: "grant",
      policy_version: "gdpr-v1",
      scope: {
        symptom_logs: true,
        diet_logs: true,
        sync_mutations: true,
      },
      legal_basis: "consent",
      method: "in_app_sheet",
      source: "mobile_app",
      source_ref: "mobile_tracking_unlock",
      language: "en",
      reason: null,
      signature: null,
      public_key_id: null,
      signature_payload: null,
    });
  });
});
