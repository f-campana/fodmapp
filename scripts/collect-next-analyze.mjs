import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const sourceDir = path.join(repoRoot, "apps/app/.next/analyze");
const targetDir = path.join(repoRoot, ".artifacts/bundles/app");

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

if (!existsSync(sourceDir)) {
  writeStderr(`Next analyzer output not found at ${sourceDir}`);
  process.exit(1);
}

mkdirSync(path.dirname(targetDir), { recursive: true });
rmSync(targetDir, { recursive: true, force: true });
cpSync(sourceDir, targetDir, { recursive: true });

const files = readdirSync(targetDir).sort();
writeStdout(`Copied Next analyzer artifacts to ${targetDir}`);
for (const file of files) {
  writeStdout(`- ${file}`);
}
