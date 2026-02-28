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

function readManifestNameAtRevision(revision, pkgDir) {
  const manifestPath = `${pkgDir}/package.json`;
  if (!revisionFileExists(revision, manifestPath)) {
    return "";
  }

  const rawManifest = readRevisionFile(revision, manifestPath);
  return parseManifestName(rawManifest, manifestPath);
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
  return files
    .filter(
      (filePath) =>
        filePath.startsWith(".changeset/") && filePath.endsWith(".md"),
    )
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

function collectChangesetPackageNames(changesetFiles, headSha) {
  const names = new Set();

  for (const filePath of changesetFiles) {
    if (!revisionFileExists(headSha, filePath)) {
      continue;
    }

    const markdownContent = readRevisionFile(headSha, filePath);
    const parsedNames = parseChangesetFrontmatter(markdownContent, filePath);
    for (const packageName of parsedNames) {
      names.add(packageName);
    }
  }

  return names;
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
      ok: true,
      missing,
      errors: [],
      infos: [
        `[changeset-check] Exemption label "${exemptLabel}" accepted for allowlisted package(s): ${missing.join(", ")}`,
      ],
    };
  }

  if (
    changes.changedReleasableRootFiles &&
    changedPackageList.length === 0 &&
    changesetPackageNames.size === 0
  ) {
    return {
      ok: false,
      missing: [],
      errors: [
        "[changeset-check] No pending releases found. Add a .changeset file for changed package/app paths.",
      ],
      infos: [],
    };
  }

  return {
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
    process.env.CHANGESET_EXEMPT_PACKAGES || "@fodmap/mobile-prototype",
  );
  const prLabels = readPrLabels();
  const hasExemptLabel = Boolean(exemptLabel) && prLabels.has(exemptLabel);

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
      debugLine(debugEnabled, "missing_packages=(none)");
      logLine(
        "[changeset-check] No workspace or releasable root changes detected. Skipping.",
      );
      return 0;
    }

    const changedPackageNames = touchedWorkspacePackages(changedFiles, headSha);
    const changedChangesetFiles = listChangedChangesetFiles(changedFiles);
    const changesetPackageNames = collectChangesetPackageNames(
      changedChangesetFiles,
      headSha,
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
      `changeset_packages=${[...changesetPackageNames].sort().join(", ") || "(none)"}`,
    );
    debugLine(
      debugEnabled,
      `missing_packages=${result.missing.join(", ") || "(none)"}`,
    );

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

function main() {
  const exitCode = runChangesetCoverageCheck();
  process.exit(exitCode);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
