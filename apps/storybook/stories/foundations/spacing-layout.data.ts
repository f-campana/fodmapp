import tokens from "@fodmapp/design-tokens";

import {
  asRecord,
  compareTokenRowsByPathSuffix,
  createSortedRows,
  createStringTokenRows,
  createThemeTokenRows,
  parseNumberish,
  stripPathPrefix,
} from "./token-docs.helpers";

export interface ScaleRow {
  id: string;
  path: string;
  value: string;
}

export interface SemanticScaleRow {
  id: string;
  path: string;
  light: string;
  dark: string;
}

const SHOWCASE_STOPS = ["0_5", "1", "2", "4", "6", "8"];
export const BREAKPOINT_TICKS = 5;
export const BREAKPOINT_TICK_MARKS = ["0", "25", "50", "75", "100"];

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const spacing = asRecord(base.space, "base.space");
const radius = asRecord(base.radius, "base.radius");
const borderWidth = asRecord(
  asRecord(base.border, "base.border").width,
  "base.border.width",
);
const opacity = asRecord(base.opacity, "base.opacity");
const breakpoints = asRecord(base.breakpoint, "base.breakpoint");
const zIndex = asRecord(base.zIndex, "base.zIndex");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");
const semanticLight = asRecord(lightTheme.semantic, "themes.light.semantic");
const semanticDark = asRecord(darkTheme.semantic, "themes.dark.semantic");

function toScaleRows(node: unknown, prefix: string): ScaleRow[] {
  return createSortedRows(
    createStringTokenRows(node, prefix),
    compareTokenRowsByPathSuffix,
  );
}

export function toPercent(value: string, maxValue: number): number {
  const parsed = parseNumberish(value);
  if (parsed === null || maxValue === 0) {
    return 0;
  }

  return Math.max(4, (parsed / maxValue) * 100);
}

export function normalizeRadiusValue(value: string): string {
  return value === "full" ? "9999px" : value;
}

export const spacingRows = toScaleRows(spacing, "base.space");
export const radiusRows = toScaleRows(radius, "base.radius");
export const breakpointRows = toScaleRows(breakpoints, "base.breakpoint");
export const borderWidthRows = toScaleRows(borderWidth, "base.border.width");
export const opacityRows = toScaleRows(opacity, "base.opacity");
export const zIndexRows = toScaleRows(zIndex, "base.zIndex");
export const semanticRadiusRows: SemanticScaleRow[] = createThemeTokenRows(
  asRecord(semanticLight.radius, "themes.light.semantic.radius"),
  asRecord(semanticDark.radius, "themes.dark.semantic.radius"),
  "semantic.radius",
);
export const semanticSpaceRows: SemanticScaleRow[] = createThemeTokenRows(
  asRecord(semanticLight.space, "themes.light.semantic.space"),
  asRecord(semanticDark.space, "themes.dark.semantic.space"),
  "semantic.space",
);

export const requiredSemanticSpacingPaths = [
  "semantic.radius.control",
  "semantic.radius.container",
  "semantic.radius.pill",
  "semantic.space.controlX",
  "semantic.space.controlY",
  "semantic.space.section",
] as const;

export const semanticSpacingByPath = new Map(
  [...semanticRadiusRows, ...semanticSpaceRows].map((row) => [row.path, row]),
);

export const maxBreakpointValue = Math.max(
  ...breakpointRows.map((row) => parseNumberish(row.value) ?? 0),
);

export const spacingShowcaseRows = spacingRows.filter((row) => {
  const key = stripPathPrefix(row.path, "base.space");
  return SHOWCASE_STOPS.includes(key);
});

export const spacingReferenceGroups = [
  { id: "spacing", label: "Spacing", rows: spacingRows },
];

export const layoutReferenceGroups = [
  { id: "radius", label: "Radius", rows: radiusRows },
  { id: "border-width", label: "Border Width", rows: borderWidthRows },
  { id: "opacity", label: "Opacity", rows: opacityRows },
  { id: "breakpoints", label: "Breakpoints", rows: breakpointRows },
  { id: "z-index", label: "Z-Index", rows: zIndexRows },
];

export const semanticReferenceGroups = [
  { id: "semantic-radius", label: "Semantic Radius", rows: semanticRadiusRows },
  { id: "semantic-space", label: "Semantic Space", rows: semanticSpaceRows },
];

export { stripPathPrefix };
