#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

function logLine(message) {
  process.stdout.write(`${message}\n`);
}

function failLine(message) {
  process.stderr.write(`${message}\n`);
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

function isValidRevision(revision) {
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

const envBaseSha = (process.env.BASE_SHA || "").trim();
const envHeadSha = (process.env.HEAD_SHA || "").trim();
const exemptLabel = (
  process.env.CHANGESET_EXEMPT_LABEL || "changeset-exempt"
).trim();
const exemptPackages = parseCsvSet(
  process.env.CHANGESET_EXEMPT_PACKAGES || "@fodmap/mobile-prototype",
);
const exemptPackageList = [...exemptPackages].sort();
const prLabels = readPrLabels();
const hasExemptLabel = Boolean(exemptLabel) && prLabels.has(exemptLabel);

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

if (
  !baseSha ||
  !headSha ||
  !isValidRevision(baseSha) ||
  !isValidRevision(headSha)
) {
  failLine(
    "[changeset-check] Unable to resolve required git refs for changeset validation.",
  );
  process.exit(1);
}

function hasWorkspaceOrReleasableChanges(files) {
  const releasableRootFiles = new Set([
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "turbo.json",
  ]);

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

function touchedWorkspacePackages(files) {
  const workspacePrefixes = ["packages/", "apps/"];
  const names = new Set();

  files.forEach((file) => {
    const [root, pkgName] = file.split("/");
    if (pkgName && workspacePrefixes.includes(`${root}/`)) {
      const pkgDir = `${root}/${pkgName}`;
      const manifestPath = path.join(process.cwd(), pkgDir, "package.json");
      if (!existsSync(manifestPath)) {
        return;
      }

      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (manifest.name) {
        names.add(manifest.name);
      }
    }
  });

  return names;
}

function isNoChangesetOutput(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes("no changesets") ||
    lower.includes("no packages to be bumped") ||
    lower.includes("no packages to bump") ||
    lower.includes("there are no changesets") ||
    lower.includes("nothing to release")
  );
}

function parseStatusOutput(sinceSha) {
  const statusPath = ".changeset-status.json";
  const command = `pnpm changeset status --since=${sinceSha} --output=${statusPath}`;
  let diagnostic = "";

  try {
    execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    diagnostic = `${err.stdout || ""}\n${err.stderr || ""}`;

    if (isNoChangesetOutput(diagnostic)) {
      if (existsSync(statusPath)) {
        rmSync(statusPath, { force: true });
      }
      return { changesets: [], releases: [] };
    }

    if (!existsSync(statusPath)) {
      throw new Error(
        `Failed to run \`pnpm changeset status\` and no JSON output was produced.\n${diagnostic}`.trim(),
      );
    }
  }

  if (!existsSync(statusPath)) {
    throw new Error(
      "Failed to run `pnpm changeset status` and no JSON output was produced.",
    );
  }

  let payload;
  try {
    payload = JSON.parse(readFileSync(statusPath, "utf8"));
  } catch {
    throw new Error(`Unable to parse changeset status JSON at ${statusPath}`);
  } finally {
    rmSync(statusPath, { force: true });
  }

  return payload;
}

try {
  const diffOutput = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
    encoding: "utf8",
  });
  const changedFiles = diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const changes = hasWorkspaceOrReleasableChanges(changedFiles);

  if (!changes.shouldCheck) {
    logLine(
      "[changeset-check] No workspace or releasable root changes detected. Skipping.",
    );
    process.exit(0);
  }

  const status = parseStatusOutput(baseSha);
  const releases = Array.isArray(status?.releases) ? status.releases : [];
  const releasePackages = new Set(
    releases
      .flatMap((entry) => {
        const names = [];
        if (entry.name) {
          names.push(entry.name);
        }
        if (entry.packageName) {
          names.push(entry.packageName);
        }
        if (entry.pkgName) {
          names.push(entry.pkgName);
        }
        if (entry.pkgDir && entry.pkgDir.startsWith("packages/")) {
          const manifestPath = path.join(
            process.cwd(),
            entry.pkgDir,
            "package.json",
          );
          if (existsSync(manifestPath)) {
            const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
            if (manifest.name) {
              names.push(manifest.name);
            }
          }
        }
        if (entry.package && entry.package.name) {
          names.push(entry.package.name);
        }
        return names;
      })
      .filter(Boolean),
  );

  const changedPackageNames = touchedWorkspacePackages(changedFiles);
  const changedPackageList = [...changedPackageNames].sort();
  const touchedAllowlistedPackages = changedPackageList.filter((name) =>
    exemptPackages.has(name),
  );

  if (hasExemptLabel && touchedAllowlistedPackages.length === 0) {
    const allowlist = exemptPackageList.length
      ? exemptPackageList.join(", ")
      : "(none configured)";
    failLine(
      `[changeset-check] "${exemptLabel}" label is only valid for allowlisted packages: ${allowlist}`,
    );
    process.exit(1);
  }

  if (changedPackageNames.size > 0) {
    const missing = changedPackageList.filter(
      (name) => !releasePackages.has(name),
    );

    if (missing.length > 0) {
      const nonAllowlistedMissing = missing.filter(
        (name) => !exemptPackages.has(name),
      );
      if (nonAllowlistedMissing.length > 0) {
        failLine(
          `[changeset-check] Missing changeset coverage for: ${nonAllowlistedMissing.join(", ")}`,
        );
        failLine(`Changed files: ${changedFiles.join(", ")}`);
        process.exit(1);
      }

      if (!hasExemptLabel) {
        failLine(
          `[changeset-check] Missing changeset coverage for allowlisted package(s): ${missing.join(", ")}`,
        );
        failLine(
          `[changeset-check] Add a .changeset file or apply the "${exemptLabel}" PR label.`,
        );
        process.exit(1);
      }

      logLine(
        `[changeset-check] Exemption label "${exemptLabel}" accepted for allowlisted package(s): ${missing.join(", ")}`,
      );
    }
  }

  if (!releases.length) {
    const onlyAllowlistedPackagesChanged =
      changedPackageList.length > 0 &&
      changedPackageList.every((name) => exemptPackages.has(name));
    const canSkipChangeset =
      changes.changedPackagesOrApps &&
      onlyAllowlistedPackagesChanged &&
      hasExemptLabel;

    if (!canSkipChangeset) {
      failLine(
        "[changeset-check] No pending releases found. Add a .changeset file for changed package/app paths.",
      );
      process.exit(1);
    }
  }

  logLine("[changeset-check] Changeset coverage looks valid.");
  process.exit(0);
} catch (error) {
  failLine(`[changeset-check] ${error.message || "Command failed"}`);
  process.exit(1);
}
