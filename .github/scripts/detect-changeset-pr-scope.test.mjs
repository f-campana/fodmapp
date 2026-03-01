import assert from "node:assert/strict";
import test from "node:test";

import { resolveChangesetPrRelevance } from "./detect-changeset-pr-scope.mjs";

test("invalid refs force gate on", () => {
  const result = resolveChangesetPrRelevance({
    baseSha: "bad",
    headSha: "also-bad",
    isValidRevision: () => false,
    diffFiles: () => {
      throw new Error("diff should not run");
    },
  });

  assert.equal(result.reason, "invalid_refs");
  assert.equal(result.relevant, true);
});

test("package/app changes remain relevant", () => {
  const result = resolveChangesetPrRelevance({
    baseSha: "base",
    headSha: "head",
    isValidRevision: () => true,
    diffFiles: () => [
      "packages/design-tokens/src/tokens/base/color.json",
      "README.md",
    ],
  });

  assert.equal(result.reason, "scoped");
  assert.equal(result.relevant, true);
});

test("docs-only changes remain out of scope", () => {
  const result = resolveChangesetPrRelevance({
    baseSha: "base",
    headSha: "head",
    isValidRevision: () => true,
    diffFiles: () => ["docs/README.md", ".github/workflows/api.yml"],
  });

  assert.equal(result.reason, "scoped");
  assert.equal(result.relevant, false);
});

test("diff failure keeps gate enabled", () => {
  const result = resolveChangesetPrRelevance({
    baseSha: "base",
    headSha: "head",
    isValidRevision: () => true,
    diffFiles: () => {
      throw new Error("boom");
    },
  });

  assert.equal(result.reason, "diff_error");
  assert.equal(result.relevant, true);
  assert.equal(result.error, "boom");
});
