import type { CSSProperties } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
  ReferenceTables,
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
  searchText: string;
}

interface MotionLaneRow {
  id: string;
  label: string;
  value: string;
  laneDuration: string;
  laneEasing: string;
  variant: "duration" | "easing";
}

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
      searchText: `${row.path} ${value}`,
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
  const scaledMs = Math.round(Math.min(4200, Math.max(900, ms * 8)));
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

const durationLaneRows: MotionLaneRow[] = durationRows.map((row) => ({
  id: `duration:${row.id}`,
  label: row.path.split(".").pop() ?? row.path,
  value: row.value,
  laneDuration: laneDuration(row.value),
  laneEasing: standardEasing,
  variant: "duration",
}));

const easingLaneRows: MotionLaneRow[] = easingRows.map((row) => ({
  id: `easing:${row.id}`,
  label: row.path.split(".").pop() ?? row.path,
  value: row.value,
  laneDuration: laneDuration(normalDuration),
  laneEasing: row.value,
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

export const Reference: Story = {
  render: () => {
    return (
      <TokenDocsPage
        title="Motion & Effects Tokens"
        subtitle="Passive motion lanes visualize duration and easing tokens directly, with exact references collapsed below."
      >
        <TokenSection
          title="Motion Lanes"
          description="A moving ball travels from label to value using each token's timing behavior."
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
                    } as CSSProperties
                  }
                >
                  <span className="fd-tokendocs-motionLaneLabel">{row.label}</span>
                  <div className="fd-tokendocs-motionLaneTrack" aria-hidden="true">
                    <span className="fd-tokendocs-motionLaneBall" />
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
                    } as CSSProperties
                  }
                >
                  <span className="fd-tokendocs-motionLaneLabel">{row.label}</span>
                  <div className="fd-tokendocs-motionLaneTrack" aria-hidden="true">
                    <span className="fd-tokendocs-motionLaneBall is-easing" />
                  </div>
                  <span className="fd-tokendocs-motionLaneValue">
                    <TokenValuePill value={row.value} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ReferenceTables hint="Expand for exact duration/easing path/value references.">
            <TokenDataGrid
              gridLabel="motion-grid"
              groups={motionGroups}
              showToolbar={false}
              columns={[
                {
                  key: "path",
                  label: "Token Path",
                  width: "minmax(320px, 1.7fr)",
                  sortable: false,
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
                  sortable: false,
                  getValue: (row) => row.value,
                  valueMode: "wrap",
                  copyValue: (row) => row.value,
                },
              ]}
            />
          </ReferenceTables>
        </TokenSection>

        <TokenSection
          title="Shadows"
          description="Elevation values with larger preview surfaces to make depth tiers easier to compare."
        >
          <div className="fd-tokendocs-showcase" aria-label="Shadow depth preview">
            <h3 className="fd-tokendocs-showcaseTitle">Depth Surface Showcase</h3>
            <p className="fd-tokendocs-showcaseHint">
              Preview cards below use the generated token shadows directly.
            </p>
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
                    <p className="fd-tokendocs-shadowValue">{row.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <ReferenceTables hint="Expand for exact shadow path/value references.">
            <TokenDataGrid
              gridLabel="shadow-grid"
              groups={shadowGroups}
              showToolbar={false}
              columns={[
                {
                  key: "path",
                  label: "Token Path",
                  width: "minmax(280px, 1.4fr)",
                  sortable: false,
                  getValue: (row) => row.path,
                  render: (row) => <TokenPathText value={row.path} />,
                  valueMode: "plain",
                  copyValue: (row) => row.path,
                },
                {
                  key: "preview",
                  label: "Preview",
                  width: "minmax(220px, 1fr)",
                  sortable: false,
                  getValue: (row) => row.value,
                  render: (row) => (
                    <span
                      className="fd-tokendocs-shadowSurface"
                      style={{ boxShadow: row.value, minHeight: "2rem" }}
                      aria-hidden="true"
                    />
                  ),
                  copyValue: () => null,
                },
                {
                  key: "value",
                  label: "Shadow Value",
                  width: "minmax(420px, 2fr)",
                  sortable: false,
                  getValue: (row) => row.value,
                  valueMode: "wrap",
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
      canvas.getByRole("heading", { name: "Motion & Effects Tokens" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Duration Lanes")).toBeInTheDocument();
    await expect(canvas.getByText("Easing Lanes")).toBeInTheDocument();
  },
};
