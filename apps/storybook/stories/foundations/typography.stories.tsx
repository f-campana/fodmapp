import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
  TokenValuePill,
  useTokenDocsResetScrollOnMount,
} from "./token-docs.components";
import {
  asRecord,
  compareFontWeightRows,
  compareLetterSpacingRows,
  compareLineHeightRows,
  createSortedRows,
  flattenTokenTree,
  naturalTokenPathCompare,
  tokenPrimitiveToString,
} from "./token-docs.helpers";

interface TypographyRow {
  id: string;
  path: string;
  value: string;
}

interface SemanticTypographyRow {
  id: string;
  path: string;
  light: string;
  dark: string;
}

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const typography = asRecord(base.typography, "base.typography");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");
const semanticLight = asRecord(lightTheme.semantic, "themes.light.semantic");
const semanticDark = asRecord(darkTheme.semantic, "themes.dark.semantic");

function rowsFor(node: unknown, prefix: string): TypographyRow[] {
  return flattenTokenTree(node, prefix).map((row) => {
    const value = tokenPrimitiveToString(row.value);
    return {
      id: row.id,
      path: row.path,
      value,
    };
  });
}

function themedRowsFor(
  lightNode: unknown,
  darkNode: unknown,
  prefix: string,
): SemanticTypographyRow[] {
  const lightRows = rowsFor(lightNode, prefix);
  const darkRows = rowsFor(darkNode, prefix);

  const lightByPath = new Map(lightRows.map((row) => [row.path, row.value]));
  const darkByPath = new Map(darkRows.map((row) => [row.path, row.value]));
  const paths = [
    ...new Set([...lightByPath.keys(), ...darkByPath.keys()]),
  ].sort((left, right) => naturalTokenPathCompare(left, right));

  return paths.map((path) => ({
    id: path,
    path,
    light: lightByPath.get(path) ?? "",
    dark: darkByPath.get(path) ?? "",
  }));
}

function clampRem(value: string, maxRem: number): string {
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

function cssNumberOrString(value: string): number | string {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed) && `${parsed}` === value) {
    return parsed;
  }
  return value;
}

function formatTypographyReferenceValue(row: TypographyRow): string {
  if (row.path.includes(".fontFamily.")) {
    return row.value.replace(/,\s*/g, ", ");
  }

  return row.value;
}

function formatSemanticTypographyValue(value: string): string {
  return value.replace(/,\s*/g, ", ");
}

const MAX_SPECIMEN_REM = 2.5;
const SHOWCASE_SIZE_STOPS = ["xs", "sm", "md", "lg", "xl", "2xl", "4xl"];

const familyRows = rowsFor(
  asRecord(typography.fontFamily, "base.typography.fontFamily"),
  "base.typography.fontFamily",
);
const sizeRows = rowsFor(
  asRecord(typography.fontSize, "base.typography.fontSize"),
  "base.typography.fontSize",
);
const weightRows = createSortedRows(
  rowsFor(
    asRecord(typography.fontWeight, "base.typography.fontWeight"),
    "base.typography.fontWeight",
  ),
  compareFontWeightRows,
);
const lineHeightRows = createSortedRows(
  rowsFor(
    asRecord(typography.lineHeight, "base.typography.lineHeight"),
    "base.typography.lineHeight",
  ),
  compareLineHeightRows,
);
const letterSpacingRows = createSortedRows(
  rowsFor(
    asRecord(typography.letterSpacing, "base.typography.letterSpacing"),
    "base.typography.letterSpacing",
  ),
  compareLetterSpacingRows,
);

const semanticTypographyRows = themedRowsFor(
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
      asRecord(semanticDark.typography, "themes.dark.semantic.typography").font,
      "themes.dark.semantic.typography.font",
    ).family,
    "themes.dark.semantic.typography.font.family",
  ),
  "semantic.typography.font.family",
);
const semanticTypographyByPath = new Map(
  semanticTypographyRows.map((row) => [row.path, row]),
);
const requiredSemanticTypographyPaths = [
  "semantic.typography.font.family.body",
  "semantic.typography.font.family.display",
] as const;

const lineHeightDefault =
  lineHeightRows.find((row) => row.path.endsWith(".normal"))?.value ?? "1.5";

const sizeShowcaseRows = sizeRows.filter((row) =>
  SHOWCASE_SIZE_STOPS.includes(row.path.split(".").pop() ?? ""),
);

const groups = [
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

const semanticGroups = [
  {
    id: "semantic-families",
    label: "Semantic Font Families",
    rows: semanticTypographyRows,
  },
];

const meta = {
  title: "Foundations/Tokens/Typography",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function TypographyReferenceStory() {
  useTokenDocsResetScrollOnMount();

  return (
    <TokenDocsPage
      title="Typography Token Reference"
      subtitle="Exact token paths and values for implementation and QA checks."
    >
      <TokenSection
        title="Typography Primitives"
        description="Grouped deterministic tables for all typography token domains."
      >
        <TokenDataGrid
          gridLabel="typography-grid"
          groups={groups}
          accordion
          allowCollapseAll={false}
          initialOpenGroupId="families"
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(360px, 1.8fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(320px, 1fr)",
              align: "right",
              getValue: (row) => row.value,
              render: (row) => (
                <span className="fd-tokendocs-value-plain fd-tokendocs-value-wrapSoft">
                  {formatTypographyReferenceValue(row)}
                </span>
              ),
              valueMode: "plain",
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Semantic Typography References"
        description="Theme-level semantic typography family tokens (light and dark)."
      >
        <TokenDataGrid
          gridLabel="semantic-typography-grid"
          groups={semanticGroups}
          accordion
          allowCollapseAll={false}
          initialOpenGroupId="semantic-families"
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(360px, 1.8fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "light",
              label: "Light",
              width: "minmax(300px, 1fr)",
              getValue: (row) => row.light,
              render: (row) => (
                <span className="fd-tokendocs-value-plain fd-tokendocs-value-wrapSoft">
                  {formatSemanticTypographyValue(row.light)}
                </span>
              ),
              valueMode: "plain",
              copyValue: (row) => row.light,
            },
            {
              key: "dark",
              label: "Dark",
              width: "minmax(300px, 1fr)",
              getValue: (row) => row.dark,
              render: (row) => (
                <span className="fd-tokendocs-value-plain fd-tokendocs-value-wrapSoft">
                  {formatSemanticTypographyValue(row.dark)}
                </span>
              ),
              valueMode: "plain",
              copyValue: (row) => row.dark,
            },
          ]}
        />
      </TokenSection>
    </TokenDocsPage>
  );
}

export const Showcase: Story = {
  render: () => {
    return (
      <TokenDocsPage
        title="Typography Tokens"
        subtitle="Specimen-first preview of tokenized families, scale, and weights. Exact path/value references are in the companion Reference story."
      >
        <TokenSection
          title="Typography Showcase"
          description="Token-driven specimens with tighter hierarchy and less repetitive vertical flow."
        >
          <div
            className="fd-tokendocs-showcase fd-tokendocs-typoShowcase"
            aria-label="Typography specimens"
          >
            <h3 className="fd-tokendocs-showcaseTitle">Family Specimens</h3>
            <div className="fd-tokendocs-typoSpecimens">
              {familyRows.map((row) => (
                <article key={row.id} className="fd-tokendocs-typoCard">
                  <p
                    className="fd-tokendocs-typoSample"
                    style={{ fontFamily: row.value }}
                  >
                    Digestive support starts with readable hierarchy.
                  </p>
                  <div className="fd-tokendocs-typoMeta">
                    <span className="fd-tokendocs-typoLabel">
                      {row.path.split(".").pop()}
                    </span>
                    <p className="fd-tokendocs-typoValue">{row.value}</p>
                  </div>
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Type Waterfall</h3>
            <div className="fd-tokendocs-typeScaleList">
              {sizeShowcaseRows.map((row) => (
                <div
                  key={`${row.id}-sample`}
                  className="fd-tokendocs-typeScaleItem"
                >
                  <span className="fd-tokendocs-typeKey">
                    {row.path.split(".").pop()}
                  </span>
                  <p
                    className="fd-tokendocs-typeSample"
                    style={{
                      fontSize: clampRem(row.value, MAX_SPECIMEN_REM),
                      lineHeight: lineHeightDefault,
                    }}
                  >
                    Digestive calm starts with clear type rhythm.
                  </p>
                  <TokenValuePill value={row.value} />
                </div>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Weight Spectrum</h3>
            <div
              className="fd-tokendocs-weightBand"
              aria-label="Typography weight comparison"
            >
              {weightRows.map((row) => (
                <article
                  key={`${row.id}-weight`}
                  className="fd-tokendocs-weightBandCell"
                >
                  <p
                    className="fd-tokendocs-weightCellSample"
                    style={{
                      fontWeight: cssNumberOrString(row.value),
                    }}
                  >
                    Digestive support rhythm across interface states.
                  </p>
                  <div className="fd-tokendocs-weightBandMeta">
                    <span className="fd-tokendocs-weightTokenMeta">
                      {row.path.split(".").pop()} / {row.value}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TokenSection>
      </TokenDocsPage>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Typography Tokens" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Type Waterfall")).toBeInTheDocument();
    await expect(
      canvas.queryByPlaceholderText(/search token path or value/i),
    ).not.toBeInTheDocument();

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },
};

export const Reference: Story = {
  render: () => <TypographyReferenceStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Typography Token Reference" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Typography Primitives")).toBeInTheDocument();
    await expect(
      canvas.getByText("Semantic Typography References"),
    ).toBeInTheDocument();

    const familiesSection = canvasElement.querySelector(
      "#typography-grid-families",
    );
    const sizesSection = canvasElement.querySelector("#typography-grid-sizes");
    if (!familiesSection || !sizesSection) {
      throw new Error("Expected typography sections to exist.");
    }

    await expect(familiesSection).toHaveAttribute("data-expanded", "true");
    await expect(sizesSection).toHaveAttribute("data-expanded", "false");

    const sizesToggle = sizesSection.querySelector(".fd-tokendocs-groupToggle");
    if (!sizesToggle) {
      throw new Error("Expected sizes toggle to exist.");
    }

    await userEvent.click(sizesToggle);
    await expect(sizesSection).toHaveAttribute("data-expanded", "true");
    await expect(familiesSection).toHaveAttribute("data-expanded", "false");

    await userEvent.click(sizesToggle);
    await expect(sizesSection).toHaveAttribute("data-expanded", "true");
    await expect(familiesSection).toHaveAttribute("data-expanded", "false");

    const familiesToggle = familiesSection.querySelector(
      ".fd-tokendocs-groupToggle",
    );
    if (!familiesToggle) {
      throw new Error("Expected families toggle to exist.");
    }
    await userEvent.click(familiesToggle);
    await expect(familiesSection).toHaveAttribute("data-expanded", "true");
    await expect(sizesSection).toHaveAttribute("data-expanded", "false");

    for (const path of requiredSemanticTypographyPaths) {
      const row = semanticTypographyByPath.get(path);
      await expect(
        row,
        `Missing semantic typography token row for ${path}`,
      ).toBeDefined();
      await expect(
        row !== undefined && row.light.trim().length > 0,
        `Expected light semantic typography value for ${path}`,
      ).toBe(true);
      await expect(
        row !== undefined && row.dark.trim().length > 0,
        `Expected dark semantic typography value for ${path}`,
      ).toBe(true);
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },
};
