import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  analyzeTrackedMarkdown,
  collectGitHubAnchors,
  collectMarkdownLinks,
  parseCurrentInventoryRows,
  slugifyHeading,
} from "./docs-hygiene-audit.mjs";

function makeRepo(files) {
  const repoPath = mkdtempSync(path.join(tmpdir(), "docs-hygiene-audit-"));

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(repoPath, filePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }

  return repoPath;
}

function analyzeRepo(files, options = {}) {
  const repoPath = makeRepo(files);
  const report = analyzeTrackedMarkdown({
    repoPath,
    filePaths: Object.keys(files),
    remoteBranchExists: options.remoteBranchExists || (() => false),
  });

  return report;
}

function findingCategories(report) {
  return report.findings.map((finding) => finding.category);
}

test("collectMarkdownLinks ignores fenced and inline code links", () => {
  const links = collectMarkdownLinks(
    [
      "Before [good](./good.md)",
      "",
      "```md",
      "[ignored](./ignored.md)",
      "```",
      "After `code [ignored](./code.md)` and ![img](./image.md)",
    ].join("\n"),
  );

  assert.deepEqual(
    links.map((link) => `${link.line}:${link.rawTarget}`),
    ["1:./good.md", "6:./image.md"],
  );
});

test("slugifyHeading and collectGitHubAnchors follow GitHub-style duplicate slugs", () => {
  const anchors = collectGitHubAnchors(
    ["# Overview", "## Overview", "## Quick start"].join("\n"),
  );

  assert.equal(slugifyHeading("Quick start"), "quick-start");
  assert.deepEqual([...anchors], ["overview", "overview-1", "quick-start"]);
});

test("broken relative markdown links are reported", () => {
  const report = analyzeRepo({
    "docs/source.md": "[Missing](./missing.md)",
  });

  assert.equal(report.categoryCounts.broken_link, 1);
  assert.match(report.findings[0].message, /does not exist/);
  assert.equal(report.findings[0].file, "docs/source.md");
});

test("broken repo-root-relative markdown links are reported", () => {
  const report = analyzeRepo({
    "docs/source.md": "[Missing](/docs/missing.md)",
  });

  assert.equal(report.categoryCounts.broken_link, 1);
  assert.equal(report.findings[0].target, "docs/missing.md");
});

test("valid and invalid anchors are distinguished", () => {
  const report = analyzeRepo({
    "docs/source.md": [
      "[Valid](./target.md#quick-start)",
      "[Invalid](./target.md#missing-anchor)",
    ].join("\n"),
    "docs/target.md": ["# Target", "## Quick start"].join("\n"),
  });

  assert.equal(report.categoryCounts.broken_anchor, 1);
  assert.match(report.findings[0].message, /missing-anchor/);
});

test("retired transition path references are reported outside archive only", () => {
  const report = analyzeRepo({
    "docs/guide.md":
      "See docs/transition/current-state-snapshot.md for the old baseline.",
    "docs/archive/history.md":
      "Former active path: docs/transition/current-state-snapshot.md.",
  });

  assert.equal(report.categoryCounts.retired_path_reference, 1);
  assert.equal(report.findings[0].file, "docs/guide.md");
});

test("invalid status vocabulary is reported in non-archive docs", () => {
  const report = analyzeRepo({
    "docs/plans/example.md": [
      "# Example",
      "",
      "Status: Planned (deferred)",
    ].join("\n"),
  });

  assert.equal(report.categoryCounts.status_vocabulary, 1);
  assert.match(report.findings[0].message, /status vocabulary/);
});

test("managed canon docs missing metadata are reported", () => {
  const report = analyzeRepo({
    "CONTRIBUTING.md": ["# Contributing", "", "Status: Implemented"].join("\n"),
  });

  assert.equal(report.categoryCounts.missing_metadata, 1);
  assert.match(report.findings[0].message, /Audience:/);
  assert.match(report.findings[0].message, /Last reviewed:/);
});

test("archive mismatch is reported for archived status outside docs/archive", () => {
  const report = analyzeRepo({
    "apps/storybook/stories/foundations/FOUNDATIONS_REVIEW_FINDINGS.md": [
      "# Findings",
      "",
      "Status: archived (resolved/mitigated)",
    ].join("\n"),
  });

  assert.ok(findingCategories(report).includes("archive_mismatch"));
  assert.ok(findingCategories(report).includes("status_vocabulary"));
});

test("archive docs that still mention active mirrors are reported", () => {
  const report = analyzeRepo({
    "docs/archive/transition/example.md": [
      "# Example",
      "",
      "Canonical active source: docs/transition/example.md",
    ].join("\n"),
  });

  assert.equal(report.categoryCounts.archive_mismatch, 1);
});

test("worktree status stale note is reported", () => {
  const report = analyzeRepo({
    "docs/ops/worktree-status.md": [
      "# Worktree Status",
      "",
      "## Current Inventory",
      "",
      "| Worktree path | Branch | Status | Scope | Notes / blockers |",
      "| --- | --- | --- | --- | --- |",
      "| `/tmp/example` | `codex/example` | merged | Example | pending local removal |",
    ].join("\n"),
  });

  assert.equal(report.categoryCounts.worktree_status_stale, 1);
  assert.match(report.findings[0].message, /pending local removal/);
});

test("merged remote codex branch still existing is reported", () => {
  const report = analyzeRepo(
    {
      "docs/ops/worktree-status.md": [
        "# Worktree Status",
        "",
        "## Current Inventory",
        "",
        "| Worktree path | Branch | Status | Scope | Notes / blockers |",
        "| --- | --- | --- | --- | --- |",
        "| `/tmp/example` | `codex/example` | merged | Example | Merged via PR #1. |",
      ].join("\n"),
    },
    {
      remoteBranchExists: (branch) => branch === "codex/example",
    },
  );

  assert.equal(report.categoryCounts.worktree_status_stale, 1);
  assert.match(report.findings[0].message, /still exists on origin/);
});

test("merged remote codex branch absent does not create a false positive", () => {
  const report = analyzeRepo(
    {
      "docs/ops/worktree-status.md": [
        "# Worktree Status",
        "",
        "## Current Inventory",
        "",
        "| Worktree path | Branch | Status | Scope | Notes / blockers |",
        "| --- | --- | --- | --- | --- |",
        "| `/tmp/example` | `codex/example` | merged | Example | Merged via PR #1. |",
      ].join("\n"),
    },
    {
      remoteBranchExists: () => false,
    },
  );

  assert.equal(report.categoryCounts.worktree_status_stale, 0);
});

test("duplicate worktree paths and branches are reported from current inventory only", () => {
  const content = [
    "# Worktree Status",
    "",
    "## Current Inventory",
    "",
    "| Worktree path | Branch | Status | Scope | Notes / blockers |",
    "| --- | --- | --- | --- | --- |",
    "| `/tmp/one` | `codex/a` | active | A | In progress. |",
    "| `/tmp/one` | `codex/b` | active | B | In progress. |",
    "| `/tmp/two` | `codex/a` | active | C | In progress. |",
    "",
    "## Maintenance Log",
    "",
    "| Worktree path | Branch | Status | Scope | Notes / blockers |",
    "| --- | --- | --- | --- | --- |",
    "| `/tmp/history` | `codex/history` | merged | Old | Keep for reference. |",
  ].join("\n");

  const rows = parseCurrentInventoryRows(content);
  assert.equal(rows.length, 3);

  const report = analyzeRepo({
    "docs/ops/worktree-status.md": content,
  });

  assert.equal(report.categoryCounts.worktree_status_stale, 4);
  assert.equal(
    report.findings.filter((finding) =>
      finding.message.includes("Duplicate worktree path"),
    ).length,
    2,
  );
  assert.equal(
    report.findings.filter((finding) =>
      finding.message.includes("Duplicate branch"),
    ).length,
    2,
  );
});
