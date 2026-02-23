import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
  ScaleBarCell,
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
  TokenValuePill,
} from "./token-docs.components";
import {
  asRecord,
  flattenTokenTree,
  parseNumberish,
  stripPathPrefix,
  tokenPrimitiveToString,
} from "./token-docs.helpers";

interface ScaleRow {
  id: string;
  path: string;
  value: string;
}

interface SpacingRow extends ScaleRow {
  widthPx: number;
  widthPercent: number;
}

const base = asRecord(tokens.base, "base");
const spacing = asRecord(base.space, "base.space");
const radius = asRecord(base.radius, "base.radius");
const borderWidth = asRecord(
  asRecord(base.border, "base.border").width,
  "base.border.width",
);
const opacity = asRecord(base.opacity, "base.opacity");
const breakpoints = asRecord(base.breakpoint, "base.breakpoint");
const zIndex = asRecord(base.zIndex, "base.zIndex");

function toScaleRows(node: unknown, prefix: string): ScaleRow[] {
  return flattenTokenTree(node, prefix).map((row) => {
    const value = tokenPrimitiveToString(row.value);
    return {
      id: row.id,
      path: row.path,
      value,
    };
  });
}

function spacingWidth(value: string): number {
  const parsed = parseNumberish(value);
  if (parsed === null) {
    return 6;
  }

  if (value.endsWith("px")) {
    return Math.round(parsed * 12);
  }

  if (value.endsWith("rem")) {
    return Math.round(parsed * 56);
  }

  return Math.round(parsed * 40);
}

function toPercent(value: string, maxValue: number): number {
  const parsed = parseNumberish(value);
  if (parsed === null || maxValue === 0) {
    return 4;
  }
  return Math.max(4, (parsed / maxValue) * 100);
}

const rawSpacingRows = toScaleRows(spacing, "base.space");
const maxSpacingWidth = Math.max(...rawSpacingRows.map((row) => spacingWidth(row.value)));

const spacingRows: SpacingRow[] = rawSpacingRows.map((row) => {
  const widthPx = Math.max(6, spacingWidth(row.value));
  return {
    ...row,
    widthPx,
    widthPercent: Math.max(2, (widthPx / maxSpacingWidth) * 100),
  };
});

const radiusRows = toScaleRows(radius, "base.radius");
const breakpointRows = toScaleRows(breakpoints, "base.breakpoint");

const maxBreakpointValue = Math.max(
  ...breakpointRows.map((row) => parseNumberish(row.value) ?? 0),
);

const spacingReferenceGroups = [
  { id: "spacing", label: "Spacing", rows: spacingRows },
];

const layoutReferenceGroups = [
  { id: "radius", label: "Radius", rows: radiusRows },
  {
    id: "border-width",
    label: "Border Width",
    rows: toScaleRows(borderWidth, "base.border.width"),
  },
  {
    id: "opacity",
    label: "Opacity",
    rows: toScaleRows(opacity, "base.opacity"),
  },
  {
    id: "breakpoints",
    label: "Breakpoints",
    rows: breakpointRows,
  },
  {
    id: "z-index",
    label: "Z-Index",
    rows: toScaleRows(zIndex, "base.zIndex"),
  },
];

const preferredSpacingStops = ["0_5", "1", "1_5", "2", "2_5", "3", "4", "6", "8"];
const spacingShowcaseRows = spacingRows.filter((row) => {
  const key = stripPathPrefix(row.path, "base.space");
  return preferredSpacingStops.includes(key);
});

const meta = {
  title: "Foundations/Tokens/Spacing & Layout",
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
        title="Spacing & Layout Tokens"
        subtitle="Applied spacing rhythm and structural previews first. Exact implementation references are in the companion Reference story."
      >
        <TokenSection
          title="Spacing Scale"
          description="Applied mini-layouts make spacing increments easier to compare in realistic contexts."
        >
          <div className="fd-tokendocs-showcase" aria-label="Spacing visual showcase">
            <h3 className="fd-tokendocs-showcaseTitle">Vertical Stack Rhythm</h3>
            <div className="fd-tokendocs-spacingShowcase">
              {spacingShowcaseRows.map((row) => (
                <div key={`${row.id}-stack`} className="fd-tokendocs-spacingRow">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <div className="fd-tokendocs-stackPreview" style={{ gap: row.value }} aria-hidden="true">
                    <span className="fd-tokendocs-stackBlock" />
                    <span className="fd-tokendocs-stackBlock" />
                    <span className="fd-tokendocs-stackBlock" />
                  </div>
                  <TokenValuePill value={row.value} />
                </div>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Inline Cluster Gap</h3>
            <div className="fd-tokendocs-gapPreview">
              {spacingShowcaseRows.map((row) => (
                <div key={`${row.id}-gap`} className="fd-tokendocs-spacingRow">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <div className="fd-tokendocs-gapBlocks" style={{ gap: row.value }} aria-hidden="true">
                    <span className="fd-tokendocs-gapBlock" />
                    <span className="fd-tokendocs-gapBlock" />
                    <span className="fd-tokendocs-gapBlock" />
                  </div>
                  <TokenValuePill value={row.value} />
                </div>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Card Grid Gutter</h3>
            <div className="fd-tokendocs-gapPreview">
              {spacingShowcaseRows.map((row) => (
                <div key={`${row.id}-grid`} className="fd-tokendocs-spacingRow">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <div className="fd-tokendocs-gridGutter" style={{ gap: row.value }} aria-hidden="true">
                    <span className="fd-tokendocs-gridGutterCell" />
                    <span className="fd-tokendocs-gridGutterCell" />
                    <span className="fd-tokendocs-gridGutterCell" />
                    <span className="fd-tokendocs-gridGutterCell" />
                  </div>
                  <TokenValuePill value={row.value} />
                </div>
              ))}
            </div>
          </div>
        </TokenSection>

        <TokenSection
          title="Layout and Structural Scales"
          description="Radius and breakpoints get concise visual previews for rapid implementation checks."
        >
          <div className="fd-tokendocs-showcase" aria-label="Structural token showcase">
            <h3 className="fd-tokendocs-showcaseTitle">Radius Preview</h3>
            <div className="fd-tokendocs-structShowcase">
              {radiusRows.map((row) => (
                <article key={`${row.id}-radius`} className="fd-tokendocs-radiusCard">
                  <div
                    className="fd-tokendocs-radiusSwatch"
                    style={{ borderRadius: row.value }}
                    aria-hidden="true"
                  />
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.radius")}
                  </span>
                  <TokenValuePill value={row.value} />
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Breakpoint Ladder</h3>
            <div className="fd-tokendocs-spacingShowcase">
              {breakpointRows.map((row) => (
                <div key={`${row.id}-breakpoint`} className="fd-tokendocs-spacingRow">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.breakpoint")}
                  </span>
                  <div className="fd-tokendocs-spacingTrack" aria-hidden="true">
                    <span
                      className="fd-tokendocs-spacingTrackBar"
                      style={{ width: `${toPercent(row.value, maxBreakpointValue)}%` }}
                    />
                  </div>
                  <TokenValuePill value={row.value} />
                </div>
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
      canvas.getByRole("heading", { name: "Spacing & Layout Tokens" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Vertical Stack Rhythm")).toBeInTheDocument();
    await expect(canvas.getByText("Card Grid Gutter")).toBeInTheDocument();
    await expect(canvas.queryByPlaceholderText(/search token path or value/i)).not.toBeInTheDocument();
  },
};

export const Reference: Story = {
  render: () => {
    return (
      <TokenDocsPage
        title="Spacing & Layout Token Reference"
        subtitle="Deterministic grouped tables for spacing and structural scales with copy actions."
      >
        <TokenSection
          title="Spacing References"
          description="Complete base spacing path/value references."
        >
          <TokenDataGrid
            gridLabel="spacing-grid"
            groups={spacingReferenceGroups}
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(280px, 1.5fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "value",
                label: "Value",
                width: "minmax(340px, 1.5fr)",
                getValue: (row) => row.value,
                render: (row) => (
                  <ScaleBarCell value={row.value} widthPx={row.widthPx} />
                ),
                valueMode: "plain",
                copyValue: (row) => row.value,
              },
            ]}
          />
        </TokenSection>

        <TokenSection
          title="Layout & Structural References"
          description="Radius, border, opacity, breakpoint, and z-index path/value references."
        >
          <TokenDataGrid
            gridLabel="layout-grid"
            groups={layoutReferenceGroups}
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(320px, 1.8fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "value",
                label: "Value",
                width: "minmax(260px, 1fr)",
                align: "right",
                getValue: (row) => row.value,
                valueMode: "plain",
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
      canvas.getByRole("heading", { name: "Spacing & Layout Token Reference" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Spacing References")).toBeInTheDocument();
  },
};
