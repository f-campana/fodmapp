#!/usr/bin/env node

import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  computeScopeOutputs,
  hasGlobalInvalidation,
  isValidRevision,
  listChangedFiles,
  matchesAnyPrefix,
  scopeOutputs,
} from "./ci-scope-rules.mjs";

export {
  computeScopeOutputs,
  hasGlobalInvalidation,
  matchesAnyPrefix,
  scopeOutputs,
};

function makeScopeOutputs(value) {
  return Object.fromEntries(scopeOutputs.map((scope) => [scope, value]));
}

export function resolveScopeFromContext({
  eventName,
  baseSha,
  headSha,
  isValidRevision: isValidRevisionFn = isValidRevision,
  diffFiles = listChangedFiles,
}) {
  if (eventName !== "pull_request") {
    return {
      reason: "non_pr",
      outputs: makeScopeOutputs(true),
      changedFiles: [],
    };
  }

  if (!isValidRevisionFn(baseSha) || !isValidRevisionFn(headSha)) {
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

function main() {
  const eventName = (process.env.GITHUB_EVENT_NAME || "").trim();
  const baseSha = (process.env.BASE_SHA || "").trim();
  const headSha = (process.env.HEAD_SHA || "").trim();

  const result = resolveScopeFromContext({
    eventName,
    baseSha,
    headSha,
    isValidRevision: isValidRevision,
    diffFiles: listChangedFiles,
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
