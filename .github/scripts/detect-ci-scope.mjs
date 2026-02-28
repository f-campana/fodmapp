#!/usr/bin/env node

import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const scopeOutputs = [
  "design_tokens",
  "ui_foundation",
  "app_scaffold",
  "content_scaffolds",
];

export const scopeMap = {
  design_tokens: ["packages/design-tokens/"],
  ui_foundation: [
    "packages/ui/",
    "apps/storybook/",
    "packages/tailwind-config/",
    "packages/design-tokens/",
    "packages/reporting/",
  ],
  app_scaffold: [
    "apps/app/",
    "packages/types/",
    "packages/ui/",
    "packages/tailwind-config/",
    "packages/design-tokens/",
  ],
  content_scaffolds: [
    "apps/marketing/",
    "apps/research/",
    "packages/content-config/",
    "packages/reporting/",
    "packages/ui/",
    "packages/tailwind-config/",
    "packages/design-tokens/",
  ],
};

const globalInvalidationFiles = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  ".github/workflows/ci.yml",
  ".github/scripts/detect-ci-scope.mjs",
]);

function log(message) {
  process.stdout.write(`${message}\n`);
}

function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }

  appendFileSync(outputPath, `${name}=${value}\n`);
}

function writeScopeOutputs(outputs) {
  for (const output of scopeOutputs) {
    setOutput(output, outputs[output] ? "true" : "false");
  }
}

function makeScopeOutputs(value) {
  return Object.fromEntries(scopeOutputs.map((output) => [output, value]));
}

function defaultIsValidRevision(revision) {
  if (!revision) {
    return false;
  }

  try {
    execSync(`git rev-parse --verify ${revision}^{commit}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function defaultDiffFiles(baseSha, headSha) {
  const output = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function matchesAnyPrefix(file, prefixes) {
  return prefixes.some((prefix) => file.startsWith(prefix));
}

export function hasGlobalInvalidation(changedFiles) {
  return changedFiles.some((file) => globalInvalidationFiles.has(file));
}

export function computeScopeOutputs(changedFiles) {
  const outputs = makeScopeOutputs(false);

  for (const [scope, prefixes] of Object.entries(scopeMap)) {
    outputs[scope] = changedFiles.some((file) =>
      matchesAnyPrefix(file, prefixes),
    );
  }

  return outputs;
}

export function resolveScopeFromContext({
  eventName,
  baseSha,
  headSha,
  isValidRevision = defaultIsValidRevision,
  diffFiles = defaultDiffFiles,
}) {
  if (eventName !== "pull_request") {
    return {
      reason: "non_pr",
      outputs: makeScopeOutputs(true),
      changedFiles: [],
    };
  }

  if (!isValidRevision(baseSha) || !isValidRevision(headSha)) {
    return {
      reason: "invalid_refs",
      outputs: makeScopeOutputs(true),
      changedFiles: [],
    };
  }

  let changedFiles = [];

  try {
    changedFiles = diffFiles(baseSha, headSha);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return {
      reason: "diff_error",
      outputs: makeScopeOutputs(true),
      changedFiles: [],
      error: details,
    };
  }

  if (hasGlobalInvalidation(changedFiles)) {
    return {
      reason: "global_invalidation",
      outputs: makeScopeOutputs(true),
      changedFiles,
    };
  }

  return {
    reason: "scoped",
    outputs: computeScopeOutputs(changedFiles),
    changedFiles,
  };
}

function main() {
  const eventName = (process.env.GITHUB_EVENT_NAME || "").trim();
  const baseSha = (process.env.BASE_SHA || "").trim();
  const headSha = (process.env.HEAD_SHA || "").trim();

  const result = resolveScopeFromContext({
    eventName,
    baseSha,
    headSha,
  });

  if (result.reason === "non_pr") {
    log("[ci-scope] Non-PR event detected. Enabling all scoped jobs.");
  } else if (result.reason === "invalid_refs") {
    log("[ci-scope] Missing or invalid PR SHAs. Enabling all scoped jobs.");
  } else if (result.reason === "diff_error") {
    log(
      `[ci-scope] Failed to diff PR revisions (${result.error}). Enabling all scoped jobs.`,
    );
  } else if (result.reason === "global_invalidation") {
    log(
      "[ci-scope] Global build/workflow files changed. Enabling all scoped jobs.",
    );
  } else {
    log(`[ci-scope] Changed files: ${result.changedFiles.length}`);
    for (const scope of scopeOutputs) {
      log(`[ci-scope] ${scope}=${result.outputs[scope] ? "true" : "false"}`);
    }
  }

  writeScopeOutputs(result.outputs);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
