import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const storybookRoot = process.cwd();
const assetDir = path.join(storybookRoot, "storybook-static/assets");
const artifactsDir = path.resolve(
  storybookRoot,
  "../../.artifacts/bundles/storybook",
);
const reportPath = path.join(artifactsDir, "report.html");

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

if (!existsSync(assetDir)) {
  writeStderr(`Storybook assets directory not found at ${assetDir}`);
  process.exit(1);
}

const sourcemaps = readdirSync(assetDir)
  .filter((entry) => entry.endsWith(".js.map"))
  .map((entry) => path.join(assetDir, entry))
  .sort();

if (sourcemaps.length === 0) {
  writeStderr(`No Storybook sourcemaps found in ${assetDir}`);
  process.exit(1);
}

mkdirSync(artifactsDir, { recursive: true });
rmSync(reportPath, { force: true });

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "rollup-plugin-visualizer",
    "--filename",
    reportPath,
    "--template",
    "treemap",
    "--sourcemap",
    ...sourcemaps,
  ],
  {
    cwd: storybookRoot,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

writeStdout(`Wrote Storybook visualizer report to ${reportPath}`);
