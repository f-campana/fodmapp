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
  parseNumberish,
  stripPathPrefix,
  tokenPrimitiveToString,
} from "./token-docs.helpers";

interface ScaleRow {
  id: string;
  path: string;
  value: string;
}

const SHOWCASE_STOPS = ["0_5", "1", "2", "4", "6", "8"];

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

function toPercent(value: string, maxValue: number): number {
  const parsed = parseNumberish(value);
  if (parsed === null || maxValue === 0) {
    return 4;
  }

  return Math.max(4, (parsed / maxValue) * 100);
}

const spacingRows = toScaleRows(spacing, "base.space");
const radiusRows = toScaleRows(radius, "base.radius");
const breakpointRows = toScaleRows(breakpoints, "base.breakpoint");
const maxBreakpointValue = Math.max(
  ...breakpointRows.map((row) => parseNumberish(row.value) ?? 0),
);

const spacingShowcaseRows = spacingRows.filter((row) => {
  const key = stripPathPrefix(row.path, "base.space");
  return SHOWCASE_STOPS.includes(key);
});

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
          description="Applied layout modules make spacing deltas immediately readable in practical UI contexts."
        >
          <div className="fd-tokendocs-showcase fd-tokendocs-spacingShowcaseRoot" aria-label="Spacing visual showcase">
            <h3 className="fd-tokendocs-showcaseTitle">Vertical Stack Rhythm</h3>
            <div className="fd-tokendocs-spacingShowcaseModule">
              <p className="fd-tokendocs-showcaseHint">
                Four stacked surfaces use tokenized `gap` values so rhythm changes are instantly visible.
              </p>
            </div>
            <div className="fd-tokendocs-spacingDemoGrid">
              {spacingShowcaseRows.map((row) => (
                <article key={`${row.id}-stack`} className="fd-tokendocs-spacingDemoCard">
                  <div className="fd-tokendocs-stackApplied" style={{ gap: row.value }} aria-hidden="true">
                    <div className="fd-tokendocs-stackAppliedCard" />
                    <div className="fd-tokendocs-stackAppliedCard" />
                    <div className="fd-tokendocs-stackAppliedCard" />
                    <div className="fd-tokendocs-stackAppliedCard" />
                  </div>
                  <div className="fd-tokendocs-spacingDemoMeta">
                    <span className="fd-tokendocs-spacingLabel">
                      {stripPathPrefix(row.path, "base.space")}
                    </span>
                    <TokenValuePill value={row.value} />
                  </div>
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Inline Cluster Gap</h3>
            <div className="fd-tokendocs-spacingShowcaseModule">
              <p className="fd-tokendocs-showcaseHint">
                Chip clusters expose wrap and horizontal spacing behavior at each token step.
              </p>
            </div>
            <div className="fd-tokendocs-spacingDemoGrid">
              {spacingShowcaseRows.map((row) => (
                <article key={`${row.id}-cluster`} className="fd-tokendocs-spacingDemoCard">
                  <div className="fd-tokendocs-clusterApplied" style={{ gap: row.value }} aria-hidden="true">
                    <span className="fd-tokendocs-chip">Low</span>
                    <span className="fd-tokendocs-chip">Moderate</span>
                    <span className="fd-tokendocs-chip">High</span>
                    <span className="fd-tokendocs-chip">None</span>
                    <span className="fd-tokendocs-chip">Review</span>
                    <span className="fd-tokendocs-chip">Safe</span>
                  </div>
                  <div className="fd-tokendocs-spacingDemoMeta">
                    <span className="fd-tokendocs-spacingLabel">
                      {stripPathPrefix(row.path, "base.space")}
                    </span>
                    <TokenValuePill value={row.value} />
                  </div>
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Card Lattice Gutter</h3>
            <div className="fd-tokendocs-spacingShowcaseModule">
              <p className="fd-tokendocs-showcaseHint">
                Two-by-three card lattices highlight gutter differences for dashboard-like layouts.
              </p>
            </div>
            <div className="fd-tokendocs-spacingDemoGrid">
              {spacingShowcaseRows.map((row) => (
                <article key={`${row.id}-lattice`} className="fd-tokendocs-spacingDemoCard">
                  <div className="fd-tokendocs-latticeApplied" style={{ gap: row.value }} aria-hidden="true">
                    <span className="fd-tokendocs-latticeCard" />
                    <span className="fd-tokendocs-latticeCard" />
                    <span className="fd-tokendocs-latticeCard" />
                    <span className="fd-tokendocs-latticeCard" />
                    <span className="fd-tokendocs-latticeCard" />
                    <span className="fd-tokendocs-latticeCard" />
                  </div>
                  <div className="fd-tokendocs-spacingDemoMeta">
                    <span className="fd-tokendocs-spacingLabel">
                      {stripPathPrefix(row.path, "base.space")}
                    </span>
                    <TokenValuePill value={row.value} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TokenSection>

        <TokenSection
          title="Layout and Structural Scales"
          description="Radius and breakpoints remain compact but high-contrast to support quick visual implementation checks."
        >
          <div className="fd-tokendocs-showcase" aria-label="Structural token showcase">
            <h3 className="fd-tokendocs-showcaseTitle">Radius Preview</h3>
            <div className="fd-tokendocs-structShowcase">
              {radiusRows.map((row) => (
                <article key={`${row.id}-radius`} className="fd-tokendocs-radiusCard">
                  <div className="fd-tokendocs-radiusSwatch" style={{ borderRadius: row.value }} aria-hidden="true" />
                  <span className="fd-tokendocs-spacingLabel">{stripPathPrefix(row.path, "base.radius")}</span>
                  <TokenValuePill value={row.value} />
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Breakpoint Ladder</h3>
            <div className="fd-tokendocs-breakpointList">
              {breakpointRows.map((row) => (
                <div key={`${row.id}-breakpoint`} className="fd-tokendocs-breakpointRow">
                  <span className="fd-tokendocs-spacingLabel">{stripPathPrefix(row.path, "base.breakpoint")}</span>
                  <div className="fd-tokendocs-breakpointTrack" aria-hidden="true">
                    <span
                      className="fd-tokendocs-breakpointBar"
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
    await expect(canvas.getByText("Card Lattice Gutter")).toBeInTheDocument();
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
            accordion
            initialOpenGroupId="spacing"
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(360px, 1.6fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "value",
                label: "Value",
                width: "minmax(300px, 1fr)",
                getValue: (row) => row.value,
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
            accordion
            initialOpenGroupId="radius"
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
                width: "minmax(300px, 1fr)",
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
