#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const requiredBase = process.env.BASE_SHA;
const requiredHead = process.env.HEAD_SHA;

if (!requiredBase || !requiredHead) {
  console.error('[changeset-check] Missing BASE_SHA or HEAD_SHA environment variables.');
  process.exit(1);
}

const baseSha = requiredBase.trim();
const headSha = requiredHead.trim();

function hasWorkspaceOrReleasableChanges(files) {
  const releasableRootFiles = new Set(['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'turbo.json']);

  const changedPackagesOrApps = files.some((file) => file.startsWith('packages/') || file.startsWith('apps/'));
  const changedReleasableRootFiles = files.some((file) => releasableRootFiles.has(file));

  return {
    shouldCheck: changedPackagesOrApps || changedReleasableRootFiles,
    changedPackagesOrApps,
    changedReleasableRootFiles,
  };
}

function touchedWorkspacePackages(files) {
  const workspacePrefixes = ['packages/', 'apps/'];
  const names = new Set();

  files.forEach((file) => {
    const [root, pkgName] = file.split('/');
    if (pkgName && workspacePrefixes.includes(`${root}/`)) {
      const pkgDir = `${root}/${pkgName}`;
      const manifestPath = path.join(process.cwd(), pkgDir, 'package.json');
      if (!existsSync(manifestPath)) {
        return;
      }

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.name) {
        names.add(manifest.name);
      }
    }
  });

  return names;
}

function parseStatusOutput(sinceSha) {
  const statusPath = path.join(process.cwd(), '.changeset-status.json');

  let output = '';
  try {
    output = execSync(`pnpm changeset status --since=${sinceSha} --output=${statusPath}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    const diagnostic = `${err.stdout || ''}\n${err.stderr || ''}`;

    if (/No packages to be bumped|\bNo changesets\b/i.test(diagnostic)) {
      return { changesets: [], releases: [] };
    }

    if (!existsSync(statusPath)) {
      throw new Error('Failed to run `pnpm changeset status` and no JSON output was produced.');
    }
  }

  if (!existsSync(statusPath)) {
    return { changesets: [], releases: [] };
  }

  let payload;
  try {
    payload = JSON.parse(readFileSync(statusPath, 'utf8'));
  } catch (err) {
    throw new Error(`Unable to parse changeset status JSON at ${statusPath}`);
  } finally {
    rmSync(statusPath, { force: true });
  }

  return payload;
}

try {
  const diffOutput = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
    encoding: 'utf8',
  });
  const changedFiles = diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const changes = hasWorkspaceOrReleasableChanges(changedFiles);

  if (!changes.shouldCheck) {
    console.log('[changeset-check] No workspace or releasable root changes detected. Skipping.');
    process.exit(0);
  }

  const status = parseStatusOutput(baseSha);
  const releases = Array.isArray(status?.releases) ? status.releases : [];

  if (!releases.length) {
    writeFileSync(1, '[changeset-check] No pending releases found. Add a .changeset file for changed package/app paths.\n');
    process.exit(1);
  }

  const releasePackages = new Set(
    releases
      .flatMap((entry) => {
        const names = [];
        if (entry.name) names.push(entry.name);
        if (entry.packageName) names.push(entry.packageName);
        if (entry.pkgName) names.push(entry.pkgName);
        if (entry.pkgDir && entry.pkgDir.startsWith('packages/')) {
          const manifestPath = path.join(process.cwd(), entry.pkgDir, 'package.json');
          if (existsSync(manifestPath)) {
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            if (manifest.name) {
              names.push(manifest.name);
            }
          }
        }
        if (entry.package && entry.package.name) names.push(entry.package.name);
        return names;
      })
      .filter(Boolean),
  );

  const changedPackageNames = touchedWorkspacePackages(changedFiles);

  if (changedPackageNames.size > 0) {
    const missing = [...changedPackageNames].filter((name) => !releasePackages.has(name));

    if (missing.length > 0) {
      writeFileSync(
        1,
        `[changeset-check] Missing changeset coverage for: ${missing.join(', ')}\nChanged files: ${changedFiles.join(', ')}\n`,
      );
      process.exit(1);
    }
  }

  console.log('[changeset-check] Changeset coverage looks valid.');
  process.exit(0);
} catch (error) {
  console.error(`[changeset-check] ${error.message || 'Command failed'}`);
  process.exit(1);
}
