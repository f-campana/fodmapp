
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
  ReferenceTables,
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
  searchText: string;
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
      searchText: `${row.path} ${value}`,
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
const maxSpacingWidth = Math.max(
  ...rawSpacingRows.map((row) => spacingWidth(row.value)),
);

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

const layoutGroups = [
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
  { id: "z-index", label: "Z-Index", rows: toScaleRows(zIndex, "base.zIndex") },
];

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

export const Reference: Story = {
  render: () => {
    const spacingAppliedRows = spacingRows.slice(1, 9);
    const spacingGridRows = spacingRows.slice(4, 12);

    return (
      <TokenDocsPage
        title="Spacing & Layout Tokens"
        subtitle="Applied spacing rhythm and structural previews first, with collapsed path/value references below."
      >
        <TokenSection
          title="Spacing Scale"
          description="Applied examples make spacing increments easier to compare in realistic layout contexts."
        >
          <div className="fd-tokendocs-showcase" aria-label="Spacing visual showcase">
            <h3 className="fd-tokendocs-showcaseTitle">Vertical Stack Rhythm</h3>
            <div className="fd-tokendocs-spacingShowcase">
              {spacingAppliedRows.map((row) => (
                <div key={`${row.id}-preview`} className="fd-tokendocs-spacingRow">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <div
                    className="fd-tokendocs-stackPreview"
                    style={{ gap: row.value }}
                    aria-hidden="true"
                  >
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
              {spacingAppliedRows.map((row) => (
                <div key={`${row.id}-gap`} className="fd-tokendocs-spacingRow">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <div className="fd-tokendocs-gapBlocks" style={{ gap: row.value }}>
                    <span className="fd-tokendocs-gapBlock" />
                    <span className="fd-tokendocs-gapBlock" />
                  </div>
                  <TokenValuePill value={row.value} />
                </div>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Grid Gutter Example</h3>
            <div className="fd-tokendocs-gapPreview">
              {spacingGridRows.map((row) => (
                <div key={`${row.id}-grid`} className="fd-tokendocs-spacingRow">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <div
                    className="fd-tokendocs-gridGutter"
                    style={{ gap: row.value }}
                    aria-hidden="true"
                  >
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

          <ReferenceTables hint="Expand for exact spacing path/value references.">
            <TokenDataGrid
              gridLabel="spacing-grid"
              groups={[{ id: "spacing", label: "Spacing", rows: spacingRows }]}
              showToolbar={false}
              columns={[
                {
                  key: "path",
                  label: "Token Path",
                  width: "minmax(280px, 1.5fr)",
                  sortable: false,
                  getValue: (row) => row.path,
                  render: (row) => <TokenPathText value={row.path} />,
                  valueMode: "plain",
                  copyValue: (row) => row.path,
                },
                {
                  key: "value",
                  label: "Value",
                  width: "minmax(340px, 1.5fr)",
                  sortable: false,
                  getValue: (row) => row.value,
                  render: (row) => (
                    <ScaleBarCell value={row.value} widthPx={row.widthPx} />
                  ),
                  valueMode: "plain",
                  copyValue: (row) => row.value,
                },
              ]}
            />
          </ReferenceTables>
        </TokenSection>

        <TokenSection
          title="Layout and Structural Scales"
          description="Radius and breakpoints get direct visual previews; all structural tokens remain listed below."
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

          <ReferenceTables hint="Expand for exact radius/border/opacity/breakpoint/z-index references.">
            <TokenDataGrid
              gridLabel="layout-grid"
              groups={layoutGroups}
              showToolbar={false}
              columns={[
                {
                  key: "path",
                  label: "Token Path",
                  width: "minmax(320px, 1.8fr)",
                  sortable: false,
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
                  sortable: false,
                  getValue: (row) => row.value,
                  valueMode: "plain",
                  copyValue: (row) => row.value,
                },
              ]}
            />
          </ReferenceTables>
        </TokenSection>
      </TokenDocsPage>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Spacing & Layout Tokens" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Inline Cluster Gap")).toBeInTheDocument();
    await expect(canvas.getByText("Grid Gutter Example")).toBeInTheDocument();
    await expect(canvas.getByText("Breakpoint Ladder")).toBeInTheDocument();
  },
};
