import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { probeProtectedTrackingFeed } from "../src/data/protectedRepository.ts";

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

void test("probeProtectedTrackingFeed passes the token getter directly to the shared client", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fodmap.example";

  let authorizationHeader: string | null = null;
  let tokenCallCount = 0;
  globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    authorizationHeader = new Headers(init?.headers).get("Authorization");

    return new Response(
      JSON.stringify({
        total: 2,
        limit: 1,
        items: [],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const result = await probeProtectedTrackingFeed(async () => {
    tokenCallCount += 1;
    return "token_123";
  });

  assert.deepEqual(result, {
    itemCount: 0,
    total: 2,
  });
  assert.equal(tokenCallCount, 1);
  assert.equal(authorizationHeader, "Bearer token_123");
});
