import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "@fodmapp/eslint-config";
import llmConfig from "@fodmapp/eslint-config/llm";
import nextConfig from "@fodmapp/eslint-config/next";

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
  ...llmConfig,
]);
