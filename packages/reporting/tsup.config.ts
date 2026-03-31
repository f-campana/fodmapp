import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    dashboard: "src/dashboard.ts",
    scientific: "src/scientific.ts",
    contracts: "src/contracts.ts",
    validate: "src/validate.ts",
  },
  format: ["esm"],
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  sourcemap: true,
  clean: false,
  outExtension() {
    return { js: ".js" };
  },
});
