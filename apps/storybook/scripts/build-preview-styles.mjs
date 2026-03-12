import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storybookCwd = path.resolve(__dirname, "..");
const repoRootCwd = path.resolve(__dirname, "../../..");
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const isWatch = process.argv.includes("--watch");
const inputPath = path.resolve(storybookCwd, ".storybook/preview.css");
const outputPath = path.resolve(
  storybookCwd,
  ".storybook/preview.generated.css",
);

const args = [
  "--filter",
  "@fodmap/ui",
  "exec",
  "tailwindcss",
  "-i",
  inputPath,
  "-o",
  outputPath,
];

if (isWatch) {
  args.push("--watch");
} else {
  args.push("--minify");
}

const child = spawn(pnpmCmd, args, {
  cwd: repoRootCwd,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }

  process.exit(code ?? 1);
});
