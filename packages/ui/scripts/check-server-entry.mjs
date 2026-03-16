import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceDir = path.join(rootDir, "src");
const serverEntry = path.join(sourceDir, "server.ts");

const exportPattern = /from\s+"(\.[^"]+)"/g;
const fileCandidates = [".ts", ".tsx"];

async function loadFile(filePath) {
  return readFile(filePath, "utf8");
}

async function resolveSource(importPath, fromFile) {
  const resolvedBase = path.resolve(path.dirname(fromFile), importPath);
  for (const extension of fileCandidates) {
    const candidate = `${resolvedBase}${extension}`;
    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch {}
  }
  throw new Error(
    `Unable to resolve ${importPath} from ${path.relative(rootDir, fromFile)}`,
  );
}

function firstMeaningfulLine(contents) {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("//"));
}

async function collectTransitiveFiles(entryFile, seen = new Set()) {
  if (seen.has(entryFile)) {
    return seen;
  }

  seen.add(entryFile);

  const contents = await loadFile(entryFile);
  const matches = [...contents.matchAll(exportPattern)];

  for (const match of matches) {
    const nextFile = await resolveSource(match[1], entryFile);
    await collectTransitiveFiles(nextFile, seen);
  }

  return seen;
}

const files = await collectTransitiveFiles(serverEntry);
const violations = [];

for (const filePath of files) {
  if (filePath === serverEntry) {
    continue;
  }

  const contents = await loadFile(filePath);
  if (firstMeaningfulLine(contents) === '"use client";') {
    violations.push(path.relative(rootDir, filePath));
  }
}

if (violations.length > 0) {
  process.stderr.write("server entry exports client-only modules:\n");
  for (const violation of violations) {
    process.stderr.write(`- ${violation}\n`);
  }
  process.exit(1);
}
