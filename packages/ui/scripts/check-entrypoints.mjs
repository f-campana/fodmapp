import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

for (const relativePath of [
  "dist/server.js",
  "dist/server.d.ts",
  "dist/client.js",
  "dist/client.d.ts",
]) {
  await access(path.join(rootDir, relativePath));
}

await import("@fodmapp/ui/server");
await import("@fodmapp/ui/client");
