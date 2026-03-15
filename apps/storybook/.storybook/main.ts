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
    return mergeConfig(baseConfig, {
      resolve: {
        alias: [
          {
            find: /^@fodmap\/ui$/,
            replacement: path.resolve(repoRoot, "packages/ui/src/index.ts"),
          },
        ],
      },
    });
  },

  core: {
    disableWhatsNewNotifications: true,
  },
};

export default config;
