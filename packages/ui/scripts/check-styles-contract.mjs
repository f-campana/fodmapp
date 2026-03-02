import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { logError, logInfo } from "./logger.mjs";

const filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(filename), "..");
const stylesheetPath = path.join(packageRoot, "dist", "styles.css");

const css = readFileSync(stylesheetPath, "utf8");

const bannedSelectors = [
  ".w-\\[340px\\]",
  ".w-\\[360px\\]",
  ".hover\\:bg-primary\\/90:hover",
  ".hover\\:bg-secondary\\/80:hover",
  ".bg-destructive\\/10",
  ".hover\\:bg-destructive\\/20:hover",
  ".dark\\:bg-destructive\\/10",
  ".dark\\:bg-destructive\\/20",
  ".dark\\:hover\\:bg-destructive\\/20:hover",
  ".dark\\:hover\\:bg-destructive\\/30:hover",
  ".dark\\:border-input",
  ".dark\\:bg-input\\/30",
  ".dark\\:hover\\:bg-input\\/50:hover",
  ".dark\\:hover\\:bg-muted\\/50:hover",
  ".aria-invalid\\:border-destructive",
  ".aria-invalid\\:ring-destructive\\/20",
  ".dark\\:aria-invalid\\:border-destructive\\/50",
  ".dark\\:aria-invalid\\:ring-destructive\\/40",
  ".hover\\:bg-destructive\\/80:hover",
  ".hover\\:bg-destructive\\/90:hover",
  ".focus-visible\\:ring-destructive-subtle-border\\/30:focus-visible",
  ".focus-visible\\:ring-ring\\/50:focus-visible",
];

const requiredSelectors = [
  ".bg-primary",
  ".hover\\:bg-primary-hover:hover",
  ".bg-secondary",
  ".hover\\:bg-secondary-hover:hover",
  ".border-outline-border",
  ".bg-outline",
  ".text-outline-foreground",
  ".hover\\:bg-outline-hover:hover",
  ".text-ghost-foreground",
  ".hover\\:bg-ghost-hover:hover",
  ".bg-destructive",
  ".hover\\:bg-destructive-hover:hover",
  ".aria-invalid\\:border-validation-error-border",
  ".aria-invalid\\:ring-validation-error-ring-soft",
  ".bg-destructive-subtle",
  ".text-destructive-subtle-foreground",
  ".hover\\:bg-destructive-subtle-hover:hover",
  ".focus-visible\\:border-destructive-subtle-border:focus-visible",
  ".focus-visible\\:ring-destructive-subtle-ring:focus-visible",
  ".focus-visible\\:ring-ring-soft:focus-visible",
  ".focus-visible\\:ring-ring-accessible:focus-visible",
];

const failures = [];

for (const selector of bannedSelectors) {
  if (css.includes(selector)) {
    failures.push(
      `Unexpected selector found in distributed stylesheet: ${selector}`,
    );
  }
}

for (const selector of requiredSelectors) {
  if (!css.includes(selector)) {
    failures.push(
      `Expected selector missing from distributed stylesheet: ${selector}`,
    );
  }
}

if (failures.length > 0) {
  logError("UI stylesheet contract check failed:\n");
  for (const failure of failures) {
    logError(`- ${failure}`);
  }
  process.exit(1);
}

logInfo("UI stylesheet contract check passed.");
