#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const allowedStatusValues = new Set([
  "Implemented",
  "Accepted",
  "In progress",
  "Planned",
  "Archived",
]);

export const retiredPathReplacements = new Map([
  [
    "docs/transition/current-state-snapshot.md",
    "docs/transition/current-state.md",
  ],
  ["docs/transition/worktree-playbook.md", "docs/ops/worktree-playbook.md"],
  [
    "docs/transition/architecture-scaffolding-sprint-plan.md",
    "docs/archive/transition/architecture-scaffolding-sprint-plan.md",
  ],
  [
    "docs/transition/pr4-runtime-integrations-plan.md",
    "docs/archive/transition/pr4-runtime-integrations-plan.md",
  ],
  [
    "docs/transition/sprint-planning-handoff.md",
    "docs/archive/transition/sprint-planning-handoff.md",
  ],
  [
    "docs/transition/discussion-history.md",
    "docs/archive/transition/discussion-history.md",
  ],
  [
    "docs/transition/eslint-next-phase-plan.md",
    "docs/archive/transition/eslint-next-phase-plan.md",
  ],
  [
    "docs/transition/pr-sequence-and-gates.md",
    "docs/archive/transition/pr-sequence-and-gates.md",
  ],
]);

export const metadataManagedDocs = new Set([
  "CONTRIBUTING.md",
  "api/README.md",
  "apps/app/README.md",
  "docs/foundation/project-definition.md",
  "docs/foundation/documentation-personas.md",
  "docs/architecture/boundaries-and-contracts.md",
  "docs/architecture/decision-register.md",
  "docs/ops/ci-workflow-hardening.md",
  "etl/phase2/POD_WAVES_RUNBOOK.md",
  "etl/phase3/PRODUCT_LAYER_RUNBOOK.md",
]);

export const requiredMetadataFields = [
  "Status:",
  "Audience:",
  "Scope:",
  "Related docs:",
  "Last reviewed:",
];

export const categoryOrder = [
  "broken_link",
  "broken_anchor",
  "retired_path_reference",
  "status_vocabulary",
  "missing_metadata",
  "archive_mismatch",
  "worktree_status_stale",
];

function decodeSafely(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeRepoPath(filePath) {
  return `${filePath || ""}`
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

export function isArchivePath(filePath) {
  return normalizeRepoPath(filePath).startsWith("docs/archive/");
}

function isMarkdownPath(filePath) {
  return /\.(md|mdx)$/i.test(filePath);
}

function stripInlineCode(line) {
  return line.replace(/`[^`]*`/g, (segment) => " ".repeat(segment.length));
}

function parseFenceMarker(line) {
  const match = line.trimStart().match(/^(`{3,}|~{3,})/);
  return match ? match[1][0] : "";
}

export function collectMarkdownLinks(content) {
  const lines = content.split(/\r?\n/);
  const links = [];
  let activeFence = "";

  for (const [index, line] of lines.entries()) {
    const fenceMarker = parseFenceMarker(line);
    if (fenceMarker) {
      if (!activeFence) {
        activeFence = fenceMarker;
      } else if (activeFence === fenceMarker) {
        activeFence = "";
      }
      continue;
    }

    if (activeFence) {
      continue;
    }

    const scrubbed = stripInlineCode(line);
    const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(scrubbed)) !== null) {
      links.push({
        line: index + 1,
        rawTarget: match[1].trim(),
      });
    }
  }

  return links;
}

function isExternalTarget(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target);
}

export function parseLocalLinkTarget(rawTarget) {
  let target = `${rawTarget || ""}`.trim();
  if (!target) {
    return null;
  }

  if (target.startsWith("<")) {
    const closeIndex = target.indexOf(">");
    if (closeIndex !== -1) {
      target = target.slice(1, closeIndex).trim();
    }
  } else {
    const firstToken = target.match(/^(\S+)/)?.[1];
    if (!firstToken) {
      return null;
    }
    target = firstToken;
  }

  if (!target || isExternalTarget(target) || target.startsWith("#")) {
    return null;
  }

  const hashIndex = target.indexOf("#");
  const pathPart =
    hashIndex === -1 ? target : target.slice(0, Math.max(hashIndex, 0));
  const fragment =
    hashIndex === -1 ? "" : target.slice(Math.max(hashIndex + 1, 0));

  return {
    target,
    pathPart: decodeSafely(pathPart),
    fragment: decodeSafely(fragment),
  };
}

export function resolveLocalTarget(repoPath, sourceFile, linkPath) {
  const normalizedSource = normalizeRepoPath(sourceFile);
  const repoRelative = linkPath.startsWith("/")
    ? normalizeRepoPath(linkPath)
    : normalizeRepoPath(
        path.posix.join(path.posix.dirname(normalizedSource), linkPath),
      );

  return {
    repoRelative,
    absolutePath: path.resolve(repoPath, repoRelative),
  };
}

function cleanHeadingText(text) {
  const withoutTrailingHashes = text.replace(/\s+#+\s*$/, "");
  let withoutHtml = "";
  let insideTag = false;

  for (const character of withoutTrailingHashes) {
    if (character === "<") {
      insideTag = true;
      continue;
    }

    if (character === ">") {
      insideTag = false;
      continue;
    }

    if (!insideTag) {
      withoutHtml += character;
    }
  }

  return withoutHtml;
}

function normalizeHeadingText(text) {
  return cleanHeadingText(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .trim();
}

export function slugifyHeading(text) {
  const cleaned = normalizeHeadingText(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return cleaned;
}

export function collectGitHubAnchors(content) {
  const lines = content.split(/\r?\n/);
  const anchors = new Set();
  const counts = new Map();
  let activeFence = "";

  for (const line of lines) {
    const fenceMarker = parseFenceMarker(line);
    if (fenceMarker) {
      if (!activeFence) {
        activeFence = fenceMarker;
      } else if (activeFence === fenceMarker) {
        activeFence = "";
      }
      continue;
    }

    if (activeFence) {
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!headingMatch) {
      continue;
    }

    const baseSlug = slugifyHeading(headingMatch[2]);
    if (!baseSlug) {
      continue;
    }

    const duplicateCount = counts.get(baseSlug) || 0;
    const slug =
      duplicateCount === 0 ? baseSlug : `${baseSlug}-${duplicateCount}`;
    counts.set(baseSlug, duplicateCount + 1);
    anchors.add(slug);
  }

  return anchors;
}

function getHeaderWindowLines(content, maxLines = 25) {
  const lines = content.split(/\r?\n/);
  const window = [];

  for (const line of lines.slice(0, maxLines)) {
    if (/^##\s+/.test(line)) {
      break;
    }
    window.push(line);
  }

  return window;
}

export function findHeaderField(content, fieldName) {
  const headerLines = getHeaderWindowLines(content);

  for (const [index, line] of headerLines.entries()) {
    if (line.startsWith(fieldName)) {
      return {
        line: index + 1,
        value: line.slice(fieldName.length).trim(),
      };
    }
  }

  return null;
}

function compareFindings(left, right) {
  const leftCategory = categoryOrder.indexOf(left.category);
  const rightCategory = categoryOrder.indexOf(right.category);
  if (leftCategory !== rightCategory) {
    return leftCategory - rightCategory;
  }

  const leftFile = left.file || "";
  const rightFile = right.file || "";
  if (leftFile !== rightFile) {
    return leftFile.localeCompare(rightFile);
  }

  const leftLine = left.line || 0;
  const rightLine = right.line || 0;
  if (leftLine !== rightLine) {
    return leftLine - rightLine;
  }

  return left.message.localeCompare(right.message);
}

function makeFinding(category, file, message, extra = {}) {
  return {
    category,
    file,
    message,
    ...extra,
  };
}

function formatLocation(finding) {
  if (!finding.file) {
    return "";
  }

  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
}

function checkRetiredPathReferences(filePath, content) {
  if (isArchivePath(filePath)) {
    return [];
  }

  const findings = [];
  for (const [
    retiredPath,
    replacementPath,
  ] of retiredPathReplacements.entries()) {
    if (!content.includes(retiredPath)) {
      continue;
    }

    findings.push(
      makeFinding(
        "retired_path_reference",
        filePath,
        `References retired path \`${retiredPath}\`. Use \`${replacementPath}\` instead.`,
        {
          target: retiredPath,
          replacement: replacementPath,
        },
      ),
    );
  }

  return findings;
}

function checkStatusVocabulary(filePath, content) {
  if (isArchivePath(filePath)) {
    return [];
  }

  const statusField = findHeaderField(content, "Status:");
  if (!statusField || allowedStatusValues.has(statusField.value)) {
    return [];
  }

  return [
    makeFinding(
      "status_vocabulary",
      filePath,
      `Status must use the docs status vocabulary. Found \`${statusField.value}\`.`,
      {
        line: statusField.line,
      },
    ),
  ];
}

function checkMissingMetadata(filePath, content) {
  if (!metadataManagedDocs.has(normalizeRepoPath(filePath))) {
    return [];
  }

  const missingFields = requiredMetadataFields.filter(
    (field) => !findHeaderField(content, field),
  );

  if (missingFields.length === 0) {
    return [];
  }

  return [
    makeFinding(
      "missing_metadata",
      filePath,
      `Missing metadata field(s): ${missingFields.join(", ")}.`,
    ),
  ];
}

function checkArchiveMismatch(filePath, content) {
  if (isArchivePath(filePath)) {
    if (!content.includes("Canonical active source")) {
      return [];
    }

    return [
      makeFinding(
        "archive_mismatch",
        filePath,
        "Archive doc still references an active mirror via `Canonical active source`.",
      ),
    ];
  }

  const statusField = findHeaderField(content, "Status:");
  if (!statusField || !/^archived\b/i.test(statusField.value)) {
    return [];
  }

  return [
    makeFinding(
      "archive_mismatch",
      filePath,
      "Active-path doc declares archived status.",
      {
        line: statusField.line,
      },
    ),
  ];
}

function checkLocalLinks(filePath, content, context) {
  const findings = [];
  const sourcePath = normalizeRepoPath(filePath);

  for (const link of collectMarkdownLinks(content)) {
    const parsedTarget = parseLocalLinkTarget(link.rawTarget);
    if (!parsedTarget) {
      continue;
    }

    const resolvedTarget = resolveLocalTarget(
      context.repoPath,
      sourcePath,
      parsedTarget.pathPart,
    );

    if (!existsSync(resolvedTarget.absolutePath)) {
      findings.push(
        makeFinding(
          "broken_link",
          sourcePath,
          `Local link target \`${parsedTarget.target}\` does not exist.`,
          {
            line: link.line,
            target: resolvedTarget.repoRelative,
          },
        ),
      );
      continue;
    }

    if (
      !parsedTarget.fragment ||
      !isMarkdownPath(resolvedTarget.repoRelative) ||
      !statSync(resolvedTarget.absolutePath).isFile()
    ) {
      continue;
    }

    if (!context.anchorCache.has(resolvedTarget.repoRelative)) {
      const targetContent = readFileSync(resolvedTarget.absolutePath, "utf8");
      context.anchorCache.set(
        resolvedTarget.repoRelative,
        collectGitHubAnchors(targetContent),
      );
    }

    const anchors = context.anchorCache.get(resolvedTarget.repoRelative);
    if (anchors?.has(parsedTarget.fragment)) {
      continue;
    }

    findings.push(
      makeFinding(
        "broken_anchor",
        sourcePath,
        `Anchor \`#${parsedTarget.fragment}\` does not exist in \`${resolvedTarget.repoRelative}\`.`,
        {
          line: link.line,
          target: resolvedTarget.repoRelative,
        },
      ),
    );
  }

  return findings;
}

export function parseCurrentInventoryRows(content) {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(
    (line) => line.trim() === "## Current Inventory",
  );
  if (startIndex === -1) {
    return [];
  }

  const rows = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^##\s+/.test(line)) {
      break;
    }

    if (!line.trim().startsWith("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (
      cells.length !== 5 ||
      (cells[0] === "Worktree path" && cells[1] === "Branch") ||
      cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")))
    ) {
      continue;
    }

    const normalizeCell = (value) =>
      value.replace(/^`/, "").replace(/`$/, "").trim();

    rows.push({
      line: index + 1,
      worktreePath: normalizeCell(cells[0]),
      branch: normalizeCell(cells[1]),
      status: normalizeCell(cells[2]),
      scope: normalizeCell(cells[3]),
      notes: normalizeCell(cells[4]),
    });
  }

  return rows;
}

export function analyzeWorktreeStatus(content, remoteBranchExists) {
  const findings = [];
  const rows = parseCurrentInventoryRows(content);

  const duplicatePathRows = new Map();
  const duplicateBranchRows = new Map();

  for (const row of rows) {
    if (!duplicatePathRows.has(row.worktreePath)) {
      duplicatePathRows.set(row.worktreePath, []);
    }
    duplicatePathRows.get(row.worktreePath).push(row);

    if (!duplicateBranchRows.has(row.branch)) {
      duplicateBranchRows.set(row.branch, []);
    }
    duplicateBranchRows.get(row.branch).push(row);

    if (row.notes.includes("pending local removal")) {
      findings.push(
        makeFinding(
          "worktree_status_stale",
          "docs/ops/worktree-status.md",
          `Merged or cleaned worktree row still says \`pending local removal\` for \`${row.branch}\`.`,
          {
            line: row.line,
          },
        ),
      );
    }
  }

  for (const [worktreePath, pathRows] of duplicatePathRows.entries()) {
    if (pathRows.length < 2) {
      continue;
    }

    for (const row of pathRows) {
      findings.push(
        makeFinding(
          "worktree_status_stale",
          "docs/ops/worktree-status.md",
          `Duplicate worktree path in current inventory: \`${worktreePath}\`.`,
          {
            line: row.line,
          },
        ),
      );
    }
  }

  for (const [branch, branchRows] of duplicateBranchRows.entries()) {
    if (branchRows.length < 2) {
      continue;
    }

    for (const row of branchRows) {
      findings.push(
        makeFinding(
          "worktree_status_stale",
          "docs/ops/worktree-status.md",
          `Duplicate branch in current inventory: \`${branch}\`.`,
          {
            line: row.line,
          },
        ),
      );
    }
  }

  const remoteCache = new Map();
  for (const row of rows) {
    if (
      !row.status.toLowerCase().includes("merged") ||
      !row.branch.startsWith("codex/")
    ) {
      continue;
    }

    let exists = remoteCache.get(row.branch);
    if (exists === undefined) {
      try {
        exists = remoteBranchExists(row.branch);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        findings.push(
          makeFinding(
            "worktree_status_stale",
            "docs/ops/worktree-status.md",
            `Unable to verify remote cleanup for \`${row.branch}\`: ${message}`,
            {
              line: row.line,
            },
          ),
        );
        remoteCache.set(row.branch, false);
        continue;
      }
      remoteCache.set(row.branch, exists);
    }

    if (!exists) {
      continue;
    }

    findings.push(
      makeFinding(
        "worktree_status_stale",
        "docs/ops/worktree-status.md",
        `Merged branch \`${row.branch}\` still exists on origin.`,
        {
          line: row.line,
        },
      ),
    );
  }

  return findings;
}

export function analyzeTrackedMarkdown({
  repoPath,
  filePaths,
  readFile = (filePath) =>
    readFileSync(path.resolve(repoPath, normalizeRepoPath(filePath)), "utf8"),
  remoteBranchExists = createRemoteBranchExists(repoPath),
}) {
  const normalizedFiles = filePaths
    .map((filePath) => normalizeRepoPath(filePath))
    .sort((left, right) => left.localeCompare(right));
  const findings = [];
  const anchorCache = new Map();
  const context = {
    repoPath,
    anchorCache,
  };

  for (const filePath of normalizedFiles) {
    const content = readFile(filePath);
    findings.push(...checkLocalLinks(filePath, content, context));
    findings.push(...checkRetiredPathReferences(filePath, content));
    findings.push(...checkStatusVocabulary(filePath, content));
    findings.push(...checkMissingMetadata(filePath, content));
    findings.push(...checkArchiveMismatch(filePath, content));

    if (filePath === "docs/ops/worktree-status.md") {
      findings.push(...analyzeWorktreeStatus(content, remoteBranchExists));
    }
  }

  findings.sort(compareFindings);

  const categoryCounts = Object.fromEntries(
    categoryOrder.map((category) => [category, 0]),
  );
  for (const finding of findings) {
    categoryCounts[finding.category] += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    repoPath,
    scannedFiles: normalizedFiles,
    scannedFilesCount: normalizedFiles.length,
    findingsCount: findings.length,
    categoryCounts,
    findings,
  };
}

function createRemoteBranchExists(repoPath) {
  let branchCache = null;

  return (branch) => {
    if (branchCache === null) {
      const output = execFileSync(
        "git",
        ["-C", repoPath, "ls-remote", "--heads", "origin", "codex/*"],
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      branchCache = new Set(
        output
          .split("\n")
          .map((line) => line.trim().split(/\s+/)[1] || "")
          .filter(Boolean)
          .map((ref) => ref.replace(/^refs\/heads\//, "")),
      );
    }

    return branchCache.has(branch);
  };
}

export function formatMarkdownReport(report) {
  const lines = [
    "# Docs Hygiene Audit Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Tracked markdown files scanned: ${report.scannedFilesCount}`,
    `Findings: ${report.findingsCount}`,
    "",
    "## Category Summary",
    "",
    "| Category | Count |",
    "| --- | ---: |",
    ...categoryOrder.map(
      (category) =>
        `| \`${category}\` | ${report.categoryCounts[category] || 0} |`,
    ),
    "",
    "## Findings",
    "",
  ];

  if (report.findings.length === 0) {
    lines.push("No findings.");
    return `${lines.join("\n")}\n`;
  }

  for (const category of categoryOrder) {
    const categoryFindings = report.findings.filter(
      (finding) => finding.category === category,
    );
    if (categoryFindings.length === 0) {
      continue;
    }

    lines.push(`### ${category} (${categoryFindings.length})`, "");
    for (const finding of categoryFindings) {
      const location = formatLocation(finding);
      const prefix = location ? `\`${location}\`` : "`repo`";
      lines.push(`- ${prefix} — ${finding.message}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writeAuditReportFiles(report, outDir) {
  mkdirSync(outDir, { recursive: true });

  const markdownPath = path.resolve(outDir, "docs-hygiene-report.md");
  const jsonPath = path.resolve(outDir, "docs-hygiene-report.json");
  const markdown = formatMarkdownReport(report);
  const json = JSON.stringify(report, null, 2);

  writeFileSync(markdownPath, markdown);
  writeFileSync(jsonPath, `${json}\n`);

  return {
    markdownPath,
    jsonPath,
  };
}

export function listTrackedMarkdown(repoPath) {
  const output = execFileSync(
    "git",
    ["-C", repoPath, "ls-files", "--", "*.md", "*.mdx"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return output
    .split("\n")
    .map((line) => normalizeRepoPath(line))
    .filter(Boolean);
}

export function parseArgs(argv) {
  let repoPath = "";
  let outDir = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--repo") {
      repoPath = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--out-dir") {
      outDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    throw new Error(`Unsupported argument: ${arg}`);
  }

  if (!repoPath || !outDir) {
    throw new Error(
      "Usage: node .github/scripts/docs-hygiene-audit.mjs --repo <path> --out-dir <path>",
    );
  }

  return {
    repoPath: path.resolve(repoPath),
    outDir: path.resolve(outDir),
  };
}

function main() {
  const { repoPath, outDir } = parseArgs(process.argv.slice(2));
  const trackedFiles = listTrackedMarkdown(repoPath);
  const report = analyzeTrackedMarkdown({
    repoPath,
    filePaths: trackedFiles,
  });

  writeAuditReportFiles(report, outDir);

  process.stdout.write(
    `Docs hygiene audit complete: ${report.findingsCount} finding(s) across ${report.scannedFilesCount} file(s).\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
