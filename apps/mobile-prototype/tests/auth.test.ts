import assert from "node:assert/strict";
import test from "node:test";

import {
  anonymousTokenGetter,
  createLoadingAuthState,
  createSignedOutAuthState,
} from "../src/auth/useAuth.ts";

void test("createLoadingAuthState initializes the auth provider boundary as unloaded", async () => {
  const state = createLoadingAuthState();

  assert.equal(state.isLoaded, false);
  assert.equal(state.isSignedIn, false);
  assert.equal(state.userId, null);
  assert.equal(await state.getToken(), null);
});

void test("createSignedOutAuthState preserves the configuration error and no-op auth actions", async () => {
  const state = createSignedOutAuthState("Set Clerk key");

  assert.equal(state.isLoaded, true);
  assert.equal(state.isSignedIn, false);
  assert.equal(state.configurationError, "Set Clerk key");
  assert.equal(await state.getToken(), null);
  await assert.doesNotReject(async () => state.signOut());
});

void test("anonymousTokenGetter always resolves to null", async () => {
  assert.equal(await anonymousTokenGetter(), null);
});
