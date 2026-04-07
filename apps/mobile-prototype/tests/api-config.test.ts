import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  CLERK_PUBLISHABLE_KEY_ENV,
  getClerkConfigurationError,
  getClerkPublishableKey,
} from "../src/auth/config.ts";
import {
  getProtectedApiClientConfig,
  getPublicCatalogApiClientConfig,
} from "../src/config/api.ts";

const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const originalClerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

afterEach(() => {
  if (originalApiBaseUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  }

  if (originalClerkPublishableKey === undefined) {
    delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  } else {
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = originalClerkPublishableKey;
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

void test("getProtectedApiClientConfig reuses the Expo API base for protected routes", () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = " https://api.fodmapp.fr ";

  assert.deepEqual(getProtectedApiClientConfig(), {
    apiBaseUrl: "https://api.fodmapp.fr",
  });
});

void test("getClerkPublishableKey trims the Expo public Clerk key", () => {
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = " pk_test_mobile ";

  assert.equal(getClerkPublishableKey(), "pk_test_mobile");
  assert.equal(getClerkConfigurationError(), null);
});

void test("getClerkConfigurationError explains how to enable mobile auth when the key is missing", () => {
  delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  assert.equal(getClerkPublishableKey(), null);
  assert.equal(
    getClerkConfigurationError(),
    `Set ${CLERK_PUBLISHABLE_KEY_ENV} to enable mobile sign-in.`,
  );
});
