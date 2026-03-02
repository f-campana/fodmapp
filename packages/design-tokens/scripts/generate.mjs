import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Color from "colorjs.io";
import tinycolor from "tinycolor2";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const generatedDir = path.join(packageRoot, "src", "generated");
const tempBuildDir = path.join(packageRoot, ".tmp", "style-dictionary");
const baseColorTokensFile = path.join(
  packageRoot,
  "src",
  "tokens",
  "base",
  "color.json",
);

const aliasMap = [
  ["--color-bg", "--fd-semantic-color-background-canvas"],
  ["--color-surface", "--fd-semantic-color-surface-default"],
  ["--color-surface-strong", "--fd-semantic-color-surface-raised"],
  ["--color-surface-muted", "--fd-semantic-color-surface-muted"],
  ["--color-text", "--fd-semantic-color-text-primary"],
  ["--color-text-muted", "--fd-semantic-color-text-muted"],
  ["--color-border", "--fd-semantic-color-border-default"],
  ["--color-border-control", "--fd-semantic-color-border-control"],
  ["--color-accent", "--fd-semantic-color-action-primary-bg"],
  ["--color-accent-strong", "--fd-semantic-color-action-primary-bg-hover"],
  ["--color-accent-foreground", "--fd-semantic-color-action-primary-fg"],
  ["--color-ring", "--fd-semantic-color-focus-ring"],
  ["--color-ring-accessible", "--fd-semantic-color-focus-ring-accessible"],
  ["--color-ring-soft", "--fd-semantic-color-focus-ring-soft"],
  ["--color-warning", "--fd-semantic-color-status-warning-bg"],
  ["--color-warning-foreground", "--fd-semantic-color-status-warning-fg"],
  ["--color-danger", "--fd-semantic-color-status-danger-bg"],
  ["--color-danger-hover", "--fd-semantic-color-action-destructive-bg-hover"],
  ["--color-danger-foreground", "--fd-semantic-color-status-danger-fg"],
  ["--font-body", "--fd-semantic-typography-font-family-body"],
  ["--font-display", "--fd-semantic-typography-font-family-display"],
];

function runBuild(target) {
  execFileSync(
    "pnpm",
    [
      "exec",
      "style-dictionary",
      "build",
      "--config",
      "./style-dictionary.config.mjs",
    ],
    {
      cwd: packageRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        FD_BUILD_TARGET: target,
        FD_OUTPUT_PATH: tempBuildDir,
      },
    },
  );
}

function readJson(filename) {
  return JSON.parse(readFileSync(path.join(tempBuildDir, filename), "utf8"));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateBaseColorTokens() {
  const source = JSON.parse(readFileSync(baseColorTokensFile, "utf8"));
  const errors = [];

  function validateColorLeaf(tokenPath, value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${tokenPath}: expected "$value" to be an object.`);
      return;
    }

    const { colorSpace, components, hex } = value;

    if (colorSpace !== "oklch") {
      errors.push(
        `${tokenPath}: expected colorSpace="oklch", received ${JSON.stringify(colorSpace)}.`,
      );
    }

    if (
      !Array.isArray(components) ||
      components.length !== 3 ||
      components.some((component) => !isFiniteNumber(component))
    ) {
      errors.push(
        `${tokenPath}: expected components to be [L, C, H] finite numbers.`,
      );
      return;
    }

    const [l, c, h] = components;

    if (l < 0 || l > 1) {
      errors.push(`${tokenPath}: L must be within 0..1, received ${l}.`);
    }

    if (c < 0) {
      errors.push(`${tokenPath}: C must be >= 0, received ${c}.`);
    }

    if (h < 0 || h >= 360) {
      errors.push(`${tokenPath}: H must be >= 0 and < 360, received ${h}.`);
    }

    if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/.test(hex)) {
      errors.push(
        `${tokenPath}: hex must be lowercase #rrggbb, received ${JSON.stringify(hex)}.`,
      );
      return;
    }

    if (!tinycolor(hex).isValid()) {
      errors.push(`${tokenPath}: hex value is not a valid color (${hex}).`);
      return;
    }

    try {
      const roundTripHex = new Color("oklch", [l, c, h])
        .to("srgb")
        .toString({ format: "hex" })
        .toLowerCase();

      if (roundTripHex !== hex) {
        errors.push(
          `${tokenPath}: hex mismatch, expected ${hex} from source but roundtrip produced ${roundTripHex}.`,
        );
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      errors.push(`${tokenPath}: failed OKLCH roundtrip check (${details}).`);
    }
  }

  function walk(node, pathParts) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (node.$type === "color") {
      validateColorLeaf(pathParts.join("."), node.$value);
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      walk(value, [...pathParts, key]);
    }
  }

  walk(source, []);

  if (errors.length > 0) {
    throw new Error(
      `Base color token preflight failed:\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }
}

function collectTokenPaths(node, pathParts = [], paths = []) {
  if (node === null || node === undefined) {
    return paths;
  }

  if (typeof node !== "object" || Array.isArray(node)) {
    if (pathParts.length > 0) {
      paths.push(pathParts.join("."));
    }
    return paths;
  }

  if (Object.prototype.hasOwnProperty.call(node, "$value")) {
    if (pathParts.length > 0) {
      paths.push(pathParts.join("."));
    }
    return paths;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) {
      continue;
    }
    collectTokenPaths(value, [...pathParts, key], paths);
  }

  return paths;
}

function validateSemanticTokenParity(lightTokens, darkTokens) {
  const lightSemantic = lightTokens.semantic ?? lightTokens;
  const darkSemantic = darkTokens.semantic ?? darkTokens;
  const lightPaths = new Set(collectTokenPaths(lightSemantic));
  const darkPaths = new Set(collectTokenPaths(darkSemantic));
  const onlyLight = [...lightPaths]
    .filter((path) => !darkPaths.has(path))
    .sort();
  const onlyDark = [...darkPaths]
    .filter((path) => !lightPaths.has(path))
    .sort();

  if (onlyLight.length === 0 && onlyDark.length === 0) {
    return;
  }

  const details = [];

  if (onlyLight.length > 0) {
    details.push(
      `- Paths present only in light semantic tokens:\n${onlyLight.map((path) => `  - ${path}`).join("\n")}`,
    );
  }

  if (onlyDark.length > 0) {
    details.push(
      `- Paths present only in dark semantic tokens:\n${onlyDark.map((path) => `  - ${path}`).join("\n")}`,
    );
  }

  throw new Error(`Semantic token parity check failed:\n${details.join("\n")}`);
}

function getPathValue(node, tokenPath) {
  return tokenPath.split(".").reduce((currentNode, segment) => {
    if (
      currentNode === null ||
      currentNode === undefined ||
      typeof currentNode !== "object"
    ) {
      return undefined;
    }

    return currentNode[segment];
  }, node);
}

function normalizeTokenColorValue(tokenPath, value) {
  if (value === null || value === undefined) {
    throw new Error(
      `${tokenPath}: expected a color token value, received null.`,
    );
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    if (Object.prototype.hasOwnProperty.call(value, "$value")) {
      return normalizeTokenColorValue(tokenPath, value.$value);
    }

    if (typeof value.hex === "string") {
      return value.hex.toLowerCase();
    }

    if (
      typeof value.colorSpace === "string" &&
      Array.isArray(value.components)
    ) {
      try {
        return new Color(value.colorSpace, value.components)
          .to("srgb")
          .toString({ format: "hex" })
          .toLowerCase();
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        throw new Error(
          `${tokenPath}: failed to parse object color value (${details}).`,
        );
      }
    }

    throw new Error(
      `${tokenPath}: unsupported color value object ${JSON.stringify(value)}.`,
    );
  }

  if (typeof value !== "string") {
    throw new Error(
      `${tokenPath}: expected a string color value, received ${typeof value}.`,
    );
  }

  try {
    return new Color(value)
      .to("srgb")
      .toString({ format: "hex" })
      .toLowerCase();
  } catch {
    if (tinycolor(value).isValid()) {
      return tinycolor(value).toHexString().toLowerCase();
    }

    throw new Error(
      `${tokenPath}: invalid color value ${JSON.stringify(value)}.`,
    );
  }
}

function resolveSemanticColorHex(semanticColor, tokenPath) {
  const value = getPathValue(semanticColor, tokenPath);

  if (value === undefined) {
    throw new Error(
      `${tokenPath}: token path not found in semantic color tree.`,
    );
  }

  return normalizeTokenColorValue(tokenPath, value);
}

function collectFgBgSiblingPairs(node, pathParts = [], pairs = []) {
  if (node === null || node === undefined) {
    return pairs;
  }

  if (typeof node !== "object" || Array.isArray(node)) {
    return pairs;
  }

  if (
    Object.prototype.hasOwnProperty.call(node, "bg") &&
    Object.prototype.hasOwnProperty.call(node, "fg")
  ) {
    pairs.push({
      bg: [...pathParts, "bg"].join("."),
      fg: [...pathParts, "fg"].join("."),
    });
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) {
      continue;
    }
    collectFgBgSiblingPairs(value, [...pathParts, key], pairs);
  }

  return pairs;
}

function validateSemanticColorContrast(themeName, themeTokens) {
  const semantic = themeTokens.semantic ?? themeTokens;
  const semanticColor = semantic.color;

  if (
    semanticColor === null ||
    semanticColor === undefined ||
    typeof semanticColor !== "object"
  ) {
    throw new Error(
      `Semantic color contrast check failed for ${themeName}: semantic.color tree not found.`,
    );
  }

  const requiredPairs = [
    { fg: "text.primary", bg: "background.canvas", minRatio: 4.5 },
    { fg: "text.primary", bg: "surface.default", minRatio: 4.5 },
    { fg: "text.primary", bg: "surface.raised", minRatio: 4.5 },
    { fg: "text.primary", bg: "surface.muted", minRatio: 4.5 },
    { fg: "text.muted", bg: "background.canvas", minRatio: 4.5 },
    { fg: "text.muted", bg: "surface.default", minRatio: 4.5 },
    { fg: "text.inverse", bg: "surface.inverse", minRatio: 4.5 },
    { fg: "focus.ringAccessible", bg: "background.canvas", minRatio: 3 },
    { fg: "border.control", bg: "background.canvas", minRatio: 3 },
    { fg: "validation.error.text", bg: "background.canvas", minRatio: 4.5 },
    { fg: "validation.error.border", bg: "background.canvas", minRatio: 3 },
    { fg: "validation.error.ringSoft", bg: "background.canvas", minRatio: 3 },
    { fg: "action.outline.fg", bg: "action.outline.bg", minRatio: 4.5 },
    {
      fg: "action.outline.fg",
      bg: "action.outline.bgHover",
      minRatio: 4.5,
    },
    { fg: "action.outline.border", bg: "action.outline.bg", minRatio: 3 },
    { fg: "text.primary", bg: "status.success.bgSubtle", minRatio: 4.5 },
    { fg: "text.primary", bg: "status.danger.bgSubtle", minRatio: 4.5 },
    {
      fg: "action.destructive.fgSubtle",
      bg: "action.destructive.bgSubtle",
      minRatio: 4.5,
    },
    {
      fg: "action.destructive.fgSubtle",
      bg: "action.destructive.bgSubtleHover",
      minRatio: 4.5,
    },
    {
      fg: "action.destructive.borderSubtle",
      bg: "action.destructive.bgSubtle",
      minRatio: 3,
    },
    {
      fg: "action.destructive.borderSubtle",
      bg: "action.destructive.bgSubtleHover",
      minRatio: 3,
    },
    {
      fg: "action.destructive.ringSubtle",
      bg: "action.destructive.bgSubtle",
      minRatio: 3,
    },
    {
      fg: "action.destructive.ringSubtle",
      bg: "action.destructive.bgSubtleHover",
      minRatio: 3,
    },
  ];

  const actionStatusPairs = collectFgBgSiblingPairs(semanticColor)
    .filter(
      ({ bg, fg }) =>
        (bg.startsWith("action.") && fg.startsWith("action.")) ||
        (bg.startsWith("status.") && fg.startsWith("status.")),
    )
    .map(({ fg, bg }) => ({ fg, bg, minRatio: 4.5 }));

  const pairByKey = new Map();

  for (const pair of [...requiredPairs, ...actionStatusPairs]) {
    pairByKey.set(`${pair.fg}|${pair.bg}`, pair);
  }

  const errors = [];

  for (const pair of pairByKey.values()) {
    try {
      const fgHex = resolveSemanticColorHex(semanticColor, pair.fg);
      const bgHex = resolveSemanticColorHex(semanticColor, pair.bg);
      const ratio = tinycolor.readability(fgHex, bgHex);

      if (ratio < pair.minRatio) {
        errors.push(
          `- ${pair.fg} on ${pair.bg}: ${ratio.toFixed(2)} (required >= ${pair.minRatio.toFixed(1)})`,
        );
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      errors.push(`- ${pair.fg} on ${pair.bg}: ${details}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Semantic color contrast check failed for ${themeName}:\n${errors.join("\n")}`,
    );
  }
}

function extractVariableDeclarations(cssText) {
  const variableLines = [];

  for (const match of cssText.matchAll(/^\s*(--[^:]+:\s*[^;]+;)\s*$/gm)) {
    variableLines.push(match[1]);
  }

  return Array.from(new Set(variableLines));
}

function buildAliasDeclarations(definedVariables) {
  return aliasMap.map(([legacyName, canonicalName]) => {
    if (!definedVariables.has(canonicalName)) {
      throw new Error(
        `Missing canonical variable ${canonicalName} required for alias ${legacyName}`,
      );
    }

    return `${legacyName}: var(${canonicalName});`;
  });
}

function formatBlock(selector, declarations, colorScheme) {
  const definedVariables = new Set(
    declarations.map((line) => line.slice(0, line.indexOf(":"))),
  );
  const aliasDeclarations = buildAliasDeclarations(definedVariables);
  const allLines = [
    ...declarations,
    `color-scheme: ${colorScheme};`,
    ...aliasDeclarations,
  ];

  return `${selector} {\n${allLines.map((line) => `  ${line}`).join("\n")}\n}`;
}

function formatMediaBlock(selector, declarations, colorScheme) {
  const definedVariables = new Set(
    declarations.map((line) => line.slice(0, line.indexOf(":"))),
  );
  const aliasDeclarations = buildAliasDeclarations(definedVariables);
  const allLines = [
    ...declarations,
    `color-scheme: ${colorScheme};`,
    ...aliasDeclarations,
  ];

  return `@media (prefers-color-scheme: dark) {\n  ${selector} {\n${allLines.map((line) => `    ${line}`).join("\n")}\n  }\n}`;
}

function writeNativeFile(baseTokens, lightTokens, darkTokens) {
  const colorSource = JSON.parse(readFileSync(baseColorTokensFile, "utf8"));

  const lookup = new Map();
  function buildLookup(node) {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.$type === "color") {
      const [l, c, h] = node.$value.components;
      const key = `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`;
      lookup.set(key, node.$value.hex);
      return;
    }
    for (const value of Object.values(node)) {
      buildLookup(value);
    }
  }
  buildLookup(colorSource);

  function transformValue(value) {
    if (typeof value === "string") {
      if (value.startsWith("oklch(")) {
        const hex = lookup.get(value);
        if (!hex) {
          throw new Error(`No hex mapping found for OKLCH value: ${value}`);
        }
        return hex;
      }
      if (/^-?\d+(\.\d+)?rem$/.test(value)) {
        return parseFloat(value) * 16;
      }
      if (/^\d+(\.\d+)?px$/.test(value)) {
        return parseFloat(value);
      }
      if (/^\d+ms$/.test(value)) {
        return parseInt(value, 10);
      }
      return value;
    }
    if (typeof value === "number") {
      if (
        Number.isInteger(value) &&
        value >= 100 &&
        value <= 900 &&
        value % 100 === 0
      ) {
        return String(value);
      }
      return value;
    }
    return value;
  }

  function transformTree(node) {
    if (node === null || node === undefined) {
      return node;
    }
    if (typeof node !== "object" || Array.isArray(node)) {
      return transformValue(node);
    }
    const result = {};
    for (const [key, value] of Object.entries(node)) {
      result[key] = transformTree(value);
    }
    return result;
  }

  const mergedTokens = {
    base: baseTokens.base ?? baseTokens,
    themes: {
      light: { semantic: lightTokens.semantic ?? lightTokens },
      dark: { semantic: darkTokens.semantic ?? darkTokens },
    },
  };
  const nativeTokens = transformTree(mergedTokens);

  const js = [
    "/**",
    " * This file is generated by packages/design-tokens/scripts/generate.mjs.",
    " * Do not edit directly.",
    " */",
    `export const nativeTokens = ${JSON.stringify(nativeTokens, null, 2)};`,
    "",
    "export default nativeTokens;",
    "",
  ].join("\n");

  const dts = [
    "/**",
    " * This file is generated by packages/design-tokens/scripts/generate.mjs.",
    " * Do not edit directly.",
    " */",
    "export type NativeTokenLeaf = string | number | boolean;",
    "export type NativeTokenTree = { readonly [key: string]: NativeTokenLeaf | NativeTokenTree };",
    "export interface NativeDesignTokens {",
    "  readonly base: NativeTokenTree;",
    "  readonly themes: {",
    "    readonly light: { readonly semantic: NativeTokenTree };",
    "    readonly dark: { readonly semantic: NativeTokenTree };",
    "  };",
    "}",
    "export declare const nativeTokens: NativeDesignTokens;",
    "export default nativeTokens;",
    "",
  ].join("\n");

  writeFileSync(path.join(generatedDir, "tokens.native.js"), js);
  writeFileSync(path.join(generatedDir, "tokens.native.d.ts"), dts);
}

function writeGeneratedFiles(
  baseTokens,
  lightTokens,
  darkTokens,
  lightCss,
  darkCss,
) {
  const lightVariables = extractVariableDeclarations(lightCss);
  const darkVariables = extractVariableDeclarations(darkCss);

  const mergedTokens = {
    base: baseTokens.base ?? baseTokens,
    themes: {
      light: {
        semantic: lightTokens.semantic ?? lightTokens,
      },
      dark: {
        semantic: darkTokens.semantic ?? darkTokens,
      },
    },
  };

  const css = [
    "/* This file is generated by packages/design-tokens/scripts/generate.mjs. Do not edit directly. */",
    "",
    formatBlock(':root, [data-theme="light"]', lightVariables, "light"),
    "",
    formatBlock('[data-theme="dark"]', darkVariables, "dark"),
    "",
    formatMediaBlock(":root:not([data-theme])", darkVariables, "dark"),
    "",
  ].join("\n");

  const json = `${JSON.stringify(mergedTokens, null, 2)}\n`;
  const js = [
    "/**",
    " * This file is generated by packages/design-tokens/scripts/generate.mjs.",
    " * Do not edit directly.",
    " */",
    `export const tokens = ${JSON.stringify(mergedTokens, null, 2)};`,
    "",
    "export default tokens;",
    "",
  ].join("\n");
  const dts = [
    "/**",
    " * This file is generated by packages/design-tokens/scripts/generate.mjs.",
    " * Do not edit directly.",
    " */",
    "export type TokenLeaf = string | number | boolean;",
    "export type TokenTree = { readonly [key: string]: TokenLeaf | TokenTree };",
    "export interface DesignTokens {",
    "  readonly base: TokenTree;",
    "  readonly themes: {",
    "    readonly light: { readonly semantic: TokenTree };",
    "    readonly dark: { readonly semantic: TokenTree };",
    "  };",
    "}",
    "export declare const tokens: DesignTokens;",
    "export default tokens;",
    "",
  ].join("\n");

  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(path.join(generatedDir, "tokens.css"), css);
  writeFileSync(path.join(generatedDir, "tokens.json"), json);
  writeFileSync(path.join(generatedDir, "tokens.js"), js);
  writeFileSync(path.join(generatedDir, "tokens.d.ts"), dts);
}

rmSync(tempBuildDir, { recursive: true, force: true });
mkdirSync(tempBuildDir, { recursive: true });

validateBaseColorTokens();

runBuild("base");
runBuild("light");
runBuild("dark");

const baseTokens = readJson("base.json");
const lightTokens = readJson("light.semantic.json");
const darkTokens = readJson("dark.semantic.json");
const lightCss = readFileSync(path.join(tempBuildDir, "light.css"), "utf8");
const darkCss = readFileSync(path.join(tempBuildDir, "dark.css"), "utf8");

validateSemanticTokenParity(lightTokens, darkTokens);
validateSemanticColorContrast("light", lightTokens);
validateSemanticColorContrast("dark", darkTokens);

writeGeneratedFiles(baseTokens, lightTokens, darkTokens, lightCss, darkCss);
writeNativeFile(baseTokens, lightTokens, darkTokens);

rmSync(tempBuildDir, { recursive: true, force: true });
