import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCoverage,
  hasWorkspaceOrReleasableChanges,
  parseChangesetFrontmatter,
} from "./check-pr-changesets.mjs";

const exemptLabel = "changeset-exempt";
const exemptPackages = new Set(["@fodmap/mobile-prototype"]);

function evaluate({
  changedFiles,
  changedPackageNames,
  changesetPackageNames,
  hasExemptLabel = false,
}) {
  const changes = hasWorkspaceOrReleasableChanges(changedFiles);

  return evaluateCoverage({
    changedFiles,
    changes,
    changedPackageNames: new Set(changedPackageNames),
    changesetPackageNames: new Set(changesetPackageNames),
    exemptPackages,
    exemptLabel,
    hasExemptLabel,
  });
}

test("package changed + valid changeset file passes", () => {
  const parsed = parseChangesetFrontmatter(
    ["---", '"@fodmap/design-tokens": patch', "---", "release note", ""].join(
      "\n",
    ),
    ".changeset/design-tokens.md",
  );

  const result = evaluate({
    changedFiles: [
      "packages/design-tokens/src/tokens/base/color.json",
      ".changeset/design-tokens.md",
    ],
    changedPackageNames: ["@fodmap/design-tokens"],
    changesetPackageNames: [...parsed],
  });

  assert.equal(result.ok, true);
});

test("package changed + no matching changeset fails", () => {
  const result = evaluate({
    changedFiles: ["packages/design-tokens/src/index.ts"],
    changedPackageNames: ["@fodmap/design-tokens"],
    changesetPackageNames: [],
  });

  assert.equal(result.ok, false);
  assert.match(
    result.errors[0],
    /Missing changeset coverage for: @fodmap\/design-tokens/,
  );
});

test("allowlisted package + exemption label passes without changeset", () => {
  const result = evaluate({
    changedFiles: ["packages/mobile-prototype/src/index.ts"],
    changedPackageNames: ["@fodmap/mobile-prototype"],
    changesetPackageNames: [],
    hasExemptLabel: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.infos[0], /Exemption label "changeset-exempt" accepted/);
});

test("docs-only changes skip the changeset gate", () => {
  const changes = hasWorkspaceOrReleasableChanges(["docs/README.md"]);
  assert.equal(changes.shouldCheck, false);
});

test("malformed changeset frontmatter fails with file-specific message", () => {
  assert.throws(
    () =>
      parseChangesetFrontmatter(
        [
          "---",
          "@fodmap/design-tokens patch",
          "---",
          "broken frontmatter",
          "",
        ].join("\n"),
        ".changeset/broken.md",
      ),
    /\.changeset\/broken\.md: invalid frontmatter entry/,
  );
});

test("root releasable file changed without changeset fails", () => {
  const result = evaluate({
    changedFiles: ["package.json"],
    changedPackageNames: [],
    changesetPackageNames: [],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors[0], /No pending releases found/);
});

test("exemption label misuse fails when no allowlisted package is touched", () => {
  const result = evaluate({
    changedFiles: ["packages/design-tokens/src/index.ts"],
    changedPackageNames: ["@fodmap/design-tokens"],
    changesetPackageNames: ["@fodmap/design-tokens"],
    hasExemptLabel: true,
  });

  assert.equal(result.ok, false);
  assert.match(
    result.errors[0],
    /"changeset-exempt" label is only valid for allowlisted packages/,
  );
});
