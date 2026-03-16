#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const releasableRootFiles = new Set([
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "turbo.json",
]);

const workspacePrefixes = ["packages/", "apps/"];
const dependabotAuthorLogins = new Set(["dependabot[bot]", "app/dependabot"]);
const dependencyRootFiles = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
  "bun.lock",
  "bun.lockb",
]);
const workspaceDependencyManifestPattern =
  /^(?:apps|packages)\/[^/]+\/package\.json$/;
const workspaceDependencyLockfilePattern =
  /^(?:apps|packages)\/[^/]+\/(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock|npm-shrinkwrap\.json|bun\.lock|bun\.lockb)$/;

function logLine(message) {
  process.stdout.write(`${message}\n`);
}

function failLine(message) {
  process.stderr.write(`${message}\n`);
}

function debugLine(enabled, message) {
  if (!enabled) {
    return;
  }
  logLine(`[changeset-check][debug] ${message}`);
}

function parseCsvSet(value) {
  return new Set(
    `${value || ""}`
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function normalizeLogin(value) {
  return `${value || ""}`.trim().toLowerCase();
}

export function isDependabotAuthor(login) {
  return dependabotAuthorLogins.has(normalizeLogin(login));
}

function isDependencyManifestOrLockfile(filePath) {
  if (dependencyRootFiles.has(filePath)) {
    return true;
  }
  if (workspaceDependencyManifestPattern.test(filePath)) {
    return true;
  }
  if (workspaceDependencyLockfilePattern.test(filePath)) {
    return true;
  }
  return false;
}

export function isDependencyOnlyChange(files) {
  return files.length > 0 && files.every(isDependencyManifestOrLockfile);
}

function readPrLabels() {
  const envLabels = parseCsvSet(process.env.PR_LABELS);
  if (envLabels.size > 0) {
    return envLabels;
  }

  const eventPath = (process.env.GITHUB_EVENT_PATH || "").trim();
  if (!eventPath || !existsSync(eventPath)) {
    return new Set();
  }

  try {
    const payload = JSON.parse(readFileSync(eventPath, "utf8"));
    const labels = Array.isArray(payload?.pull_request?.labels)
      ? payload.pull_request.labels
          .map((entry) => `${entry?.name || ""}`.trim())
          .filter(Boolean)
      : [];
    return new Set(labels);
  } catch {
    return new Set();
  }
}

export function isValidRevision(revision) {
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

export function hasWorkspaceOrReleasableChanges(files) {
  const changedPackagesOrApps = files.some((file) => {
    return file.startsWith("packages/") || file.startsWith("apps/");
  });
  const changedReleasableRootFiles = files.some((file) => {
    return releasableRootFiles.has(file);
  });

  return {
    shouldCheck: changedPackagesOrApps || changedReleasableRootFiles,
    changedPackagesOrApps,
    changedReleasableRootFiles,
  };
}

function parseManifestName(rawManifest, manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(rawManifest);
  } catch {
    throw new Error(
      `[changeset-check] Unable to parse JSON at ${manifestPath}`,
    );
  }
  return `${manifest?.name || ""}`.trim();
}

function revisionFileExists(revision, filePath) {
  try {
    execFileSync("git", ["cat-file", "-e", `${revision}:${filePath}`], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function readRevisionFile(revision, filePath) {
  return execFileSync("git", ["show", `${revision}:${filePath}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function listRevisionFiles(revision, roots) {
  const args = ["ls-tree", "-r", "--name-only", revision];
  if (Array.isArray(roots) && roots.length > 0) {
    args.push("--", ...roots);
  }

  const output = execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readManifestNameAtRevision(revision, pkgDir) {
  const manifestPath = `${pkgDir}/package.json`;
  if (!revisionFileExists(revision, manifestPath)) {
    return "";
  }

  const rawManifest = readRevisionFile(revision, manifestPath);
  return parseManifestName(rawManifest, manifestPath);
}

function listWorkspacePackageNames(headSha) {
  const workspaceManifestPaths = listRevisionFiles(headSha, [
    "apps",
    "packages",
  ]).filter((filePath) =>
    /^(?:apps|packages)\/[^/]+\/package\.json$/.test(filePath),
  );

  const names = new Set();
  for (const manifestPath of workspaceManifestPaths) {
    const rawManifest = readRevisionFile(headSha, manifestPath);
    const manifestName = parseManifestName(rawManifest, manifestPath);
    if (manifestName) {
      names.add(manifestName);
    }
  }

  return names;
}

function workspaceDirForFile(filePath) {
  const [root, pkgName] = filePath.split("/");
  if (!pkgName) {
    return "";
  }

  const prefix = `${root}/`;
  if (!workspacePrefixes.includes(prefix)) {
    return "";
  }

  return `${root}/${pkgName}`;
}

function touchedWorkspacePackages(files, headSha) {
  const names = new Set();

  for (const filePath of files) {
    const pkgDir = workspaceDirForFile(filePath);
    if (!pkgDir) {
      continue;
    }

    const manifestName = readManifestNameAtRevision(headSha, pkgDir);
    if (manifestName) {
      names.add(manifestName);
    }
  }

  return names;
}

export function listChangedChangesetFiles(files) {
  return files.filter(isChangesetManifestMarkdown).sort();
}

export function isChangesetManifestMarkdown(filePath) {
  return (
    filePath.startsWith(".changeset/") &&
    filePath.endsWith(".md") &&
    filePath !== ".changeset/README.md"
  );
}

function listAllChangesetFiles(headSha) {
  return listRevisionFiles(headSha, [".changeset"])
    .filter(isChangesetManifestMarkdown)
    .sort();
}

export function parseChangesetFrontmatter(markdownContent, filePath) {
  const normalized = markdownContent.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r?\n/);

  if (lines.length === 0 || lines[0].trim() !== "---") {
    throw new Error(
      `[changeset-check] ${filePath}: missing opening frontmatter delimiter '---'.`,
    );
  }
  let closingDelimiter = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      closingDelimiter = i;
      break;
    }
  }

  if (closingDelimiter === -1) {
    throw new Error(
      `[changeset-check] ${filePath}: missing closing frontmatter delimiter '---'.`,
    );
  }

  const frontmatterLines = lines.slice(1, closingDelimiter);
  const packageNames = new Set();

  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const entryMatch = trimmed.match(
      /^(?:"([^"]+)"|'([^']+)'|([^"'\s][^:]*?))\s*:\s*(.+)\s*$/,
    );
    if (!entryMatch) {
      throw new Error(
        `[changeset-check] ${filePath}: invalid frontmatter entry "${trimmed}".`,
      );
    }

    const packageName =
      `${entryMatch[1] || entryMatch[2] || entryMatch[3] || ""}`.trim();
    const releaseType = `${entryMatch[4] || ""}`.trim();
    if (!packageName || !releaseType) {
      throw new Error(
        `[changeset-check] ${filePath}: invalid frontmatter entry "${trimmed}".`,
      );
    }
    packageNames.add(packageName);
  }

  if (packageNames.size === 0) {
    throw new Error(
      `[changeset-check] ${filePath}: frontmatter must declare at least one package.`,
    );
  }

  return packageNames;
}

function collectChangesetPackages(changesetFiles, headSha) {
  const names = new Set();
  const packageSources = new Map();

  for (const filePath of changesetFiles) {
    if (!revisionFileExists(headSha, filePath)) {
      continue;
    }

    const markdownContent = readRevisionFile(headSha, filePath);
    const parsedNames = parseChangesetFrontmatter(markdownContent, filePath);
    for (const packageName of parsedNames) {
      names.add(packageName);
      if (!packageSources.has(packageName)) {
        packageSources.set(packageName, new Set());
      }
      packageSources.get(packageName).add(filePath);
    }
  }

  return { names, packageSources };
}

export function findUnknownChangesetPackages(
  packageSources,
  workspacePackageNames,
) {
  const unknownPackages = [];

  for (const [packageName, sourceFilesSet] of packageSources.entries()) {
    if (workspacePackageNames.has(packageName)) {
      continue;
    }

    unknownPackages.push({
      packageName,
      sourceFiles: [...sourceFilesSet].sort(),
    });
  }

  return unknownPackages.sort((a, b) =>
    a.packageName.localeCompare(b.packageName),
  );
}

export function evaluateCoverage({
  changedFiles,
  changes,
  changedPackageNames,
  changesetPackageNames,
  exemptPackages,
  exemptLabel,
  hasExemptLabel,
}) {
  const changedPackageList = [...changedPackageNames].sort();
  const touchedAllowlistedPackages = changedPackageList.filter((name) =>
    exemptPackages.has(name),
  );

  if (hasExemptLabel && touchedAllowlistedPackages.length === 0) {
    const allowlist = [...exemptPackages].sort();
    return {
      decision: "fail_exempt_label_misuse",
      ok: false,
      missing: [],
      errors: [
        `[changeset-check] "${exemptLabel}" label is only valid for allowlisted packages: ${allowlist.length ? allowlist.join(", ") : "(none configured)"}`,
      ],
      infos: [],
    };
  }

  const missing = changedPackageList.filter(
    (name) => !changesetPackageNames.has(name),
  );

  if (missing.length > 0) {
    const nonAllowlistedMissing = missing.filter(
      (name) => !exemptPackages.has(name),
    );
    if (nonAllowlistedMissing.length > 0) {
      return {
        decision: "fail_missing_non_allowlisted",
        ok: false,
        missing,
        errors: [
          `[changeset-check] Missing changeset coverage for: ${nonAllowlistedMissing.join(", ")}`,
          `Changed files: ${changedFiles.join(", ")}`,
        ],
        infos: [],
      };
    }

    if (!hasExemptLabel) {
      return {
        decision: "fail_missing_allowlisted_without_label",
        ok: false,
        missing,
        errors: [
          `[changeset-check] Missing changeset coverage for allowlisted package(s): ${missing.join(", ")}`,
          `[changeset-check] Add a .changeset file or apply the "${exemptLabel}" PR label.`,
        ],
        infos: [],
      };
    }

    return {
      decision: "pass_allowlisted_with_label",
      ok: true,
      missing,
      errors: [],
      infos: [
        `[changeset-check] Exemption label "${exemptLabel}" accepted for allowlisted package(s): ${missing.join(", ")}`,
      ],
    };
  }

  if (changes.changedReleasableRootFiles && changedPackageList.length === 0) {
    return {
      decision: "pass_root_only_without_workspace_changes",
      ok: true,
      missing: [],
      errors: [],
      infos: [
        "[changeset-check] Releasable root-only changes detected without workspace package/app changes. Skipping changeset requirement.",
      ],
    };
  }

  return {
    decision: "pass_full_coverage",
    ok: true,
    missing: [],
    errors: [],
    infos: [],
  };
}

function resolveBaseAndHeadRefs() {
  const envBaseSha = (process.env.BASE_SHA || "").trim();
  const envHeadSha = (process.env.HEAD_SHA || "").trim();
  let baseSha = envBaseSha;
  let headSha = envHeadSha;

  if (!isValidRevision(headSha)) {
    try {
      headSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch {
      headSha = "";
    }
  }

  if (!isValidRevision(baseSha)) {
    try {
      baseSha = execSync("git merge-base origin/main HEAD", {
        encoding: "utf8",
      }).trim();
    } catch {
      baseSha = "";
    }
  }

  return { baseSha, headSha };
}

function listChangedFiles(baseSha, headSha) {
  const diffOutput = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
    encoding: "utf8",
  });

  return diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function runChangesetCoverageCheck() {
  const debugEnabled = process.env.CHANGESET_CHECK_DEBUG === "1";
  const exemptLabel = (
    process.env.CHANGESET_EXEMPT_LABEL || "changeset-exempt"
  ).trim();
  const exemptPackages = parseCsvSet(
    process.env.CHANGESET_EXEMPT_PACKAGES || "@fodmapp/mobile-prototype",
  );
  const prLabels = readPrLabels();
  const hasExemptLabel = Boolean(exemptLabel) && prLabels.has(exemptLabel);
  const prAuthorLogin = normalizeLogin(
    process.env.PR_AUTHOR_LOGIN || process.env.GITHUB_ACTOR || "",
  );
  const dependabotAuthor = isDependabotAuthor(prAuthorLogin);

  const { baseSha, headSha } = resolveBaseAndHeadRefs();
  if (
    !baseSha ||
    !headSha ||
    !isValidRevision(baseSha) ||
    !isValidRevision(headSha)
  ) {
    failLine(
      "[changeset-check] Unable to resolve required git refs for changeset validation.",
    );
    return 1;
  }

  try {
    const changedFiles = listChangedFiles(baseSha, headSha);

    const changes = hasWorkspaceOrReleasableChanges(changedFiles);
    debugLine(debugEnabled, `base_sha=${baseSha}`);
    debugLine(debugEnabled, `head_sha=${headSha}`);

    if (!changes.shouldCheck) {
      debugLine(debugEnabled, "changed_packages=(none)");
      debugLine(debugEnabled, "changed_changeset_files=(none)");
      debugLine(debugEnabled, "changeset_packages=(none)");
      debugLine(debugEnabled, "unknown_changeset_packages=(none)");
      debugLine(debugEnabled, "missing_packages=(none)");
      debugLine(debugEnabled, "decision=skip_no_releasable_changes");
      logLine(
        "[changeset-check] No workspace or releasable root changes detected. Skipping.",
      );
      return 0;
    }

    const dependencyOnly = isDependencyOnlyChange(changedFiles);
    debugLine(debugEnabled, `pr_author_login=${prAuthorLogin || "(unknown)"}`);
    debugLine(debugEnabled, `is_dependabot_author=${dependabotAuthor}`);
    debugLine(debugEnabled, `dependency_only_change=${dependencyOnly}`);
    if (dependabotAuthor && dependencyOnly) {
      debugLine(debugEnabled, "decision=pass_dependabot_dependency_only");
      logLine(
        "[changeset-check] Dependabot dependency-only PR detected. Changeset requirement auto-exempted.",
      );
      return 0;
    }

    const workspacePackageNames = listWorkspacePackageNames(headSha);
    const changedPackageNames = touchedWorkspacePackages(changedFiles, headSha);
    const changedChangesetFiles = listChangedChangesetFiles(changedFiles);
    const changesetPackages = collectChangesetPackages(
      changedChangesetFiles,
      headSha,
    );
    const changesetPackageNames = changesetPackages.names;
    const unknownChangesetPackages = findUnknownChangesetPackages(
      changesetPackages.packageSources,
      workspacePackageNames,
    );

    const result = evaluateCoverage({
      changedFiles,
      changes,
      changedPackageNames,
      changesetPackageNames,
      exemptPackages,
      exemptLabel,
      hasExemptLabel,
    });

    debugLine(
      debugEnabled,
      `changed_packages=${[...changedPackageNames].sort().join(", ") || "(none)"}`,
    );
    debugLine(
      debugEnabled,
      `changed_changeset_files=${changedChangesetFiles.join(", ") || "(none)"}`,
    );
    debugLine(
      debugEnabled,
      `workspace_package_count=${workspacePackageNames.size}`,
    );
    debugLine(
      debugEnabled,
      `changeset_packages=${[...changesetPackageNames].sort().join(", ") || "(none)"}`,
    );
    debugLine(
      debugEnabled,
      `unknown_changeset_packages=${unknownChangesetPackages.map((entry) => entry.packageName).join(", ") || "(none)"}`,
    );
    debugLine(
      debugEnabled,
      `missing_packages=${result.missing.join(", ") || "(none)"}`,
    );

    if (unknownChangesetPackages.length > 0) {
      failLine(
        `[changeset-check] Unknown package(s) in changed .changeset frontmatter: ${unknownChangesetPackages.map((entry) => entry.packageName).join(", ")}`,
      );
      for (const entry of unknownChangesetPackages) {
        failLine(
          `[changeset-check] ${entry.packageName} declared in: ${entry.sourceFiles.join(", ")}`,
        );
      }
      debugLine(debugEnabled, "decision=fail_unknown_changeset_packages");
      return 1;
    }

    debugLine(debugEnabled, `decision=${result.decision || "(unspecified)"}`);
    for (const message of result.infos) {
      logLine(message);
    }
    if (!result.ok) {
      for (const message of result.errors) {
        failLine(message);
      }
      return 1;
    }

    logLine("[changeset-check] Changeset coverage looks valid.");
    return 0;
  } catch (error) {
    failLine(`[changeset-check] ${error.message || "Command failed"}`);
    return 1;
  }
}

export function runChangesetFullLint() {
  const debugEnabled = process.env.CHANGESET_CHECK_DEBUG === "1";
  const { headSha } = resolveBaseAndHeadRefs();
  if (!headSha || !isValidRevision(headSha)) {
    failLine(
      "[changeset-check] Unable to resolve required git refs for changeset validation.",
    );
    return 1;
  }

  try {
    const workspacePackageNames = listWorkspacePackageNames(headSha);
    const allChangesetFiles = listAllChangesetFiles(headSha);
    const changesetPackages = collectChangesetPackages(
      allChangesetFiles,
      headSha,
    );
    const unknownChangesetPackages = findUnknownChangesetPackages(
      changesetPackages.packageSources,
      workspacePackageNames,
    );

    debugLine(debugEnabled, "mode=all");
    debugLine(debugEnabled, `head_sha=${headSha}`);
    debugLine(
      debugEnabled,
      `all_changeset_files=${allChangesetFiles.join(", ") || "(none)"}`,
    );
    debugLine(
      debugEnabled,
      `workspace_package_count=${workspacePackageNames.size}`,
    );
    debugLine(
      debugEnabled,
      `changeset_packages=${[...changesetPackages.names].sort().join(", ") || "(none)"}`,
    );
    debugLine(
      debugEnabled,
      `unknown_changeset_packages=${unknownChangesetPackages.map((entry) => entry.packageName).join(", ") || "(none)"}`,
    );

    if (unknownChangesetPackages.length > 0) {
      failLine(
        `[changeset-check] Unknown package(s) in .changeset frontmatter: ${unknownChangesetPackages.map((entry) => entry.packageName).join(", ")}`,
      );
      for (const entry of unknownChangesetPackages) {
        failLine(
          `[changeset-check] ${entry.packageName} declared in: ${entry.sourceFiles.join(", ")}`,
        );
      }
      debugLine(debugEnabled, "decision=fail_unknown_changeset_packages");
      return 1;
    }

    logLine("[changeset-check] Full changeset lint looks valid.");
    return 0;
  } catch (error) {
    failLine(`[changeset-check] ${error.message || "Command failed"}`);
    return 1;
  }
}

export function parseModeFromArgs(argv) {
  if (argv.length === 0) {
    return "coverage";
  }
  if (argv.length === 1 && argv[0] === "--all") {
    return "all";
  }
  failLine(`[changeset-check] unsupported arguments: ${argv.join(" ")}`);
  failLine("Usage: node .github/scripts/check-pr-changesets.mjs [--all]");
  return null;
}

function main() {
  const mode = parseModeFromArgs(process.argv.slice(2));
  if (!mode) {
    process.exit(2);
  }
  const exitCode =
    mode === "all" ? runChangesetFullLint() : runChangesetCoverageCheck();
  process.exit(exitCode);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
