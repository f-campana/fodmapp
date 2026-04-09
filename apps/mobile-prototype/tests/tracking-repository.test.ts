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

void test("tracking repository getHubReadModel loads feed and weekly summary through the protected boundary", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  const requestUrls: string[] = [];
  const authorizationHeaders: string[] = [];

  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    requestUrls.push(String(input));
    authorizationHeaders.push(
      new Headers(init?.headers).get("Authorization") ?? "",
    );

    if (requestUrls.length === 1) {
      return new Response(
        JSON.stringify({
          total: 1,
          limit: 10,
          items: [],
        }),
        { status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        anchor_date: "2026-04-09",
        window_start_utc: "2026-04-03T00:00:00.000Z",
        window_end_utc: "2026-04-09T23:59:59.000Z",
        daily_counts: [],
        symptom_counts: [],
        severity: {
          average: null,
          maximum: null,
        },
        proximity_groups: [],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const repository = createTrackingRepository(async () => "mobile_token");
  const hubReadModel = await repository.getHubReadModel({ feedLimit: 10 });

  assert.deepEqual(requestUrls, [
    "https://api.fodmap.example/v0/me/tracking/feed?limit=10",
    "https://api.fodmap.example/v0/me/tracking/summary/weekly",
  ]);
  assert.deepEqual(authorizationHeaders, [
    "Bearer mobile_token",
    "Bearer mobile_token",
  ]);
  assert.equal(hubReadModel.feed.total, 1);
  assert.equal(hubReadModel.summary.anchorDate, "2026-04-09");
});
