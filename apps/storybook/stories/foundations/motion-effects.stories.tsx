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
  laneDuration: string;
  laneEasing: string;
  laneDelay: string;
  variant: "duration" | "easing";
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
  const scaledMs = Math.round(Math.min(4200, Math.max(900, ms * 9)));
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
const normalDuration =
  durationRows.find((row) => row.path.endsWith(".normal"))?.value ??
  durationRows[0]?.value ??
  "180ms";

const durationLaneRows: MotionLaneRow[] = durationRows.map((row, index) => ({
  id: `duration:${row.id}`,
  label: row.path.split(".").pop() ?? row.path,
  path: row.path,
  value: row.value,
  laneDuration: laneDuration(row.value),
  laneEasing: standardEasing,
  laneDelay: `-${index * LANE_DELAY_STEP_MS}ms`,
  variant: "duration",
}));

const easingLaneRows: MotionLaneRow[] = easingRows.map((row, index) => ({
  id: `easing:${row.id}`,
  label: row.path.split(".").pop() ?? row.path,
  path: row.path,
  value: row.value,
  laneDuration: laneDuration(normalDuration),
  laneEasing: row.value,
  laneDelay: `-${(index + durationRows.length) * LANE_DELAY_STEP_MS}ms`,
  variant: "easing",
}));

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
          description="A pacman marker travels from start to end using each token's timing behavior."
        >
          <div className="fd-tokendocs-showcase fd-tokendocs-motionLab" aria-label="Motion lane previews">
            <h3 className="fd-tokendocs-showcaseTitle">Duration Lanes</h3>
            <div className="fd-tokendocs-motionLanes">
              {durationLaneRows.map((row) => (
                <div
                  key={row.id}
                  className="fd-tokendocs-motionLaneRow"
                  style={
                    {
                      "--fd-motion-duration": row.laneDuration,
                      "--fd-motion-easing": row.laneEasing,
                      "--fd-motion-delay": row.laneDelay,
                    } as CSSProperties
                  }
                >
                  <span className="fd-tokendocs-motionLaneLabel">{row.label}</span>
                  <div
                    className="fd-tokendocs-motionLaneTrack"
                    aria-hidden="true"
                    title={`${row.path}: ${row.value}`}
                  >
                    <span
                      className={classNames(
                        "fd-tokendocs-motionLaneBall",
                        row.variant === "duration" ? "is-duration" : "is-easing",
                      )}
                    />
                  </div>
                  <span className="fd-tokendocs-motionLaneValue">
                    <TokenValuePill value={row.value} />
                  </span>
                </div>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Easing Lanes</h3>
            <div className="fd-tokendocs-motionLanes">
              {easingLaneRows.map((row) => (
                <div
                  key={row.id}
                  className="fd-tokendocs-motionLaneRow"
                  style={
                    {
                      "--fd-motion-duration": row.laneDuration,
                      "--fd-motion-easing": row.laneEasing,
                      "--fd-motion-delay": row.laneDelay,
                    } as CSSProperties
                  }
                >
                  <span className="fd-tokendocs-motionLaneLabel">{row.label}</span>
                  <div
                    className="fd-tokendocs-motionLaneTrack"
                    aria-hidden="true"
                    title={`${row.path}: ${row.value}`}
                  >
                    <span
                      className={classNames(
                        "fd-tokendocs-motionLaneBall",
                        row.variant === "duration" ? "is-duration" : "is-easing",
                      )}
                    />
                  </div>
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
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(320px, 1.7fr)",
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
                valueMode: "wrap",
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
                label: "Shadow Value",
                width: "minmax(320px, 1.4fr)",
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
      canvas.getByRole("heading", { name: "Motion & Effects Token Reference" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Motion References")).toBeInTheDocument();
  },
};

function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
