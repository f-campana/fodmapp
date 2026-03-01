import { execSync } from "node:child_process";

const scopeOutputs = [
  "design_tokens",
  "ui_foundation",
  "app_scaffold",
  "content_scaffolds",
];

const scopeMap = {
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
  ".github/scripts/ci-scope-rules.mjs",
]);

const changesetPrGatePrefixes = ["apps/", "packages/", ".changeset/"];
const changesetPrGateFiles = new Set([
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "turbo.json",
]);

function matchesAnyPrefix(file, prefixes) {
  return prefixes.some((prefix) => file.startsWith(prefix));
}

function makeScopeOutputs(value) {
  return Object.fromEntries(scopeOutputs.map((scope) => [scope, value]));
}

function computeScopeOutputs(changedFiles) {
  return Object.fromEntries(
    scopeOutputs.map((scope) => [
      scope,
      changedFiles.some((file) => matchesAnyPrefix(file, scopeMap[scope])),
    ]),
  );
}

function hasGlobalInvalidation(changedFiles) {
  return changedFiles.some((file) => globalInvalidationFiles.has(file));
}

function hasChangesetPrRelevantChanges(changedFiles) {
  return changedFiles.some(
    (file) =>
      matchesAnyPrefix(file, changesetPrGatePrefixes) ||
      changesetPrGateFiles.has(file),
  );
}

function isValidRevision(revision) {
  if (!revision) {
    return false;
  }

  try {
    execSync(`git rev-parse --verify ${revision}^{commit}`, {
      stdio: "ignore",
    });
  } catch {
    return false;
  }

  return true;
}

function listChangedFiles(baseSha, headSha) {
  const output = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export {
  changesetPrGatePrefixes,
  computeScopeOutputs,
  globalInvalidationFiles,
  hasChangesetPrRelevantChanges,
  hasGlobalInvalidation,
  isValidRevision,
  listChangedFiles,
  makeScopeOutputs,
  matchesAnyPrefix,
  scopeMap,
  scopeOutputs,
};
