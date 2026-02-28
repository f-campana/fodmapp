import assert from "node:assert/strict";
import test from "node:test";

import {
  computeScopeOutputs,
  hasGlobalInvalidation,
  resolveScopeFromContext,
} from "./detect-ci-scope.mjs";

const allTrue = {
  design_tokens: true,
  ui_foundation: true,
  app_scaffold: true,
  content_scaffolds: true,
};

const allFalse = {
  design_tokens: false,
  ui_foundation: false,
  app_scaffold: false,
  content_scaffolds: false,
};

test("non-PR events force all scoped jobs on", () => {
  const result = resolveScopeFromContext({
    eventName: "push",
    baseSha: "ignored",
    headSha: "ignored",
    isValidRevision: () => {
      throw new Error("should not be called");
    },
    diffFiles: () => {
      throw new Error("should not be called");
    },
  });

  assert.equal(result.reason, "non_pr");
  assert.deepEqual(result.outputs, allTrue);
});

test("invalid refs force all scoped jobs on", () => {
  let diffCalled = false;

  const result = resolveScopeFromContext({
    eventName: "pull_request",
    baseSha: "bad",
    headSha: "also-bad",
    isValidRevision: () => false,
    diffFiles: () => {
      diffCalled = true;
      return [];
    },
  });

  assert.equal(result.reason, "invalid_refs");
  assert.equal(diffCalled, false);
  assert.deepEqual(result.outputs, allTrue);
});

test("diff failures force all scoped jobs on", () => {
  const result = resolveScopeFromContext({
    eventName: "pull_request",
    baseSha: "base",
    headSha: "head",
    isValidRevision: () => true,
    diffFiles: () => {
      throw new Error("boom");
    },
  });

  assert.equal(result.reason, "diff_error");
  assert.deepEqual(result.outputs, allTrue);
  assert.equal(result.error, "boom");
});

test("global invalidation paths force all scoped jobs on", () => {
  const changedFiles = ["turbo.json"];
  assert.equal(hasGlobalInvalidation(changedFiles), true);

  const result = resolveScopeFromContext({
    eventName: "pull_request",
    baseSha: "base",
    headSha: "head",
    isValidRevision: () => true,
    diffFiles: () => changedFiles,
  });

  assert.equal(result.reason, "global_invalidation");
  assert.deepEqual(result.outputs, allTrue);
});

test("app-only changes only enable app_scaffold", () => {
  const result = resolveScopeFromContext({
    eventName: "pull_request",
    baseSha: "base",
    headSha: "head",
    isValidRevision: () => true,
    diffFiles: () => ["apps/app/lib/auth.ts"],
  });

  assert.equal(result.reason, "scoped");
  assert.deepEqual(result.outputs, {
    design_tokens: false,
    ui_foundation: false,
    app_scaffold: true,
    content_scaffolds: false,
  });
});

test("tailwind/storybook changes enable expected dependent scopes", () => {
  const outputs = computeScopeOutputs([
    "packages/tailwind-config/shared-styles.css",
    "apps/storybook/stories/card.stories.tsx",
  ]);

  assert.deepEqual(outputs, {
    design_tokens: false,
    ui_foundation: true,
    app_scaffold: true,
    content_scaffolds: true,
  });
});

test("design-token-only change enables all scoped jobs", () => {
  const outputs = computeScopeOutputs([
    "packages/design-tokens/src/tokens/base/color.json",
  ]);

  assert.deepEqual(outputs, allTrue);
});

test("unrelated docs-only changes keep all scoped jobs off", () => {
  const outputs = computeScopeOutputs(["docs/README.md"]);

  assert.deepEqual(outputs, allFalse);
});
