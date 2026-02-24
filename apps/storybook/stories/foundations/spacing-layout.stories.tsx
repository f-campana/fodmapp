import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
} from "./token-docs.components";
import {
  asRecord,
  compareTokenRowsByPathSuffix,
  createSortedRows,
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
const BREAKPOINT_TICKS = 5;

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
  return createSortedRows(
    flattenTokenTree(node, prefix).map((row) => {
      const value = tokenPrimitiveToString(row.value);
      return {
        id: row.id,
        path: row.path,
        value,
      };
    }),
    compareTokenRowsByPathSuffix,
  );
}

function toPercent(value: string, maxValue: number): number {
  const parsed = parseNumberish(value);
  if (parsed === null || maxValue === 0) {
    return 0;
  }

  return Math.max(4, (parsed / maxValue) * 100);
}

function normalizeRadiusValue(value: string): string {
  return value === "full" ? "9999px" : value;
}

const BREAKPOINT_TICK_MARKS = ["0", "25", "50", "75", "100"];

const spacingRows = toScaleRows(spacing, "base.space");
const radiusRows = toScaleRows(radius, "base.radius");
const breakpointRows = toScaleRows(breakpoints, "base.breakpoint");
const borderWidthRows = toScaleRows(borderWidth, "base.border.width");
const opacityRows = toScaleRows(opacity, "base.opacity");
const zIndexRows = toScaleRows(zIndex, "base.zIndex");

const maxBreakpointValue = Math.max(
  ...breakpointRows.map((row) => parseNumberish(row.value) ?? 0),
);

const spacingShowcaseRows = spacingRows.filter((row) => {
  const key = stripPathPrefix(row.path, "base.space");
  return SHOWCASE_STOPS.includes(key);
});

const spacingReferenceGroups = [{ id: "spacing", label: "Spacing", rows: spacingRows }];

const layoutReferenceGroups = [
  { id: "radius", label: "Radius", rows: radiusRows },
  { id: "border-width", label: "Border Width", rows: borderWidthRows },
  { id: "opacity", label: "Opacity", rows: opacityRows },
  { id: "breakpoints", label: "Breakpoints", rows: breakpointRows },
  { id: "z-index", label: "Z-Index", rows: zIndexRows },
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
        subtitle="Applied spacing and structural tokens in practical patterns with immediate visual deltas."
      >
        <TokenSection
          title="Spacing Scale"
          description="Value-first cards keep token context with larger visual contrast and stronger delta cues."
        >
          <div className="fd-tokendocs-showcase fd-tokendocs-spacingShowcaseRoot" aria-label="Spacing visual showcase">
            <h3 className="fd-tokendocs-showcaseTitle">Vertical Stack Rhythm</h3>
            <div className="fd-tokendocs-spacingShowcaseModule">
              <p className="fd-tokendocs-showcaseHint">
                Same four surface cards scale consistently; only gap changes are the signal.
              </p>
            </div>
            <div className="fd-tokendocs-spacingDemoGrid">
              {spacingShowcaseRows.map((row) => (
                <article key={`${row.id}-stack`} className="fd-tokendocs-spacingDemoCard">
                  <div className="fd-tokendocs-spacingDemoMeta">
                    <span className="fd-tokendocs-spacingLabel">
                      {stripPathPrefix(row.path, "base.space")}
                    </span>
                    <span className="fd-tokendocs-spacingDemoValueText">{row.value}</span>
                  </div>
                  <div className="fd-tokendocs-stackApplied" style={{ gap: row.value }} aria-hidden="true">
                    <div className="fd-tokendocs-stackAppliedCard">Header</div>
                    <div className="fd-tokendocs-stackAppliedCard">Body</div>
                    <div className="fd-tokendocs-stackAppliedCard">Summary</div>
                    <div className="fd-tokendocs-stackAppliedCard">Action</div>
                  </div>
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Inline Cluster</h3>
            <div className="fd-tokendocs-spacingShowcaseModule">
              <p className="fd-tokendocs-showcaseHint">
                Chips scale out from compact to relaxed spacing with fixed anchor bounds.
              </p>
            </div>
            <div className="fd-tokendocs-spacingDemoGrid">
              {spacingShowcaseRows.map((row) => (
                <article key={`${row.id}-cluster`} className="fd-tokendocs-spacingDemoCard">
                  <div className="fd-tokendocs-spacingDemoMeta">
                    <span className="fd-tokendocs-spacingLabel">
                      {stripPathPrefix(row.path, "base.space")}
                    </span>
                    <span className="fd-tokendocs-spacingDemoValueText">{row.value}</span>
                  </div>
                  <div className="fd-tokendocs-clusterApplied" style={{ gap: row.value }} aria-hidden="true">
                    <span className="fd-tokendocs-chip">Safe</span>
                    <span className="fd-tokendocs-chip">Review</span>
                    <span className="fd-tokendocs-chip">Plan</span>
                    <span className="fd-tokendocs-chip">Cook</span>
                    <span className="fd-tokendocs-chip">Breathe</span>
                    <span className="fd-tokendocs-chip">Grow</span>
                  </div>
                </article>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Card Lattice Gutter</h3>
            <div className="fd-tokendocs-spacingShowcaseModule">
              <p className="fd-tokendocs-showcaseHint">
                Filled cards and expanding gutters make lattice density differences obvious.
              </p>
            </div>
            <div className="fd-tokendocs-spacingDemoGrid">
              {spacingShowcaseRows.map((row) => (
                <article key={`${row.id}-lattice`} className="fd-tokendocs-spacingDemoCard">
                  <div className="fd-tokendocs-spacingDemoMeta">
                    <span className="fd-tokendocs-spacingLabel">
                      {stripPathPrefix(row.path, "base.space")}
                    </span>
                    <span className="fd-tokendocs-spacingDemoValueText">{row.value}</span>
                  </div>
                  <div className="fd-tokendocs-latticeApplied" style={{ gap: row.value }} aria-hidden="true">
                    <span className="fd-tokendocs-latticeCard">A</span>
                    <span className="fd-tokendocs-latticeCard">B</span>
                    <span className="fd-tokendocs-latticeCard">C</span>
                    <span className="fd-tokendocs-latticeCard">D</span>
                    <span className="fd-tokendocs-latticeCard">E</span>
                    <span className="fd-tokendocs-latticeCard">F</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TokenSection>

        <TokenSection
          title="Layout and Structural Scales"
          description="Radius and breakpoints remain compact while sharpening interpretation at a glance."
        >
          <div className="fd-tokendocs-showcase" aria-label="Structural token showcase">
            <h3 className="fd-tokendocs-showcaseTitle">Radius Preview</h3>
            <div className="fd-tokendocs-structShowcase">
              {radiusRows.map((row) => {
                const tokenKey = stripPathPrefix(row.path, "base.radius");
                return (
                  <article key={`${row.id}-radius`} className="fd-tokendocs-radiusCard">
                    <div className="fd-tokendocs-spacingDemoMeta">
                      <span className="fd-tokendocs-spacingLabel">{tokenKey}</span>
                      <span className="fd-tokendocs-spacingDemoValueText">{row.value}</span>
                    </div>
                    <div
                      className="fd-tokendocs-radiusSwatch"
                      style={{
                        ["--radius-value" as string]: normalizeRadiusValue(row.value),
                      }}
                      role="img"
                      aria-label={`${row.path}: ${row.value}`}
                    />
                  </article>
                );
              })}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Breakpoint Ladder</h3>
            <div className="fd-tokendocs-breakpointList">
              {breakpointRows.map((row) => (
                <div key={`${row.id}-breakpoint`} className="fd-tokendocs-breakpointRow">
                  <span className="fd-tokendocs-breakpointHeader">
                    <span className="fd-tokendocs-spacingLabel">
                      {stripPathPrefix(row.path, "base.breakpoint")}
                    </span>
                  <span className="fd-tokendocs-breakpointMinWidth">
                    min: {row.value}
                  </span>
                  </span>
                  <div
                    className="fd-tokendocs-breakpointTrack"
                    style={{
                      "--fd-breakpoint-ticks": String(BREAKPOINT_TICKS),
                    } as CSSProperties}
                    aria-hidden="true"
                  >
                    <span className="fd-tokendocs-breakpointTicks">
                      {Array.from({ length: BREAKPOINT_TICKS }, (_, index) => (
                        <span
                          key={`${row.id}-tick-${index}`}
                          className="fd-tokendocs-breakpointTick"
                        >
                          <span className="fd-tokendocs-breakpointTickLabel">
                            {BREAKPOINT_TICK_MARKS[index]}
                          </span>
                        </span>
                      ))}
                    </span>
                    <span
                      className="fd-tokendocs-breakpointBar"
                      style={{ width: `${toPercent(row.value, maxBreakpointValue)}%` }}
                    />
                  </div>
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
            allowCollapseAll
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
          description="Radius, border width, opacity, breakpoint, and z-index path/value references."
        >
          <TokenDataGrid
            gridLabel="layout-grid"
            groups={layoutReferenceGroups}
            accordion
            allowCollapseAll
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
