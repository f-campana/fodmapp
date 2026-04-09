import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { createHomeRepository } from "../src/data/homeRepository.ts";

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

void test("home repository fetches recent protected activity with the bearer token", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  const authorizationHeaders: string[] = [];
  const requestUrls: string[] = [];

  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    requestUrls.push(String(input));
    authorizationHeaders.push(
      new Headers(init?.headers).get("Authorization") ?? "",
    );

    if (requestUrls.length === 1) {
      return new Response(
        JSON.stringify({
          total: 2,
          limit: 5,
          items: [
            {
              entry_type: "symptom",
              entry_id: "symptom-1",
              occurred_at_utc: "2026-04-09T10:15:00.000Z",
              symptom: {
                symptom_log_id: "symptom-1",
                symptom_type: "pain",
                severity: 7,
                noted_at_utc: "2026-04-09T10:15:00.000Z",
                note: "Sharp pain after lunch",
                version: 1,
                created_at_utc: "2026-04-09T10:15:00.000Z",
                updated_at_utc: "2026-04-09T10:15:00.000Z",
              },
            },
          ],
        }),
        { status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        anchor_date: "2026-04-09",
        window_start_utc: "2026-04-03T00:00:00.000Z",
        window_end_utc: "2026-04-09T23:59:59.000Z",
        daily_counts: [
          {
            date: "2026-04-09",
            meal_count: 0,
            symptom_count: 1,
          },
        ],
        symptom_counts: [
          {
            symptom_type: "pain",
            count: 1,
          },
        ],
        severity: {
          average: 7,
          maximum: 7,
        },
        proximity_groups: [],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const repository = createHomeRepository(async () => "mobile_token");
  const result = await repository.getHomeData();

  assert.deepEqual(requestUrls, [
    "https://api.fodmap.example/v0/me/tracking/feed?limit=5",
    "https://api.fodmap.example/v0/me/tracking/summary/weekly",
  ]);
  assert.deepEqual(authorizationHeaders, [
    "Bearer mobile_token",
    "Bearer mobile_token",
  ]);
  assert.equal(result.totalEntries, 2);
  assert.equal(result.recentEntries.length, 1);
  assert.equal(result.recentEntries[0]?.entryType, "symptom");
  assert.equal(result.weeklySummary.dailyCounts[0]?.symptomCount, 1);
});
