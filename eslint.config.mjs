import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "@fodmap/eslint-config";
import markdownConfig from "@fodmap/eslint-config/markdown";
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
    "packages/design-tokens/src/generated/tokens.native.d.ts",
  ]),
  ...baseConfig,
  {
    files: ["apps/storybook/.storybook/preview.ts"],
    rules: {
      "import/no-unresolved": [
        "error",
        {
          ignore: [
            "^\\.\\/\\.next\\/types\\/",
            "^astro:",
            "^\\.\\/preview\\.generated\\.css$",
          ],
        },
      ],
    },
  },
  {
    files: ["apps/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@fodmap/ui",
              message:
                "Use @fodmap/ui/server or @fodmap/ui/client inside apps/app.",
            },
          ],
        },
      ],
    },
  },
  ...markdownConfig.map((config) => ({
    ...config,
    files: ["apps/storybook/stories/**/*.{md,mdx}"],
  })),
  ...nextConfig,
]);
