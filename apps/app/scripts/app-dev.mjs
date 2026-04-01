import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appCwd = path.resolve(__dirname, "..");
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

function runBuild(args) {
  const build = spawnSync(pnpmCmd, args, {
    cwd: repoRootCwd,
    env: process.env,
    stdio: "inherit",
  });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
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

function handleWatchExit(name, child) {
  child.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    if (code === 0 || signal === "SIGINT" || signal === "SIGTERM") {
      return;
    }

    process.stderr.write(
      `[app-dev] ${name} watch exited unexpectedly. Stopping Next.js dev server.\n`,
    );
    shutdownAll();
    process.exit(code ?? 1);
  });
}

process.on("SIGINT", handleSignal);
process.on("SIGTERM", handleSignal);

runBuild(["--filter", "@fodmapp/domain", "build"]);
runBuild(["--filter", "@fodmapp/api-client", "build"]);
runBuild(["--filter", "@fodmapp/ui", "build"]);

const domainWatchProcess = runProcess(
  pnpmCmd,
  ["--filter", "@fodmapp/domain", "watch"],
  repoRootCwd,
);
const apiClientWatchProcess = runProcess(
  pnpmCmd,
  ["--filter", "@fodmapp/api-client", "watch"],
  repoRootCwd,
);

const nextDevArgs = ["exec", "next", "dev", ...process.argv.slice(2)];
const appProcess = runProcess(pnpmCmd, nextDevArgs, appCwd);

handleWatchExit("domain", domainWatchProcess);
handleWatchExit("api-client", apiClientWatchProcess);

appProcess.on("exit", (code, signal) => {
  shutdownAll();

  if (signal) {
    process.exit(0);
  }

  process.exit(code ?? 0);
});
