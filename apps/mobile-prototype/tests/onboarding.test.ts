import assert from "node:assert/strict";
import test from "node:test";

import {
  parseOnboardingCompleted,
  serializeOnboardingCompleted,
} from "../src/storage/onboarding.ts";

void test("parseOnboardingCompleted maps only true string to true", () => {
  assert.equal(parseOnboardingCompleted("true"), true);
  assert.equal(parseOnboardingCompleted("false"), false);
  assert.equal(parseOnboardingCompleted(null), false);
});

void test("serializeOnboardingCompleted writes stable flags", () => {
  assert.equal(serializeOnboardingCompleted(true), "true");
  assert.equal(serializeOnboardingCompleted(false), "false");
});
