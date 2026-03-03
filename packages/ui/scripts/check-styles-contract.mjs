import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { logError, logInfo } from "./logger.mjs";

const filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(filename), "..");
const stylesheetPath = path.join(packageRoot, "dist", "styles.css");

const css = readFileSync(stylesheetPath, "utf8");
const sourceRootPath = path.join(packageRoot, "src");

function collectSourceFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

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
  ".bg-info",
  ".text-info-foreground",
  ".border-info",
  ".bg-success",
  ".text-success-foreground",
  ".border-success",
  ".bg-warning",
  ".text-warning-foreground",
  ".border-warning",
  ".bg-danger",
  ".text-danger-foreground",
  ".border-danger",
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

const sourceFiles = collectSourceFiles(sourceRootPath);
const sourceChecks = [
  {
    pattern: /\bReact\.forwardRef\b/,
    message:
      "React.forwardRef is forbidden in @fodmap/ui (use React 19 ref-as-prop pattern).",
  },
  {
    pattern: /\.displayName\s*=/,
    message:
      "Explicit displayName assignment is forbidden (use named function declarations).",
  },
  {
    pattern: /data-testid/i,
    message: "data-testid is forbidden (query by role in tests/stories).",
  },
  {
    pattern:
      /from\s+["'](?:lucide-react|react-icons(?:\/[^"']+)?|@heroicons\/[^"']+|phosphor-react|@tabler\/icons-react)["']/,
    message:
      "Icon library imports are forbidden inside packages/ui (accept ReactNode icon slots instead).",
  },
];

for (const filePath of sourceFiles) {
  const source = readFileSync(filePath, "utf8");
  const relPath = path.relative(packageRoot, filePath);

  for (const { pattern, message } of sourceChecks) {
    if (pattern.test(source)) {
      failures.push(`[${relPath}] ${message}`);
    }
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
