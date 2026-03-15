import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { ScoreBar } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ScoreBarAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-score-bar-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/ScoreBar",
  component: ScoreBar,
  tags: ["batch-l"],
  args: {
    value: 0.62,
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-score-bar-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof ScoreBar>;

export default meta;

type Story = StoryObj<typeof meta>;

function ScoreCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm leading-5 text-muted-foreground">
            Pair the bar with nearby copy when users need to understand what the
            score means in context.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-foreground">
          {value.toFixed(2)}
        </span>
      </div>
      <ScoreBar aria-label={label} value={value} />
    </div>
  );
}

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ScoreBarAuditFrame maxWidth="md">
      <ScoreCard label="FODMAP safety score" value={0.62} />
    </ScoreBarAuditFrame>
  ),
};

export const Thresholds: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ScoreBarAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <ScoreBar label="Needs review" value={0.34} />
        <ScoreBar label="Monitor closely" value={0.6} />
        <ScoreBar label="Ready for activation" value={0.84} />
      </div>
    </ScoreBarAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <ScoreBarAuditFrame maxWidth="md">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <ScoreBar aria-label="Safety score" value={1.2} />
      </div>
    </ScoreBarAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const meter = canvas.getByRole("meter", { name: "Safety score" });
    const fill = meter.querySelector("[data-slot='score-bar-fill']");

    await expect(meter).toHaveAttribute("aria-valuenow", "1");
    await expect(fill).toHaveAttribute("data-status", "success");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <ScoreBarAuditFrame maxWidth="sm">
      <ScoreCard
        label="Safety score for oat milk substitution review"
        value={0.58}
      />
    </ScoreBarAuditFrame>
  ),
};
