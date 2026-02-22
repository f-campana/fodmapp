import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: false,
  external: ["react", "react-dom"],
  outExtension() {
    return { js: ".js" };
  },
});
