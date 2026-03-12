import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const isAgentationEnabled = process.env.STORYBOOK_ENABLE_AGENTATION === "true";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storybookCwd = path.resolve(__dirname, "..");
const repoRootCwd = path.resolve(__dirname, "../../..");
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

let isShuttingDown = false;
const childProcesses = [];

function runProcess(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  childProcesses.push(child);
  return child;
}

function shutdownAll() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of childProcesses) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of childProcesses) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }, 2000).unref();
}

function handleSignal() {
  shutdownAll();
  process.exit(0);
}

process.on("SIGINT", handleSignal);
process.on("SIGTERM", handleSignal);

let upstreamWatchProcess;
const previewStylesBuild = spawnSync(pnpmCmd, ["run", "styles:build"], {
  cwd: storybookCwd,
  env: process.env,
  stdio: "inherit",
});

if (previewStylesBuild.status !== 0) {
  process.exit(previewStylesBuild.status ?? 1);
}

const previewStylesWatchProcess = runProcess(
  pnpmCmd,
  ["run", "styles:watch"],
  storybookCwd,
);

if (isAgentationEnabled) {
  // Keep generated design-token artifacts hot while Storybook is running locally.
  upstreamWatchProcess = runProcess(
    pnpmCmd,
    ["exec", "turbo", "watch", "build", "--filter=@fodmap/design-tokens"],
    repoRootCwd,
  );
}

const storybookProcess = runProcess(
  pnpmCmd,
  ["run", "storybook:dev"],
  storybookCwd,
);

previewStylesWatchProcess.on("exit", (code, signal) => {
  if (isShuttingDown) {
    return;
  }

  if (code === 0 || signal === "SIGINT" || signal === "SIGTERM") {
    return;
  }

  process.stderr.write(
    "[storybook-dev] preview styles watch exited unexpectedly. Stopping Storybook.\n",
  );
  shutdownAll();
  process.exit(code ?? 1);
});

if (upstreamWatchProcess) {
  upstreamWatchProcess.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    if (code === 0 || signal === "SIGINT" || signal === "SIGTERM") {
      return;
    }

    process.stderr.write(
      "[storybook-dev] upstream watch exited unexpectedly. Stopping Storybook.\n",
    );
    shutdownAll();
    process.exit(code ?? 1);
  });
}

storybookProcess.on("exit", (code, signal) => {
  shutdownAll();

  if (signal) {
    process.exit(0);
  }

  process.exit(code ?? 0);
});
