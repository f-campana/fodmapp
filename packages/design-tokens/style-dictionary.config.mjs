const target = process.env.FD_BUILD_TARGET ?? "light";
const outputPath = process.env.FD_OUTPUT_PATH ?? "src/generated/tmp/";
const buildPath = outputPath.endsWith("/") ? outputPath : `${outputPath}/`;

const semanticFilter = (token) => token.path[0] === "semantic";

const configs = {
  base: {
    source: ["src/tokens/base/**/*.json"],
    platforms: {
      json: {
        transformGroup: "js",
        buildPath,
        files: [
          {
            destination: "base.json",
            format: "json/nested"
          }
        ]
      }
    }
  },
  light: {
    source: ["src/tokens/base/**/*.json", "src/tokens/semantic/light.json"],
    platforms: {
      css: {
        transformGroup: "css",
        prefix: "fd",
        buildPath,
        files: [
          {
            destination: "light.css",
            format: "css/variables",
            options: {
              selector: ":root, [data-theme=\"light\"]"
            }
          }
        ]
      },
      json: {
        transformGroup: "js",
        buildPath,
        files: [
          {
            destination: "light.semantic.json",
            format: "json/nested",
            filter: semanticFilter
          }
        ]
      }
    }
  },
  dark: {
    source: ["src/tokens/base/**/*.json", "src/tokens/semantic/dark.json"],
    platforms: {
      css: {
        transformGroup: "css",
        prefix: "fd",
        buildPath,
        files: [
          {
            destination: "dark.css",
            format: "css/variables",
            options: {
              selector: "[data-theme=\"dark\"]"
            }
          }
        ]
      },
      json: {
        transformGroup: "js",
        buildPath,
        files: [
          {
            destination: "dark.semantic.json",
            format: "json/nested",
            filter: semanticFilter
          }
        ]
      }
    }
  }
};

const config = configs[target];

if (!config) {
  throw new Error(`Unknown FD_BUILD_TARGET \"${target}\". Expected one of: ${Object.keys(configs).join(", ")}`);
}

export default {
  usesDtcg: true,
  ...config
};
