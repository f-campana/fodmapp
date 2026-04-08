import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { createTrackingRepository } from "../src/data/trackingRepository.ts";

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

void test("tracking repository getFeed attaches the bearer token to the protected feed call", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  let authorizationHeader: string | null = null;
  globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    authorizationHeader = new Headers(init?.headers).get("Authorization");

    return new Response(
      JSON.stringify({
        total: 1,
        limit: 20,
        items: [],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const repository = createTrackingRepository(async () => "mobile_token");
  const feed = await repository.getFeed();

  assert.equal(feed.total, 1);
  assert.equal(authorizationHeader, "Bearer mobile_token");
});

void test("tracking repository createSymptom posts through the protected api-client boundary", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  let requestUrl = "";
  let requestMethod = "";
  let authorizationHeader: string | null = null;
  let requestBody: Record<string, unknown> | null = null;

  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    requestUrl = String(input);
    requestMethod = init?.method ?? "GET";
    authorizationHeader = new Headers(init?.headers).get("Authorization");
    requestBody = JSON.parse(String(init?.body ?? "{}")) as Record<
      string,
      unknown
    >;

    return new Response(
      JSON.stringify({
        symptom_log_id: "symptom-1",
        symptom_type: "pain",
        severity: 7,
        noted_at_utc: "2026-04-08T10:15:00.000Z",
        note: "Sharp pain after lunch",
        version: 1,
        created_at_utc: "2026-04-08T10:15:00.000Z",
        updated_at_utc: "2026-04-08T10:15:00.000Z",
      }),
      { status: 201 },
    );
  }) as typeof fetch;

  const repository = createTrackingRepository(async () => "mobile_token");
  const symptom = await repository.createSymptom({
    symptomType: "pain",
    severity: 7,
    note: "  Sharp pain after lunch  ",
  });

  assert.equal(
    requestUrl,
    "https://api.fodmap.example/v0/me/tracking/symptoms",
  );
  assert.equal(requestMethod, "POST");
  assert.equal(authorizationHeader, "Bearer mobile_token");
  assert.equal(requestBody?.["symptom_type"], "pain");
  assert.equal(requestBody?.["severity"], 7);
  assert.equal(requestBody?.["note"], "Sharp pain after lunch");
  assert.equal(typeof requestBody?.["noted_at_utc"], "string");
  assert.equal(symptom.symptomType, "pain");
  assert.equal(symptom.severity, 7);
});
