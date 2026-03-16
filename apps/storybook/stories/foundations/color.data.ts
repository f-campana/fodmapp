import tokens from "@fodmapp/design-tokens";

import {
  asRecord,
  compareNumericTokenValues,
  createStringTokenRows,
  createThemeTokenRows,
  groupRowsBySegment,
  isColorTokenValue,
} from "./token-docs.helpers";

export interface BaseColorGridRow {
  id: string;
  path: string;
  value: string;
}

export interface SemanticColorGridRow {
  id: string;
  path: string;
  light: string;
  dark: string;
}

export interface ColorMatrixRow {
  family: string;
  values: Record<string, string | null>;
  sparseStops: Array<{ step: string; value: string }>;
}

export interface BrandPair {
  id: string;
  label: string;
  light: string | null;
  dark: string | null;
}

export interface SemanticPairCard {
  id: string;
  label: string;
  path: string;
  lightBg: string;
  lightFg: string;
  darkBg: string;
  darkFg: string;
}

const brandPairOrder = [
  "canvas",
  "surface",
  "surfaceStrong",
  "surfaceMuted",
  "text",
  "textMuted",
  "border",
  "accent",
  "accentStrong",
  "accentForeground",
  "ring",
  "ringSoft",
  "warning",
  "warningForeground",
  "danger",
  "dangerStrong",
  "dangerForeground",
] as const;

const semanticPairOrder = [
  "action.primary",
  "action.secondary",
  "action.destructive",
  "status.info",
  "status.success",
  "status.warning",
  "status.danger",
] as const;

function compareByPreferredOrder(
  leftLabel: string,
  rightLabel: string,
  preferredOrder: readonly string[],
): number {
  const leftIndex = preferredOrder.indexOf(leftLabel);
  const rightIndex = preferredOrder.indexOf(rightLabel);

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  }

  return leftLabel.localeCompare(rightLabel);
}

function isScaleStep(value: string): boolean {
  return /^\d+$/.test(value);
}

function familySort(left: string, right: string): number {
  const preferredOrder = ["neutral", "blue", "emerald", "amber", "red"];
  const leftIndex = preferredOrder.indexOf(left);
  const rightIndex = preferredOrder.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  }

  return left.localeCompare(right);
}

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");

const baseColorNode = asRecord(base.color, "base.color");
const semanticLightColor = asRecord(
  asRecord(lightTheme.semantic, "themes.light.semantic").color,
  "themes.light.semantic.color",
);
const semanticDarkColor = asRecord(
  asRecord(darkTheme.semantic, "themes.dark.semantic").color,
  "themes.dark.semantic.color",
);

const baseFamilyEntries = Object.entries(baseColorNode)
  .map(([family, node]) => ({
    family,
    scale: asRecord(node, `base.color.${family}`),
  }))
  .sort((left, right) => familySort(left.family, right.family));

const coreFamilyEntries = baseFamilyEntries.filter(
  (entry) =>
    entry.family !== "brand" &&
    Object.keys(entry.scale).some((key) => isScaleStep(key)),
);

const scaleStopCounts = new Map<string, number>();
for (const entry of coreFamilyEntries) {
  for (const stop of Object.keys(entry.scale).filter((key) =>
    isScaleStep(key),
  )) {
    const token = entry.scale[stop];
    if (typeof token !== "string" || !isColorTokenValue(token)) {
      continue;
    }
    scaleStopCounts.set(stop, (scaleStopCounts.get(stop) ?? 0) + 1);
  }
}

export const sharedScaleStops = [...scaleStopCounts.entries()]
  .filter(([, count]) => count >= 2)
  .map(([stop]) => stop)
  .sort(compareNumericTokenValues);

export const sparseScaleStops = Array.from(
  new Set(
    coreFamilyEntries.flatMap((entry) =>
      Object.keys(entry.scale)
        .filter(
          (key) => isScaleStep(key) && (scaleStopCounts.get(key) ?? 0) < 2,
        )
        .filter((step) => {
          const token = entry.scale[step];
          return typeof token === "string" && isColorTokenValue(token);
        }),
    ),
  ),
).sort(compareNumericTokenValues);

export const matrixRows: ColorMatrixRow[] = coreFamilyEntries.map((entry) => {
  const sparseStops = Object.keys(entry.scale)
    .filter((key) => isScaleStep(key) && (scaleStopCounts.get(key) ?? 0) < 2)
    .map((step) => {
      const token = entry.scale[step];
      return {
        step,
        value:
          typeof token === "string" && isColorTokenValue(token) ? token : "",
      };
    })
    .sort((left, right) => compareNumericTokenValues(left.step, right.step))
    .filter((item) => item.value);

  const values = Object.fromEntries(
    sharedScaleStops.map((step) => {
      const token = entry.scale[step];
      return [
        step,
        typeof token === "string" && isColorTokenValue(token) ? token : null,
      ];
    }),
  );

  return {
    family: entry.family,
    values,
    sparseStops,
  };
});

const brandScale = asRecord(baseColorNode.brand, "base.color.brand");
const brandPairsMap = new Map<string, BrandPair>();
for (const [key, value] of Object.entries(brandScale)) {
  if (typeof value !== "string" || !isColorTokenValue(value)) {
    continue;
  }

  const lightMatch = key.match(/^(.*)Light$/);
  if (lightMatch) {
    const pairKey = lightMatch[1];
    const existing = brandPairsMap.get(pairKey) ?? {
      id: pairKey,
      label: pairKey,
      light: null,
      dark: null,
    };
    existing.light = value;
    brandPairsMap.set(pairKey, existing);
    continue;
  }

  const darkMatch = key.match(/^(.*)Dark$/);
  if (darkMatch) {
    const pairKey = darkMatch[1];
    const existing = brandPairsMap.get(pairKey) ?? {
      id: pairKey,
      label: pairKey,
      light: null,
      dark: null,
    };
    existing.dark = value;
    brandPairsMap.set(pairKey, existing);
  }
}

export const brandPairs = [...brandPairsMap.values()].sort((left, right) =>
  compareByPreferredOrder(left.label, right.label, brandPairOrder),
);

const baseColorRows: BaseColorGridRow[] = createStringTokenRows(
  baseColorNode,
  "base.color",
).filter((row) => isColorTokenValue(row.value));

export const baseColorGroups = groupRowsBySegment(
  baseColorRows.map((row) => ({
    id: row.id,
    path: row.path,
    value: row.value,
    valueText: row.value,
  })),
  2,
).map((group, index) => ({
  id: group.id,
  label: group.label,
  defaultCollapsed: index > 0,
  rows: group.rows.map((row) => ({
    id: row.id,
    path: row.path,
    value: row.value,
  })),
}));

const semanticColorRows: SemanticColorGridRow[] = createThemeTokenRows(
  semanticLightColor,
  semanticDarkColor,
  "semantic.color",
  {
    filter: isColorTokenValue,
    missingValue: "-",
  },
);

export const semanticByPath = new Map(
  semanticColorRows.map((row) => [row.path, row]),
);

export const requiredSemanticColorPaths = [
  "semantic.color.focus.ringAccessible",
  "semantic.color.focus.ringSoft",
  "semantic.color.border.control",
  "semantic.color.validation.error.border",
  "semantic.color.validation.error.ring",
  "semantic.color.validation.error.ringSoft",
  "semantic.color.validation.error.text",
  "semantic.color.action.outline.bg",
  "semantic.color.action.outline.bgHover",
  "semantic.color.action.outline.border",
  "semantic.color.action.outline.fg",
  "semantic.color.action.ghost.bgHover",
  "semantic.color.action.ghost.fg",
  "semantic.color.action.destructive.bg",
  "semantic.color.action.destructive.bgHover",
  "semantic.color.action.destructive.fg",
  "semantic.color.action.destructive.bgSubtle",
  "semantic.color.action.destructive.bgSubtleHover",
  "semantic.color.action.destructive.fgSubtle",
  "semantic.color.action.destructive.borderSubtle",
  "semantic.color.action.destructive.ringSubtle",
  "semantic.color.status.success.bgSubtle",
  "semantic.color.status.danger.bgSubtle",
  "semantic.color.data.axis",
  "semantic.color.data.grid",
  "semantic.color.data.track",
] as const;

export const semanticPairCards: SemanticPairCard[] = semanticColorRows
  .filter((row) => row.path.endsWith(".bg"))
  .map((row) => {
    const prefix = row.path.slice(0, -3);
    const lightFg = semanticByPath.get(`${prefix}.fg`)?.light;
    const darkFg = semanticByPath.get(`${prefix}.fg`)?.dark;

    if (
      !lightFg ||
      !darkFg ||
      !isColorTokenValue(row.light) ||
      !isColorTokenValue(row.dark) ||
      !isColorTokenValue(lightFg) ||
      !isColorTokenValue(darkFg)
    ) {
      return null;
    }

    return {
      id: prefix,
      label: prefix.replace(/^semantic\.color\./, ""),
      path: row.path,
      lightBg: row.light,
      lightFg,
      darkBg: row.dark,
      darkFg,
    };
  })
  .filter((value): value is SemanticPairCard => value !== null)
  .sort((left, right) =>
    compareByPreferredOrder(left.label, right.label, semanticPairOrder),
  );

export const semanticColorGroups = groupRowsBySegment(
  semanticColorRows.map((row) => ({
    id: row.id,
    path: row.path,
    value: row.light,
    valueText: row.light,
  })),
  2,
).map((group, index) => ({
  id: group.id,
  label: group.label,
  defaultCollapsed: index > 0,
  rows: semanticColorRows.filter((row) => row.path.split(".")[2] === group.id),
}));

export function makeJumpLinkHandler(
  groupId: string,
  prefix: string,
  onActivateGroup: (groupId: string) => void,
  beginRequest: () => number,
  isCurrentRequest: (requestId: number) => boolean,
) {
  return () => {
    onActivateGroup(groupId);
    if (typeof document === "undefined") {
      return;
    }

    const requestId = beginRequest();
    let lastTop = Number.NaN;
    let stableFrames = 0;
    let attempts = 0;
    const maxAttempts = 28;

    const waitForLayoutSettle = () => {
      if (!isCurrentRequest(requestId)) {
        return;
      }

      const target = document.getElementById(`${prefix}-${groupId}`);
      if (!target) {
        return;
      }

      const currentTop = target.getBoundingClientRect().top;
      if (Number.isFinite(lastTop) && Math.abs(currentTop - lastTop) < 0.75) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }
      lastTop = currentTop;
      attempts += 1;

      if (stableFrames >= 2 || attempts >= maxAttempts) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
        return;
      }

      requestAnimationFrame(waitForLayoutSettle);
    };

    requestAnimationFrame(waitForLayoutSettle);
  };
}
