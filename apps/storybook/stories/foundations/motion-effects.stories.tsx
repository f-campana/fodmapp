import { type CSSProperties, useState } from "react";

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
  flattenTokenTree,
  naturalTokenPathCompare,
  tokenPrimitiveToString,
} from "./token-docs.helpers";

interface EffectRow {
  id: string;
  path: string;
  value: string;
}

interface SemanticMotionRow {
  id: string;
  path: string;
  light: string;
  dark: string;
}

interface MotionLaneRow {
  id: string;
  label: string;
  path: string;
  value: string;
  hasBaseline: boolean;
  tokenDuration: string;
  tokenEasing: string;
  tokenStaticLeft?: string;
  baselineDuration?: string;
  baselineEasing?: string;
  baselineDelay?: string;
  tokenDelay: string;
}

const SHARED_LANE_DELAY_MS = -560;
const EASING_SLOW_FACTOR = 10;
const DURATION_VISUAL_FACTOR = 9;
const MIN_MOTION_DURATION_MS = 900;
const MAX_MOTION_DURATION_MS = 3900;

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const motion = asRecord(base.motion, "base.motion");
const shadows = asRecord(base.shadow, "base.shadow");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");
const semanticLight = asRecord(lightTheme.semantic, "themes.light.semantic");
const semanticDark = asRecord(darkTheme.semantic, "themes.dark.semantic");

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

function themedRowsFor(
  lightNode: unknown,
  darkNode: unknown,
  prefix: string,
): SemanticMotionRow[] {
  const lightRows = toRows(lightNode, prefix);
  const darkRows = toRows(darkNode, prefix);

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

function laneDuration(value: string, factor = DURATION_VISUAL_FACTOR): string {
  const ms = parseDurationMs(value);
  const scaledMs = Math.round(
    Math.min(
      MAX_MOTION_DURATION_MS,
      Math.max(MIN_MOTION_DURATION_MS, ms * factor),
    ),
  );
  return `${scaledMs}ms`;
}

const durationRows = createOrderedTokenRows(
  asRecord(motion.duration, "base.motion.duration"),
  "base.motion.duration",
  ["instant", "fast", "normal", "slow", "slower"],
);
const easingRows = createOrderedTokenRows(
  asRecord(motion.easing, "base.motion.easing"),
  "base.motion.easing",
  ["linear", "standard", "accelerated", "decelerated", "emphasized"],
);

function createOrderedTokenRows(
  node: unknown,
  prefix: string,
  order: string[],
) {
  const rows = toRows(node, prefix);
  const orderMap = new Map(order.map((key, index) => [key, index]));

  return [...rows].sort((left, right) => {
    const leftKey = left.path.split(".").pop() ?? left.path;
    const rightKey = right.path.split(".").pop() ?? right.path;
    const leftIndex = leftKey ? orderMap.get(leftKey) : undefined;
    const rightIndex = rightKey ? orderMap.get(rightKey) : undefined;

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }

    if (leftIndex !== undefined) {
      return -1;
    }

    if (rightIndex !== undefined) {
      return 1;
    }

    return leftKey.localeCompare(rightKey);
  });
}

const standardEasing =
  easingRows.find((row) => row.path.endsWith(".standard"))?.value ?? "linear";
const baselineEasing = "linear";
const normalDuration =
  durationRows.find((row) => row.path.endsWith(".normal"))?.value ??
  durationRows[0]?.value ??
  "180ms";
const easingLaneDuration = laneDuration(normalDuration, EASING_SLOW_FACTOR);

const durationLaneRows: MotionLaneRow[] = durationRows.map((row) => {
  const durationMs = parseDurationMs(row.value);
  const isInstant = durationMs === 0;
  const sharedDelay = `${SHARED_LANE_DELAY_MS}ms`;

  return {
    id: `duration:${row.id}`,
    label: row.path.split(".").pop() ?? row.path,
    path: row.path,
    value: row.value,
    hasBaseline: false,
    tokenDuration: isInstant ? "1ms" : laneDuration(row.value),
    tokenEasing: standardEasing,
    tokenStaticLeft: isInstant ? "calc(100% - 0.98rem)" : undefined,
    tokenDelay: sharedDelay,
  };
});

const easingLaneRows: MotionLaneRow[] = easingRows.map((row) => {
  const sharedDelay = `${SHARED_LANE_DELAY_MS}ms`;

  return {
    id: `easing:${row.id}`,
    label: row.path.split(".").pop() ?? row.path,
    path: row.path,
    value: row.value,
    hasBaseline: true,
    tokenDuration: easingLaneDuration,
    tokenEasing: row.value,
    baselineDuration: easingLaneDuration,
    baselineEasing,
    baselineDelay: sharedDelay,
    tokenDelay: sharedDelay,
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
const shadowGroups = [
  { id: "shadow", label: "Shadow Scale", rows: shadowRows },
];
const semanticMotionRows = themedRowsFor(
  asRecord(semanticLight.motion, "themes.light.semantic.motion"),
  asRecord(semanticDark.motion, "themes.dark.semantic.motion"),
  "semantic.motion",
);
const semanticMotionGroups = [
  {
    id: "semantic-motion",
    label: "Semantic Motion",
    rows: semanticMotionRows,
  },
];
const semanticMotionByPath = new Map(
  semanticMotionRows.map((row) => [row.path, row]),
);
const requiredSemanticMotionPaths = [
  "semantic.motion.interactiveDuration",
  "semantic.motion.interactiveEasing",
] as const;

function MotionLaneCompare({ row }: { row: MotionLaneRow }) {
  const compareClassName = row.hasBaseline
    ? "fd-tokendocs-motionLaneCompare"
    : "fd-tokendocs-motionLaneCompare is-token-only";
  const tokenBallClassName = row.tokenStaticLeft
    ? "fd-tokendocs-motionLaneBall is-token is-static"
    : "fd-tokendocs-motionLaneBall is-token";
  const baselineStyle = row.hasBaseline
    ? ({
        "--fd-lane-duration": row.baselineDuration ?? row.tokenDuration,
        "--fd-lane-easing": row.baselineEasing ?? "linear",
        "--fd-lane-delay": row.baselineDelay ?? row.tokenDelay,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={compareClassName}
      aria-hidden="true"
      title={`${row.path}: ${row.value}`}
    >
      {row.hasBaseline ? (
        <span className="fd-tokendocs-motionRailRow is-baseline">
          <span className="fd-tokendocs-motionRailTag" aria-hidden="true">
            B
          </span>
          <span className="fd-tokendocs-motionRail is-baseline">
            <span
              className="fd-tokendocs-motionLaneBall is-baseline"
              style={baselineStyle}
            />
          </span>
        </span>
      ) : null}

      <span className="fd-tokendocs-motionRailRow is-token">
        <span className="fd-tokendocs-motionRailTag" aria-hidden="true">
          T
        </span>
        <span className="fd-tokendocs-motionRail is-token">
          <span
            className={tokenBallClassName}
            style={
              {
                "--fd-lane-duration": row.tokenDuration,
                "--fd-lane-easing": row.tokenEasing,
                "--fd-lane-delay": row.tokenDelay,
                "--fd-lane-static-left": row.tokenStaticLeft,
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

function MotionReferenceStory() {
  useTokenDocsResetScrollOnMount();

  const [activeGroup, setActiveGroup] = useState<{
    gridId: "motion-grid" | "shadow-grid" | "semantic-motion-grid";
    groupId: string;
  }>(() => ({
    gridId: "motion-grid",
    groupId: motionGroups[0]?.id ?? "durations",
  }));

  function setPageActiveGroup(
    gridId: "motion-grid" | "shadow-grid" | "semantic-motion-grid",
    groupId: string | null,
  ) {
    if (!groupId) {
      return;
    }

    setActiveGroup({ gridId, groupId });
  }

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
          openGroupId={
            activeGroup.gridId === "motion-grid" ? activeGroup.groupId : null
          }
          onOpenGroupChange={(groupId) =>
            setPageActiveGroup("motion-grid", groupId)
          }
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
          openGroupId={
            activeGroup.gridId === "shadow-grid" ? activeGroup.groupId : null
          }
          onOpenGroupChange={(groupId) =>
            setPageActiveGroup("shadow-grid", groupId)
          }
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

      <TokenSection
        title="Semantic Motion References"
        description="Theme-level semantic interactive motion primitives (light and dark)."
      >
        <TokenDataGrid
          gridLabel="semantic-motion-grid"
          groups={semanticMotionGroups}
          accordion
          allowCollapseAll
          openGroupId={
            activeGroup.gridId === "semantic-motion-grid"
              ? activeGroup.groupId
              : null
          }
          onOpenGroupChange={(groupId) =>
            setPageActiveGroup("semantic-motion-grid", groupId)
          }
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
              key: "light",
              label: "Light",
              width: "minmax(280px, 1fr)",
              getValue: (row) => row.light,
              valueMode: "plain",
              copyValue: (row) => row.light,
            },
            {
              key: "dark",
              label: "Dark",
              width: "minmax(280px, 1fr)",
              getValue: (row) => row.dark,
              valueMode: "plain",
              copyValue: (row) => row.dark,
            },
          ]}
        />
      </TokenSection>
    </TokenDocsPage>
  );
}

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
          <div
            className="fd-tokendocs-showcase fd-tokendocs-motionLab"
            aria-label="Motion lane previews"
          >
            <div className="fd-tokendocs-motionLegend" aria-hidden="true">
              <span className="fd-tokendocs-motionLegendItem is-baseline">
                Baseline (easing)
              </span>
              <span className="fd-tokendocs-motionLegendItem is-token">
                Token timing (accent)
              </span>
            </div>
            <h3 className="fd-tokendocs-showcaseTitle">Duration Lanes</h3>
            <p className="fd-tokendocs-showcaseHint">
              Token marker only: compares relative speed across duration tokens.
            </p>
            <div className="fd-tokendocs-motionLanes">
              {durationLaneRows.map((row) => (
                <div key={row.id} className="fd-tokendocs-motionLaneRow">
                  <span className="fd-tokendocs-motionLaneLabel">
                    {row.label}
                  </span>
                  <MotionLaneCompare row={row} />
                  <span className="fd-tokendocs-motionLaneValue">
                    <TokenValuePill value={row.value} />
                  </span>
                </div>
              ))}
            </div>

            <h3 className="fd-tokendocs-showcaseTitle">Easing Lanes</h3>
            <p className="fd-tokendocs-showcaseHint">
              Neutral marker is linear baseline; token marker uses the easing
              token at the same slower pace.
            </p>
            <div className="fd-tokendocs-motionLanes">
              {easingLaneRows.map((row) => (
                <div key={row.id} className="fd-tokendocs-motionLaneRow">
                  <span className="fd-tokendocs-motionLaneLabel">
                    {row.label}
                  </span>
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
          <div
            className="fd-tokendocs-showcase"
            aria-label="Shadow depth preview"
          >
            <h3 className="fd-tokendocs-showcaseTitle">
              Depth Surface Showcase
            </h3>
            <div className="fd-tokendocs-shadowShowcase">
              {shadowRows.map((row) => (
                <article
                  key={`${row.id}-showcase`}
                  className="fd-tokendocs-shadowCard"
                >
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
    await expect(
      canvas.queryByPlaceholderText(/search token path or value/i),
    ).not.toBeInTheDocument();

    const laneGroups = canvasElement.querySelectorAll(
      ".fd-tokendocs-motionLanes",
    );
    await expect(laneGroups.length).toBeGreaterThanOrEqual(2);

    const durationLanes = laneGroups[0];
    const easingLanes = laneGroups[1];

    await expect(
      durationLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-baseline")
        .length,
    ).toBe(0);
    await expect(
      durationLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-token")
        .length,
    ).toBe(durationLaneRows.length);
    await expect(
      durationLanes.querySelectorAll(
        ".fd-tokendocs-motionLaneBall.is-token.is-static",
      ).length,
    ).toBe(1);

    await expect(
      easingLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-baseline")
        .length,
    ).toBe(easingLaneRows.length);
    await expect(
      easingLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-token")
        .length,
    ).toBe(easingLaneRows.length);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },
};

export const Reference: Story = {
  render: () => <MotionReferenceStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Motion & Effects Token Reference" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Motion References")).toBeInTheDocument();
    await expect(
      canvas.getByText("Semantic Motion References"),
    ).toBeInTheDocument();

    const durationsSection = canvasElement.querySelector(
      "#motion-grid-durations",
    );
    const easingSection = canvasElement.querySelector("#motion-grid-easing");
    const shadowSection = canvasElement.querySelector("#shadow-grid-shadow");
    if (!durationsSection || !easingSection || !shadowSection) {
      throw new Error("Expected motion sections to exist.");
    }

    await expect(durationsSection).toHaveAttribute("data-expanded", "true");
    await expect(easingSection).toHaveAttribute("data-expanded", "false");
    await expect(shadowSection).toHaveAttribute("data-expanded", "false");

    const easingToggle = easingSection.querySelector(
      ".fd-tokendocs-groupToggle",
    );
    if (!easingToggle) {
      throw new Error("Expected easing toggle to exist.");
    }

    await userEvent.click(easingToggle);
    await expect(easingSection).toHaveAttribute("data-expanded", "true");
    await expect(durationsSection).toHaveAttribute("data-expanded", "false");
    await expect(shadowSection).toHaveAttribute("data-expanded", "false");

    await userEvent.click(easingToggle);
    await expect(easingSection).toHaveAttribute("data-expanded", "true");
    await expect(durationsSection).toHaveAttribute("data-expanded", "false");

    const shadowToggle = shadowSection.querySelector(
      ".fd-tokendocs-groupToggle",
    );
    if (!shadowToggle) {
      throw new Error("Expected shadow toggle to exist.");
    }
    await userEvent.click(shadowToggle);
    await expect(shadowSection).toHaveAttribute("data-expanded", "true");
    await expect(easingSection).toHaveAttribute("data-expanded", "false");
    await expect(durationsSection).toHaveAttribute("data-expanded", "false");

    const durationsToggle = durationsSection.querySelector(
      ".fd-tokendocs-groupToggle",
    );
    if (!durationsToggle) {
      throw new Error("Expected durations toggle to exist.");
    }
    await userEvent.click(durationsToggle);
    await expect(durationsSection).toHaveAttribute("data-expanded", "true");
    await expect(easingSection).toHaveAttribute("data-expanded", "false");
    await expect(shadowSection).toHaveAttribute("data-expanded", "false");

    for (const path of requiredSemanticMotionPaths) {
      const row = semanticMotionByPath.get(path);
      await expect(
        row,
        `Missing semantic motion token row for ${path}`,
      ).toBeDefined();
      await expect(
        row !== undefined && row.light.trim().length > 0,
        `Expected light semantic motion value for ${path}`,
      ).toBe(true);
      await expect(
        row !== undefined && row.dark.trim().length > 0,
        `Expected dark semantic motion value for ${path}`,
      ).toBe(true);
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },
};
