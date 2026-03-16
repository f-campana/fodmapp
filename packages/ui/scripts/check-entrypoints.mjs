import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

for (const relativePath of [
  "dist/app.css",
  "dist/full.css",
  "dist/cn.js",
  "dist/cn.d.ts",
  "dist/button.js",
  "dist/button.d.ts",
]) {
  await access(path.join(rootDir, relativePath));
}

await import("@fodmapp/ui/cn");
await import("@fodmapp/ui/button");
