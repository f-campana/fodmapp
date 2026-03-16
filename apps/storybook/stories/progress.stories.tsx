import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Progress } from "@fodmapp/ui/progress";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function ProgressAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-progress-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  max: 100,
  value: 42,
} as const;

const meta = {
  title: "Primitives/Adapter/Progress",
  component: Progress,
  argTypes: {
    value: {
      description: "Current progress value from 0 to 100.",
      control: { type: "range", min: 0, max: 100, step: 1 },
      table: { defaultValue: { summary: "42" } },
    },
    max: {
      description: "Maximum value used for progressbar semantics.",
      control: { type: "number", min: 1, max: 100 },
      table: { defaultValue: { summary: "100" } },
    },
    className: {
      description: "Additional classes merged with the progress root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-progress-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

function ProgressSummary(
  args: Story["args"],
  options?: {
    longCopy?: boolean;
  },
) {
  const value = typeof args?.value === "number" ? args.value : 0;

  return (
    <div className="grid w-full gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">
            {options?.longCopy
              ? "Weekly meal plan import with a longer mobile-safe status label"
              : "Meal plan import"}
          </div>
          <div className="text-sm text-muted-foreground">
            {options?.longCopy
              ? "Keep the current step, fallback note, and percentage legible together when labels wrap on smaller screens."
              : "Syncing substitutions and tolerance notes."}
          </div>
        </div>
        <div className="text-sm font-medium text-foreground">{value}%</div>
      </div>
      <Progress
        aria-label={
          options?.longCopy ? "Import progress detailed" : "Import progress"
        }
        className={args?.className}
        max={args?.max ?? 100}
        value={args?.value}
      />
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ProgressAuditFrame maxWidth="md">
      {ProgressSummary(args)}
    </ProgressAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ProgressAuditFrame maxWidth="md">
      {ProgressSummary(defaultPlaygroundArgs)}
    </ProgressAuditFrame>
  ),
};

export const LongContext: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ProgressAuditFrame maxWidth="md" surface>
      {ProgressSummary(defaultPlaygroundArgs, { longCopy: true })}
    </ProgressAuditFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: () => (
    <ProgressAuditFrame maxWidth="md">
      {ProgressSummary({ value: 68, max: 100 })}
    </ProgressAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progress = canvas.getByRole("progressbar", {
      name: "Import progress",
    });
    const indicator = progress.querySelector(
      "[data-slot='progress-indicator']",
    );

    await expect(progress).toHaveAttribute("data-slot", "progress");
    await expect(progress).toHaveAttribute("aria-valuenow", "68");
    await expect(indicator).toHaveAttribute("data-slot", "progress-indicator");
    await expect(indicator?.className ?? "").toContain("bg-primary");
    await expect(indicator?.getAttribute("style") ?? "").toContain(
      "translateX(-32%)",
    );
    await expect(canvas.getByText("68%")).toBeVisible();
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: () => (
    <ProgressAuditFrame maxWidth="sm" surface>
      {ProgressSummary({ value: 42, max: 100 }, { longCopy: true })}
    </ProgressAuditFrame>
  ),
};
