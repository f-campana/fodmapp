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
  ".data-\\[state\\=checked\\]\\:bg-primary",
  ".data-\\[state\\=checked\\]\\:border-primary",
  ".data-\\[state\\=checked\\]\\:text-primary-foreground",
  ".data-\\[state\\=unchecked\\]\\:bg-input",
  ".bg-input",
  ".bg-border",
  ".bg-muted",
  ".data-\\[state\\=active\\]\\:bg-background",
  ".data-\\[state\\=active\\]\\:text-foreground",
  ".data-\\[state\\=on\\]\\:bg-accent",
  ".data-\\[state\\=on\\]\\:text-accent-foreground",
  ".bg-popover",
  ".text-popover-foreground",
  ".data-\\[state\\=open\\]\\:animate-accordion-down",
  ".data-\\[state\\=closed\\]\\:animate-accordion-up",
  ".data-\\[state\\=open\\]\\:animate-in",
  ".data-\\[state\\=closed\\]\\:animate-out",
  ".bg-muted\\/80",
  ".data-\\[state\\=open\\]\\:fade-in-0",
  ".data-\\[state\\=closed\\]\\:fade-out-0",
  ".data-\\[state\\=open\\]\\:zoom-in-95",
  ".data-\\[state\\=closed\\]\\:zoom-out-95",
  ".data-\\[state\\=open\\]\\:slide-in-from-right",
  ".data-\\[state\\=closed\\]\\:slide-out-to-right",
  ".data-\\[state\\=open\\]\\:slide-in-from-left",
  ".data-\\[state\\=closed\\]\\:slide-out-to-left",
  ".data-\\[state\\=open\\]\\:slide-in-from-top",
  ".data-\\[state\\=closed\\]\\:slide-out-to-top",
  ".data-\\[state\\=open\\]\\:slide-in-from-bottom",
  ".data-\\[state\\=closed\\]\\:slide-out-to-bottom",
  ".data-\\[side\\=bottom\\]\\:slide-in-from-top-2",
  ".data-\\[side\\=left\\]\\:slide-in-from-right-2",
  ".data-\\[side\\=right\\]\\:slide-in-from-left-2",
  ".data-\\[side\\=top\\]\\:slide-in-from-bottom-2",
  ".data-\\[placeholder\\]\\:text-muted-foreground",
  ".data-\\[side\\=bottom\\]\\:translate-y-1",
  ".data-\\[side\\=left\\]\\:-translate-x-1",
  ".data-\\[side\\=right\\]\\:translate-x-1",
  ".data-\\[side\\=top\\]\\:-translate-y-1",
  ".fill-popover",
  ".stroke-border",
  ".focus\\:bg-accent:focus",
  ".focus\\:text-accent-foreground:focus",
  ".data-\\[state\\=open\\]\\:bg-accent",
  ".data-\\[state\\=open\\]\\:text-accent-foreground",
  ".data-\\[disabled\\]\\:pointer-events-none",
  ".data-\\[disabled\\]\\:opacity-50",
  ".data-\\[selected\\=true\\]\\:bg-accent",
  ".data-\\[selected\\=true\\]\\:text-accent-foreground",
  ".data-\\[disabled\\=true\\]\\:pointer-events-none",
  ".data-\\[disabled\\=true\\]\\:opacity-50",
  ".\\[\\&_\\[cmdk-group-heading\\]\\]\\:px-2",
  ".\\[\\&_\\[cmdk-group-heading\\]\\]\\:text-xs",
  ".data-\\[motion\\^\\=from-\\]\\:animate-in",
  ".data-\\[motion\\^\\=to-\\]\\:animate-out",
  ".data-\\[motion\\^\\=from-\\]\\:fade-in",
  ".data-\\[motion\\^\\=to-\\]\\:fade-out",
  ".data-\\[motion\\=from-end\\]\\:slide-in-from-right-2",
  ".data-\\[motion\\=from-start\\]\\:slide-in-from-left-2",
  ".data-\\[motion\\=to-end\\]\\:slide-out-to-right-2",
  ".data-\\[motion\\=to-start\\]\\:slide-out-to-left-2",
  ".data-\\[state\\=visible\\]\\:animate-in",
  ".data-\\[state\\=hidden\\]\\:animate-out",
  ".data-\\[state\\=visible\\]\\:fade-in",
  ".data-\\[state\\=hidden\\]\\:fade-out",
  ".data-\\[active\\]\\:bg-accent",
  ".focus-within\\:border-ring:focus-within",
  ".focus-within\\:ring-2:focus-within",
  ".focus-within\\:ring-ring-soft:focus-within",
  ".has-\\[\\:disabled\\]\\:cursor-not-allowed:has(:disabled)",
  ".has-\\[\\:disabled\\]\\:opacity-50:has(:disabled)",
  ".data-\\[active\\=true\\]\\:border-ring",
  ".data-\\[active\\=true\\]\\:ring-2",
  ".data-\\[active\\=true\\]\\:ring-ring-soft",
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
