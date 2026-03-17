import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: node ./scripts/with-next-lock.mjs <command> [...args]");
  process.exit(1);
}

const lockDir = join(process.cwd(), ".next-task-lock");
const pidFile = join(lockDir, "pid");

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock() {
  for (;;) {
    try {
      await mkdir(lockDir);
      await writeFile(pidFile, `${process.pid}\n`, "utf8");
      return;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        const holderPid = await readHolderPid();

        if (holderPid === null || !isProcessAlive(holderPid)) {
          await releaseLock();
          continue;
        }

        await sleep(100);
        continue;
      }

      throw error;
    }
  }
}

async function releaseLock() {
  await rm(lockDir, { recursive: true, force: true });
}

async function readHolderPid() {
  try {
    const value = await readFile(pidFile, "utf8");
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ESRCH") {
      return false;
    }

    return true;
  }
}

async function run() {
  await acquireLock();

  try {
    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: process.cwd(),
        stdio: "inherit",
        shell: false,
      });

      child.on("error", reject);
      child.on("exit", (code, signal) => {
        if (signal) {
          reject(new Error(`Command terminated with signal ${signal}`));
          return;
        }

        resolve(code ?? 1);
      });
    });

    process.exit(exitCode);
  } finally {
    await releaseLock();
  }
}

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await releaseLock();
  process.exit(1);
});
