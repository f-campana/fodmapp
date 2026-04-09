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

  let authorizationHeader: string | null = null;
  let requestUrl = "";

  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    requestUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization");

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
  }) as typeof fetch;

  const repository = createHomeRepository(async () => "mobile_token");
  const result = await repository.getHomeData();

  assert.equal(
    requestUrl,
    "https://api.fodmap.example/v0/me/tracking/feed?limit=5",
  );
  assert.equal(authorizationHeader, "Bearer mobile_token");
  assert.equal(result.totalEntries, 2);
  assert.equal(result.recentEntries.length, 1);
  assert.equal(result.recentEntries[0]?.entryType, "symptom");
});
