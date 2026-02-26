import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "@fodmap/eslint-config";
import nextConfig from "@fodmap/eslint-config/next";

export default defineConfig([
  globalIgnores([
    "**/api/.venv/**",
    "**/api/.pytest_cache/**",
    "**/.astro/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/.vscode/**",
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**",
    "**/playwright-report/**",
    "**/storybook-static/**",
    "packages/design-tokens/src/generated/tokens.d.ts",
  ]),
  ...baseConfig,
  ...nextConfig,
]);
