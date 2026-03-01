#!/usr/bin/env node

import { appendFileSync } from "node:fs";

import {
  hasChangesetPrRelevantChanges,
  isValidRevision,
  listChangedFiles,
} from "./ci-scope-rules.mjs";

function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }

  appendFileSync(outputPath, `${name}=${value}\n`);
}

export function resolveChangesetPrRelevance({
  baseSha,
  headSha,
  isValidRevision: isValidRevisionFn = isValidRevision,
  diffFiles = listChangedFiles,
}) {
  if (!isValidRevisionFn(baseSha) || !isValidRevisionFn(headSha)) {
    return {
      reason: "invalid_refs",
      relevant: true,
      changedFiles: [],
    };
  }

  try {
    const changedFiles = diffFiles(baseSha, headSha);
    return {
      reason: "scoped",
      relevant: hasChangesetPrRelevantChanges(changedFiles),
      changedFiles,
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return {
      reason: "diff_error",
      relevant: true,
      changedFiles: [],
      error: details,
    };
  }
}

function main() {
  const baseSha = (process.env.BASE_SHA || "").trim();
  const headSha = (process.env.HEAD_SHA || "").trim();

  const result = resolveChangesetPrRelevance({
    baseSha,
    headSha,
    isValidRevision,
    diffFiles: listChangedFiles,
  });

  setOutput("relevant", result.relevant ? "true" : "false");
  setOutput("reason", result.reason);

  if (result.reason === "scoped") {
    process.stdout.write(
      `[changeset-pr-scope] scoped_change_detection relevant=${result.relevant ? "true" : "false"} changed_files=${result.changedFiles.length}`,
    );
  } else {
    const reason = result.reason;
    const details =
      result.error !== undefined && result.error !== ""
        ? ` (${result.error})`
        : "";
    process.stdout.write(
      `[changeset-pr-scope] ${reason}. Running changeset gate because scope checks could not be completed safely${details}.`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  main();
}
