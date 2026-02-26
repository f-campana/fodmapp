import { globalIgnores } from "eslint/config";
import nextCoreVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const appFiles = ["apps/app/**/*.{js,jsx,ts,tsx}"];

const stripOverlappingPlugins = (config) => {
  const plugins = config.plugins;
  if (!plugins) {
    return config;
  }

  const remainingPlugins = {
    ...plugins,
  };
  delete remainingPlugins.react;
  delete remainingPlugins["react-hooks"];
  delete remainingPlugins["jsx-a11y"];

  return {
    ...config,
    plugins:
      Object.keys(remainingPlugins).length > 0 ? remainingPlugins : undefined,
  };
};

const scopeToApp = (configs) =>
  configs.map((config) => ({
    ...config,
    ...stripOverlappingPlugins(config),
    files: appFiles,
  }));

export default [
  ...scopeToApp(nextCoreVitals),
  ...scopeToApp(nextTypeScript),
  globalIgnores(["apps/app/.next/**", "apps/app/out/**", "apps/app/build/**"]),
  {
    files: appFiles,
    settings: {
      next: {
        rootDir: ["apps/app"],
      },
    },
  },
];
