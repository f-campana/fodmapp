import type { CSSProperties } from "react";

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

interface EffectRow {
  id: string;
  path: string;
  value: string;
}

interface MotionLaneRow {
  id: string;
  label: string;
  path: string;
  value: string;
  tokenDuration: string;
  tokenEasing: string;
  baselineDuration: string;
  baselineEasing: string;
  baselineDelay: string;
  tokenDelay: string;
}

const LANE_DELAY_STEP_MS = 280;

const base = asRecord(tokens.base, "base");
const motion = asRecord(base.motion, "base.motion");
const shadows = asRecord(base.shadow, "base.shadow");

function toRows(node: unknown, prefix: string): EffectRow[] {
  return flattenTokenTree(node, prefix).map((row) => {
    const value = tokenPrimitiveToString(row.value);
    return {
      id: row.id,
      path: row.path,
      value,
    };
  });
}

function parseDurationMs(value: string): number {
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

function laneDuration(value: string): string {
  const ms = parseDurationMs(value);
  const scaledMs = Math.round(Math.min(4000, Math.max(900, ms * 8)));
  return `${scaledMs}ms`;
}

const durationRows = toRows(
  asRecord(motion.duration, "base.motion.duration"),
  "base.motion.duration",
);
const easingRows = toRows(
  asRecord(motion.easing, "base.motion.easing"),
  "base.motion.easing",
);

const standardEasing =
  easingRows.find((row) => row.path.endsWith(".standard"))?.value ?? "linear";
const baselineEasing = "linear";
const normalDuration =
  durationRows.find((row) => row.path.endsWith(".normal"))?.value ??
  durationRows[0]?.value ??
  "180ms";
const baselineLaneDuration = laneDuration(normalDuration);

const durationLaneRows: MotionLaneRow[] = durationRows.map((row, index) => {
  const delayMs = -(index * LANE_DELAY_STEP_MS);

  return {
    id: `duration:${row.id}`,
    label: row.path.split(".").pop() ?? row.path,
    path: row.path,
    value: row.value,
    tokenDuration: laneDuration(row.value),
    tokenEasing: standardEasing,
    baselineDuration: baselineLaneDuration,
    baselineEasing: standardEasing,
    baselineDelay: `${delayMs}ms`,
    tokenDelay: `${delayMs}ms`,
  };
});

const easingLaneRows: MotionLaneRow[] = easingRows.map((row, index) => {
  const delayMs = -((index + durationRows.length) * LANE_DELAY_STEP_MS);

  return {
    id: `easing:${row.id}`,
    label: row.path.split(".").pop() ?? row.path,
    path: row.path,
    value: row.value,
    tokenDuration: baselineLaneDuration,
    tokenEasing: row.value,
    baselineDuration: baselineLaneDuration,
    baselineEasing,
    baselineDelay: `${delayMs}ms`,
    tokenDelay: `${delayMs}ms`,
  };
});

const motionGroups = [
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

const shadowRows = toRows(shadows, "base.shadow");
const shadowGroups = [{ id: "shadow", label: "Shadow Scale", rows: shadowRows }];

function MotionLaneCompare({ row }: { row: MotionLaneRow }) {
  return (
    <div
      className="fd-tokendocs-motionLaneCompare"
      aria-hidden="true"
      title={`${row.path}: ${row.value}`}
    >
      <span className="fd-tokendocs-motionRailRow is-baseline">
        <span className="fd-tokendocs-motionRailTag" aria-hidden="true">
          B
        </span>
        <span className="fd-tokendocs-motionRail is-baseline">
          <span
            className="fd-tokendocs-motionLaneBall is-baseline"
            style={
              {
                "--fd-lane-duration": row.baselineDuration,
                "--fd-lane-easing": row.baselineEasing,
                "--fd-lane-delay": row.baselineDelay,
              } as CSSProperties
            }
          />
        </span>
      </span>

      <span className="fd-tokendocs-motionRailRow is-token">
        <span className="fd-tokendocs-motionRailTag" aria-hidden="true">
          T
        </span>
        <span className="fd-tokendocs-motionRail is-token">
          <span
            className="fd-tokendocs-motionLaneBall is-token"
            style={
              {
                "--fd-lane-duration": row.tokenDuration,
                "--fd-lane-easing": row.tokenEasing,
                "--fd-lane-delay": row.tokenDelay,
              } as CSSProperties
            }
          />
        </span>
      </span>
    </div>
  );
}

const meta = {
  title: "Foundations/Tokens/Motion & Effects",
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
        title="Motion & Effects Tokens"
        subtitle="Passive motion lanes visualize duration and easing behavior in continuous loops. Shadow tiers are previewed below."
      >
        <TokenSection
          title="Motion Lanes"
          description="Token timing behavior rendered passively: duration rows compare speed, easing rows compare token output against linear baseline."
        >
          <div className="fd-tokendocs-showcase fd-tokendocs-motionLab" aria-label="Motion lane previews">
            <div className="fd-tokendocs-motionLegend" aria-hidden="true">
              <span className="fd-tokendocs-motionLegendItem is-baseline">Baseline (neutral)</span>
              <span className="fd-tokendocs-motionLegendItem is-token">Token timing (accent)</span>
            </div>
            <h3 className="fd-tokendocs-showcaseTitle">Duration Lanes</h3>
            <p className="fd-tokendocs-showcaseHint">
              Accent marker uses token duration; neutral marker uses baseline normal duration.
            </p>
            <div className="fd-tokendocs-motionLanes">
              {durationLaneRows.map((row) => (
                <div key={row.id} className="fd-tokendocs-motionLaneRow">
                  <span className="fd-tokendocs-motionLaneLabel">{row.label}</span>
                  <MotionLaneCompare row={row} />
                  <span className="fd-tokendocs-motionLaneValue">
                    <TokenValuePill value={row.value} />
                  </span>
                </div>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Easing Lanes</h3>
            <p className="fd-tokendocs-showcaseHint">
              Neutral marker is linear baseline, accent marker uses the easing token with same duration.
            </p>
            <div className="fd-tokendocs-motionLanes">
              {easingLaneRows.map((row) => (
                <div key={row.id} className="fd-tokendocs-motionLaneRow">
                  <span className="fd-tokendocs-motionLaneLabel">{row.label}</span>
                  <MotionLaneCompare row={row} />
                  <span className="fd-tokendocs-motionLaneValue">
                    <TokenValuePill value={row.value} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TokenSection>

        <TokenSection
          title="Shadows"
          description="Elevation values rendered on larger surfaces for clearer depth comparison."
        >
          <div className="fd-tokendocs-showcase" aria-label="Shadow depth preview">
            <h3 className="fd-tokendocs-showcaseTitle">Depth Surface Showcase</h3>
            <div className="fd-tokendocs-shadowShowcase">
              {shadowRows.map((row) => (
                <article key={`${row.id}-showcase`} className="fd-tokendocs-shadowCard">
                  <div
                    className="fd-tokendocs-shadowSurface"
                    style={{ boxShadow: row.value }}
                    aria-hidden="true"
                  />
                  <div className="fd-tokendocs-shadowMeta">
                    <p className="fd-tokendocs-shadowPath">{row.path}</p>
                    <p className="fd-tokendocs-shadowValue" title={row.value}>
                      {row.value}
                    </p>
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
      canvas.getByRole("heading", { name: "Motion & Effects Tokens" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Motion Lanes")).toBeInTheDocument();
    await expect(canvas.queryByPlaceholderText(/search token path or value/i)).not.toBeInTheDocument();
  },
};

export const Reference: Story = {
  render: () => {
    return (
      <TokenDocsPage
        title="Motion & Effects Token Reference"
        subtitle="Exact duration, easing, and shadow token references for implementation and QA."
      >
        <TokenSection
          title="Motion References"
          description="Grouped duration and easing path/value references."
        >
          <TokenDataGrid
            gridLabel="motion-grid"
            groups={motionGroups}
            accordion
            allowCollapseAll
            initialOpenGroupId="durations"
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(340px, 1.7fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "value",
                label: "Value",
                width: "minmax(320px, 1fr)",
                getValue: (row) => row.value,
                valueMode: "plain",
                copyValue: (row) => row.value,
              },
            ]}
          />
        </TokenSection>

        <TokenSection
          title="Shadow References"
          description="Grouped path/value references for shadow scales."
        >
          <TokenDataGrid
            gridLabel="shadow-grid"
            groups={shadowGroups}
            accordion
            allowCollapseAll
            initialOpenGroupId="shadow"
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(320px, 1.5fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "value",
                label: "Shadow Value",
                width: "minmax(420px, 1.4fr)",
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
      canvas.getByRole("heading", { name: "Motion & Effects Token Reference" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Motion References")).toBeInTheDocument();
  },
};
