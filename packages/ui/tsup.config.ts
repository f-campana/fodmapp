import { readdirSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "tsup";

const packageRoot = process.cwd();
const componentsDir = path.join(packageRoot, "src", "components");
const hooksDir = path.join(packageRoot, "src", "hooks");

function collectEntries(dir: string, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    readdirSync(dir)
      .filter(
        (file) =>
          (file.endsWith(".ts") || file.endsWith(".tsx")) &&
          !file.endsWith(".test.ts") &&
          !file.endsWith(".test.tsx"),
      )
      .map((file) => {
        const name = file.replace(/\.(ts|tsx)$/, "");
        return [prefix ? `${prefix}/${name}` : name, path.join(dir, file)];
      }),
  );
}

const entry = {
  ...collectEntries(componentsDir),
  ...collectEntries(hooksDir, "hooks"),
  cn: path.join(packageRoot, "src", "lib", "cn.ts"),
};

export default defineConfig({
  entry,
  format: ["esm"],
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  sourcemap: true,
  clean: false,
  external: [
    "react",
    "react-dom",
    "@radix-ui/react-accordion",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-aspect-ratio",
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-label",
    "@radix-ui/react-menubar",
    "@radix-ui/react-navigation-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-progress",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-select",
    "@radix-ui/react-separator",
    "@radix-ui/react-slider",
    "@radix-ui/react-slot",
    "@radix-ui/react-switch",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toggle",
    "@radix-ui/react-toggle-group",
    "@radix-ui/react-tooltip",
    "cmdk",
    "date-fns",
    "embla-carousel-react",
    "input-otp",
    "react-day-picker",
    "react-resizable-panels",
    "sonner",
    "vaul",
  ],
  outExtension() {
    return { js: ".js" };
  },
});
