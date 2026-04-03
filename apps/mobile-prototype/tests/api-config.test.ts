import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { getPublicCatalogApiClientConfig } from "../src/config/api.ts";

const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

afterEach(() => {
  if (originalApiBaseUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  }
});

void test("getPublicCatalogApiClientConfig reads the static Expo public env key", () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = " https://api.fodmapp.fr ";

  assert.deepEqual(getPublicCatalogApiClientConfig(), {
    apiBaseUrl: "https://api.fodmapp.fr",
  });
});

void test("getPublicCatalogApiClientConfig returns null when the Expo public env key is blank", () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "   ";

  assert.deepEqual(getPublicCatalogApiClientConfig(), {
    apiBaseUrl: null,
  });
});
