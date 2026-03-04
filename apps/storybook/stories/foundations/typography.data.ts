import tokens from "@fodmap/design-tokens";

import {
  asRecord,
  compareFontWeightRows,
  compareLetterSpacingRows,
  compareLineHeightRows,
  createSortedRows,
  createStringTokenRows,
  createThemeTokenRows,
} from "./token-docs.helpers";

export interface TypographyRow {
  id: string;
  path: string;
  value: string;
}

export interface SemanticTypographyRow {
  id: string;
  path: string;
  light: string;
  dark: string;
}

const MAX_SPECIMEN_REM = 2.5;
const SHOWCASE_SIZE_STOPS = ["xs", "sm", "md", "lg", "xl", "2xl", "4xl"];

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const typography = asRecord(base.typography, "base.typography");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");
const semanticLight = asRecord(lightTheme.semantic, "themes.light.semantic");
const semanticDark = asRecord(darkTheme.semantic, "themes.dark.semantic");

export const familyRows: TypographyRow[] = createStringTokenRows(
  asRecord(typography.fontFamily, "base.typography.fontFamily"),
  "base.typography.fontFamily",
);
export const sizeRows: TypographyRow[] = createStringTokenRows(
  asRecord(typography.fontSize, "base.typography.fontSize"),
  "base.typography.fontSize",
);
export const weightRows = createSortedRows(
  createStringTokenRows(
    asRecord(typography.fontWeight, "base.typography.fontWeight"),
    "base.typography.fontWeight",
  ),
  compareFontWeightRows,
);
export const lineHeightRows = createSortedRows(
  createStringTokenRows(
    asRecord(typography.lineHeight, "base.typography.lineHeight"),
    "base.typography.lineHeight",
  ),
  compareLineHeightRows,
);
export const letterSpacingRows = createSortedRows(
  createStringTokenRows(
    asRecord(typography.letterSpacing, "base.typography.letterSpacing"),
    "base.typography.letterSpacing",
  ),
  compareLetterSpacingRows,
);

export const semanticTypographyRows: SemanticTypographyRow[] =
  createThemeTokenRows(
    asRecord(
      asRecord(
        asRecord(semanticLight.typography, "themes.light.semantic.typography")
          .font,
        "themes.light.semantic.typography.font",
      ).family,
      "themes.light.semantic.typography.font.family",
    ),
    asRecord(
      asRecord(
        asRecord(semanticDark.typography, "themes.dark.semantic.typography")
          .font,
        "themes.dark.semantic.typography.font",
      ).family,
      "themes.dark.semantic.typography.font.family",
    ),
    "semantic.typography.font.family",
  );
export const semanticTypographyByPath = new Map(
  semanticTypographyRows.map((row) => [row.path, row]),
);

export const lineHeightDefault =
  lineHeightRows.find((row) => row.path.endsWith(".normal"))?.value ?? "1.5";

export const sizeShowcaseRows = sizeRows.filter((row) =>
  SHOWCASE_SIZE_STOPS.includes(row.path.split(".").pop() ?? ""),
);

export const requiredSemanticTypographyPaths = [
  "semantic.typography.font.family.body",
  "semantic.typography.font.family.display",
] as const;

export const groups = [
  {
    id: "families",
    label: "Font Families",
    rows: familyRows,
  },
  {
    id: "sizes",
    label: "Font Sizes",
    rows: sizeRows,
  },
  {
    id: "weights",
    label: "Font Weights",
    rows: weightRows,
  },
  {
    id: "line-heights",
    label: "Line Heights",
    rows: lineHeightRows,
  },
  {
    id: "letter-spacing",
    label: "Letter Spacing",
    rows: letterSpacingRows,
  },
];

export const semanticGroups = [
  {
    id: "semantic-families",
    label: "Semantic Font Families",
    rows: semanticTypographyRows,
  },
];

export function clampRem(value: string, maxRem = MAX_SPECIMEN_REM): string {
  const match = value.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (!match) {
    return value;
  }

  const parsed = Number.parseFloat(match[1]);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return `${Math.min(parsed, maxRem)}rem`;
}

export function cssNumberOrString(value: string): number | string {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed) && `${parsed}` === value) {
    return parsed;
  }
  return value;
}

export function formatTypographyReferenceValue(row: TypographyRow): string {
  if (row.path.includes(".fontFamily.")) {
    return row.value.replace(/,\s*/g, ", ");
  }

  return row.value;
}

export function formatSemanticTypographyValue(value: string): string {
  return value.replace(/,\s*/g, ", ");
}
