import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { createConsentRepository } from "../src/data/consentRepository.ts";

const originalFetch = globalThis.fetch;
const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  }

  if (originalApiBaseUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  }
});

void test("consent repository fetches whether symptom tracking is enabled", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  let authorizationHeader: string | null = null;
  globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    authorizationHeader = new Headers(init?.headers).get("Authorization");

    return new Response(
      JSON.stringify({
        user_id: "11111111-1111-4111-8111-111111111111",
        consent_state: {
          active: true,
          consent_id: "consent-1",
          policy_version: "gdpr-v1",
          legal_basis: "consent",
          scope: {
            symptom_logs: true,
            diet_logs: true,
            sync_mutations: true,
          },
          method: "in_app_sheet",
          source: "mobile_app",
          granted_at_utc: "2026-04-09T12:00:00Z",
          revoked_at_utc: null,
          revocation_reason: null,
          status: "active",
        },
        history: [],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const repository = createConsentRepository(async () => "mobile_token");
  const consentState = await repository.getConsentState();

  assert.equal(authorizationHeader, "Bearer mobile_token");
  assert.equal(consentState.canCreateSymptoms, true);
  assert.equal(consentState.canCreateMeals, true);
  assert.equal(consentState.missingScope, null);
});

void test("consent repository grants tracking and refetches the unlocked state", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  const requests: Array<{
    method: string;
    body: Record<string, unknown> | null;
  }> = [];

  globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    requests.push({
      method: init?.method ?? "GET",
      body: init?.body
        ? (JSON.parse(String(init.body)) as Record<string, unknown>)
        : null,
    });

    if ((init?.method ?? "GET") === "POST") {
      return new Response(
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
      );
    }

    return new Response(
      JSON.stringify({
        user_id: "11111111-1111-4111-8111-111111111111",
        consent_state: {
          active: true,
          consent_id: "consent-1",
          policy_version: "gdpr-v1",
          legal_basis: "consent",
          scope: {
            symptom_logs: true,
            diet_logs: true,
            sync_mutations: true,
          },
          method: "in_app_sheet",
          source: "mobile_app",
          granted_at_utc: "2026-04-09T12:00:00Z",
          revoked_at_utc: null,
          revocation_reason: null,
          status: "active",
        },
        history: [],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const repository = createConsentRepository(async () => "mobile_token");
  const consentState = await repository.enableTracking();

  assert.equal(requests.length, 2);
  assert.equal(requests[0]?.method, "POST");
  assert.deepEqual(requests[0]?.body, {
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
  assert.equal(requests[1]?.method, "GET");
  assert.equal(consentState.canCreateSymptoms, true);
  assert.equal(consentState.canCreateMeals, true);
});
