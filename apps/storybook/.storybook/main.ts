import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";

import { mergeConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  staticDirs: ["../public"],

  async viteFinal(baseConfig) {
    const isAnalyze = process.env.STORYBOOK_ANALYZE === "true";

    return mergeConfig(baseConfig, {
      resolve: {
        alias: [
          {
            find: /^@fodmap\/ui\/app\.css$/,
            replacement: path.resolve(repoRoot, "packages/ui/dist/app.css"),
          },
          {
            find: /^@fodmap\/ui\/full\.css$/,
            replacement: path.resolve(repoRoot, "packages/ui/dist/full.css"),
          },
          {
            find: /^@fodmap\/ui\/hooks\/(.+)$/,
            replacement: path.resolve(repoRoot, "packages/ui/src/hooks/$1.ts"),
          },
          {
            find: /^@fodmap\/ui\/cn$/,
            replacement: path.resolve(repoRoot, "packages/ui/src/lib/cn.ts"),
          },
          {
            find: /^@fodmap\/ui\/(.+)$/,
            replacement: path.resolve(
              repoRoot,
              "packages/ui/src/components/$1.tsx",
            ),
          },
          {
            find: /^@fodmap\/reporting\/dashboard$/,
            replacement: path.resolve(
              repoRoot,
              "packages/reporting/src/dashboard.ts",
            ),
          },
          {
            find: /^@fodmap\/reporting\/scientific$/,
            replacement: path.resolve(
              repoRoot,
              "packages/reporting/src/scientific.ts",
            ),
          },
          {
            find: /^@fodmap\/reporting\/contracts$/,
            replacement: path.resolve(
              repoRoot,
              "packages/reporting/src/contracts.ts",
            ),
          },
          {
            find: /^@fodmap\/reporting\/validate$/,
            replacement: path.resolve(
              repoRoot,
              "packages/reporting/src/validate.ts",
            ),
          },
          {
            find: /^@fodmap\/reporting\/styles\.css$/,
            replacement: path.resolve(
              repoRoot,
              "packages/reporting/src/styles/reporting-theme.css",
            ),
          },
        ],
      },
      build: isAnalyze
        ? {
            sourcemap: true,
          }
        : undefined,
    });
  },

  core: {
    disableWhatsNewNotifications: true,
  },
};

export default config;
