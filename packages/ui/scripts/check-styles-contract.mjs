import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const stylesheetPath = path.join(packageRoot, "dist", "styles.css");

const css = readFileSync(stylesheetPath, "utf8");

const bannedSelectors = [
  ".w-\\[340px\\]",
  ".w-\\[360px\\]",
  ".hover\\:bg-primary\\/90:hover",
  ".hover\\:bg-secondary\\/80:hover",
  ".hover\\:bg-destructive\\/90:hover",
  ".focus-visible\\:ring-ring\\/50:focus-visible",
];

const requiredSelectors = [
  ".bg-primary",
  ".hover\\:bg-primary-hover:hover",
  ".bg-secondary",
  ".hover\\:bg-secondary-hover:hover",
  ".bg-destructive",
  ".hover\\:bg-destructive-hover:hover",
  ".focus-visible\\:ring-ring-soft:focus-visible",
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
  console.error("UI stylesheet contract check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("UI stylesheet contract check passed.");
