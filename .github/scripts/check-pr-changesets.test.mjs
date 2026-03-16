import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCoverage,
  findUnknownChangesetPackages,
  hasWorkspaceOrReleasableChanges,
  listChangedChangesetFiles,
  parseChangesetFrontmatter,
  parseModeFromArgs,
} from "./check-pr-changesets.mjs";

const exemptLabel = "changeset-exempt";
const exemptPackages = new Set(["@fodmapp/mobile-prototype"]);

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
    ["---", '"@fodmapp/design-tokens": patch', "---", "release note", ""].join(
      "\n",
    ),
    ".changeset/design-tokens.md",
  );

  const result = evaluate({
    changedFiles: [
      "packages/design-tokens/src/tokens/base/color.json",
      ".changeset/design-tokens.md",
    ],
    changedPackageNames: ["@fodmapp/design-tokens"],
    changesetPackageNames: [...parsed],
  });

  assert.equal(result.ok, true);
});

test("package changed + no matching changeset fails", () => {
  const result = evaluate({
    changedFiles: ["packages/design-tokens/src/index.ts"],
    changedPackageNames: ["@fodmapp/design-tokens"],
    changesetPackageNames: [],
  });

  assert.equal(result.ok, false);
  assert.match(
    result.errors[0],
    /Missing changeset coverage for: @fodmapp\/design-tokens/,
  );
});

test("allowlisted package + exemption label passes without changeset", () => {
  const result = evaluate({
    changedFiles: ["packages/mobile-prototype/src/index.ts"],
    changedPackageNames: ["@fodmapp/mobile-prototype"],
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

test("changed changeset file listing excludes README.md", () => {
  const files = listChangedChangesetFiles([
    ".changeset/README.md",
    ".changeset/valid.md",
    ".changeset/config.json",
  ]);

  assert.deepEqual(files, [".changeset/valid.md"]);
});

test("mode parser accepts --all and rejects unknown args", () => {
  assert.equal(parseModeFromArgs([]), "coverage");
  assert.equal(parseModeFromArgs(["--all"]), "all");
  assert.equal(parseModeFromArgs(["--bogus"]), null);
});

test("malformed changeset frontmatter fails with file-specific message", () => {
  assert.throws(
    () =>
      parseChangesetFrontmatter(
        [
          "---",
          "@fodmapp/design-tokens patch",
          "---",
          "broken frontmatter",
          "",
        ].join("\n"),
        ".changeset/broken.md",
      ),
    /\.changeset\/broken\.md: invalid frontmatter entry/,
  );
});

test("root releasable file changed without changeset passes", () => {
  const result = evaluate({
    changedFiles: ["package.json"],
    changedPackageNames: [],
    changesetPackageNames: [],
  });

  assert.equal(result.ok, true);
  assert.match(result.infos[0], /Releasable root-only changes detected/);
});

test("exemption label misuse fails when no allowlisted package is touched", () => {
  const result = evaluate({
    changedFiles: ["packages/design-tokens/src/index.ts"],
    changedPackageNames: ["@fodmapp/design-tokens"],
    changesetPackageNames: ["@fodmapp/design-tokens"],
    hasExemptLabel: true,
  });

  assert.equal(result.ok, false);
  assert.match(
    result.errors[0],
    /"changeset-exempt" label is only valid for allowlisted packages/,
  );
});

test("unknown/non-workspace changeset package is detected with source file", () => {
  const packageSources = new Map([
    ["fodmapp-platform", new Set([".changeset/invalid-root.md"])],
    ["@fodmapp/design-tokens", new Set([".changeset/valid.md"])],
  ]);
  const workspacePackageNames = new Set(["@fodmapp/design-tokens"]);

  const unknown = findUnknownChangesetPackages(
    packageSources,
    workspacePackageNames,
  );

  assert.deepEqual(unknown, [
    {
      packageName: "fodmapp-platform",
      sourceFiles: [".changeset/invalid-root.md"],
    },
  ]);
});

test("root-only change would pass coverage but unknown changed changeset package is still flagged", () => {
  const coverage = evaluate({
    changedFiles: ["package.json"],
    changedPackageNames: [],
    changesetPackageNames: ["fodmapp-platform"],
  });
  assert.equal(coverage.ok, true);

  const unknown = findUnknownChangesetPackages(
    new Map([["fodmapp-platform", new Set([".changeset/invalid-root.md"])]]),
    new Set(["@fodmapp/design-tokens"]),
  );
  assert.equal(unknown.length, 1);
  assert.equal(unknown[0].packageName, "fodmapp-platform");
});
