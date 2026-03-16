import tokens from "@fodmapp/design-tokens";

import {
  asRecord,
  createStringTokenRows,
  createThemeTokenRows,
} from "./token-docs.helpers";

export interface EffectRow {
  id: string;
  path: string;
  value: string;
}

export interface MotionLaneRow {
  id: string;
  label: string;
  path: string;
  value: string;
  hasBaseline: boolean;
  tokenDuration: string;
  tokenEasing: string;
  tokenStaticLeft?: string;
  baselineDuration?: string;
  baselineEasing?: string;
  baselineDelay?: string;
  tokenDelay: string;
}

export interface SemanticMotionRow {
  id: string;
  path: string;
  light: string;
  dark: string;
}

const SHARED_LANE_DELAY_MS = -560;
const EASING_SLOW_FACTOR = 10;
const DURATION_VISUAL_FACTOR = 9;
const MIN_MOTION_DURATION_MS = 900;
const MAX_MOTION_DURATION_MS = 3900;

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const motion = asRecord(base.motion, "base.motion");
const shadows = asRecord(base.shadow, "base.shadow");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");
const semanticLight = asRecord(lightTheme.semantic, "themes.light.semantic");
const semanticDark = asRecord(darkTheme.semantic, "themes.dark.semantic");

function toRows(node: unknown, prefix: string): EffectRow[] {
  return createStringTokenRows(node, prefix);
}

export function parseDurationMs(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith("ms")) {
    const parsed = Number.parseFloat(trimmed.slice(0, -2));
    return Number.isFinite(parsed) ? parsed : 180;
  }

  if (trimmed.endsWith("s")) {
    const parsed = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(parsed) ? parsed * 1000 : 180;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 180;
}

function laneDuration(value: string, factor = DURATION_VISUAL_FACTOR): string {
  const ms = parseDurationMs(value);
  const scaledMs = Math.round(
    Math.min(
      MAX_MOTION_DURATION_MS,
      Math.max(MIN_MOTION_DURATION_MS, ms * factor),
    ),
  );
  return `${scaledMs}ms`;
}

function createOrderedTokenRows(
  node: unknown,
  prefix: string,
  order: string[],
) {
  const rows = toRows(node, prefix);
  const orderMap = new Map(order.map((key, index) => [key, index]));

  return [...rows].sort((left, right) => {
    const leftKey = left.path.split(".").pop() ?? left.path;
    const rightKey = right.path.split(".").pop() ?? right.path;
    const leftIndex = leftKey ? orderMap.get(leftKey) : undefined;
    const rightIndex = rightKey ? orderMap.get(rightKey) : undefined;

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }

    if (leftIndex !== undefined) {
      return -1;
    }

    if (rightIndex !== undefined) {
      return 1;
    }

    return leftKey.localeCompare(rightKey);
  });
}

export const durationRows = createOrderedTokenRows(
  asRecord(motion.duration, "base.motion.duration"),
  "base.motion.duration",
  ["instant", "fast", "normal", "slow", "slower"],
);
export const easingRows = createOrderedTokenRows(
  asRecord(motion.easing, "base.motion.easing"),
  "base.motion.easing",
  ["linear", "standard", "accelerated", "decelerated", "emphasized"],
);

const standardEasing =
  easingRows.find((row) => row.path.endsWith(".standard"))?.value ?? "linear";
const baselineEasing = "linear";
const normalDuration =
  durationRows.find((row) => row.path.endsWith(".normal"))?.value ??
  durationRows[0]?.value ??
  "180ms";
const easingLaneDuration = laneDuration(normalDuration, EASING_SLOW_FACTOR);

export const durationLaneRows: MotionLaneRow[] = durationRows.map((row) => {
  const durationMs = parseDurationMs(row.value);
  const isInstant = durationMs === 0;
  const sharedDelay = `${SHARED_LANE_DELAY_MS}ms`;

  return {
    id: `duration:${row.id}`,
    label: row.path.split(".").pop() ?? row.path,
    path: row.path,
    value: row.value,
    hasBaseline: false,
    tokenDuration: isInstant ? "1ms" : laneDuration(row.value),
    tokenEasing: standardEasing,
    tokenStaticLeft: isInstant ? "calc(100% - 0.98rem)" : undefined,
    tokenDelay: sharedDelay,
  };
});

export const easingLaneRows: MotionLaneRow[] = easingRows.map((row) => {
  const sharedDelay = `${SHARED_LANE_DELAY_MS}ms`;

  return {
    id: `easing:${row.id}`,
    label: row.path.split(".").pop() ?? row.path,
    path: row.path,
    value: row.value,
    hasBaseline: true,
    tokenDuration: easingLaneDuration,
    tokenEasing: row.value,
    baselineDuration: easingLaneDuration,
    baselineEasing,
    baselineDelay: sharedDelay,
    tokenDelay: sharedDelay,
  };
});

export const motionGroups = [
  {
    id: "durations",
    label: "Durations",
    rows: durationRows,
  },
  {
    id: "easing",
    label: "Easing Curves",
    rows: easingRows,
  },
];

export const shadowRows = toRows(shadows, "base.shadow");
export const shadowGroups = [
  { id: "shadow", label: "Shadow Scale", rows: shadowRows },
];

export const semanticMotionRows: SemanticMotionRow[] = createThemeTokenRows(
  asRecord(semanticLight.motion, "themes.light.semantic.motion"),
  asRecord(semanticDark.motion, "themes.dark.semantic.motion"),
  "semantic.motion",
);
export const semanticMotionGroups = [
  {
    id: "semantic-motion",
    label: "Semantic Motion",
    rows: semanticMotionRows,
  },
];
export const semanticMotionByPath = new Map(
  semanticMotionRows.map((row) => [row.path, row]),
);
export const requiredSemanticMotionPaths = [
  "semantic.motion.interactiveDuration",
  "semantic.motion.interactiveEasing",
] as const;
