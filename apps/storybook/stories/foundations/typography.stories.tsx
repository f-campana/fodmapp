import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
  TokenValuePill,
} from "./token-docs.components";
import {
  asRecord,
  flattenTokenTree,
  tokenPrimitiveToString,
} from "./token-docs.helpers";

interface TypographyRow {
  id: string;
  path: string;
  value: string;
}

const base = asRecord(tokens.base, "base");
const typography = asRecord(base.typography, "base.typography");

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

const MAX_SPECIMEN_REM = 2.4;

function cssNumberOrString(value: string): number | string {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed) && `${parsed}` === value) {
    return parsed;
  }
  return value;
}

const familyRows = rowsFor(
  asRecord(typography.fontFamily, "base.typography.fontFamily"),
  "base.typography.fontFamily",
);
const sizeRows = rowsFor(
  asRecord(typography.fontSize, "base.typography.fontSize"),
  "base.typography.fontSize",
);
const weightRows = rowsFor(
  asRecord(typography.fontWeight, "base.typography.fontWeight"),
  "base.typography.fontWeight",
);
const lineHeightRows = rowsFor(
  asRecord(typography.lineHeight, "base.typography.lineHeight"),
  "base.typography.lineHeight",
);
const letterSpacingRows = rowsFor(
  asRecord(typography.letterSpacing, "base.typography.letterSpacing"),
  "base.typography.letterSpacing",
);

const lineHeightDefault =
  lineHeightRows.find((row) => row.path.endsWith(".normal"))?.value ?? "1.5";

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

export const Showcase: Story = {
  render: () => {
    return (
      <TokenDocsPage
        title="Typography Tokens"
        subtitle="Specimen-first preview of tokenized families, scale, and weights. Exact path/value references are in the companion Reference story."
      >
        <TokenSection
          title="Typography Showcase"
          description="Token-driven specimens with stronger hierarchy and reduced vertical excess for easier scanning."
        >
          <div className="fd-tokendocs-showcase fd-tokendocs-typoShowcase" aria-label="Typography specimens">
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
                    <span className="fd-tokendocs-typoLabel">{row.path.split(".").pop()}</span>
                    <p className="fd-tokendocs-typoValue">{row.value}</p>
                  </div>
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Type Waterfall</h3>
            <div className="fd-tokendocs-typeScaleList">
              {sizeRows.map((row) => (
                <div key={`${row.id}-sample`} className="fd-tokendocs-typeScaleItem">
                  <span className="fd-tokendocs-typeKey">{row.path.split(".").pop()}</span>
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
            <div className="fd-tokendocs-typoSpecimens">
              {weightRows.map((row) => (
                <article key={`${row.id}-weight`} className="fd-tokendocs-typoCard">
                  <p
                    className="fd-tokendocs-weightSample"
                    style={{
                      fontWeight: cssNumberOrString(row.value),
                      fontSize: "1.2rem",
                      lineHeight: 1.3,
                    }}
                  >
                    Digestive support rhythm across interface states.
                  </p>
                  <div className="fd-tokendocs-typoMeta">
                    <span className="fd-tokendocs-typoLabel">
                      {row.path.split(".").pop()} {row.value}
                    </span>
                    <p className="fd-tokendocs-typoValue">base.typography.fontWeight</p>
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
    await expect(canvas.queryByPlaceholderText(/search token path or value/i)).not.toBeInTheDocument();
  },
};

export const Reference: Story = {
  render: () => {
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
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(340px, 1.8fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "value",
                label: "Value",
                width: "minmax(280px, 1fr)",
                getValue: (row) => row.value,
                valueMode: "wrap",
                copyValue: (row) => row.value,
              },
            ]}
          />
        </TokenSection>
      </TokenDocsPage>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Typography Token Reference" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Typography Primitives")).toBeInTheDocument();
  },
};
