import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const repoRoot = process.cwd();
const artifactsDir = path.join(repoRoot, ".artifacts/bundles");
const outputPath = path.join(artifactsDir, "static-assets.json");

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function collectFiles(rootDir) {
  const files = [];

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (stats.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function summarizeApp(name, relDirs) {
  const roots = relDirs.filter((relDir) =>
    existsSync(path.join(repoRoot, relDir)),
  );

  const files = roots
    .flatMap((relDir) => collectFiles(path.join(repoRoot, relDir)))
    .sort()
    .map((filePath) => {
      const contents = readFileSync(filePath);
      return {
        path: path.relative(repoRoot, filePath),
        bytes: statSync(filePath).size,
        gzipBytes: gzipSync(contents).length,
      };
    });

  return {
    name,
    roots,
    files,
  };
}

const report = {
  generatedAtUtc: new Date().toISOString(),
  apps: [
    summarizeApp("marketing", [
      "apps/marketing/.next/static",
      "apps/marketing/public",
    ]),
    summarizeApp("research", ["apps/research/dist"]),
  ],
};

mkdirSync(artifactsDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

writeStdout(`Wrote static asset report to ${outputPath}`);
for (const app of report.apps) {
  writeStdout(app.name);
  for (const file of app.files) {
    writeStdout(`- ${file.path}: ${file.bytes} bytes (${file.gzipBytes} gzip)`);
  }
}
