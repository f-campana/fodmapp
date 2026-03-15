import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";

import { Dot } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function DotAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-dot-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Dot",
  component: Dot,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: false,
      table: { disable: true },
    },
    label: {
      control: false,
      table: { disable: true },
    },
    className: {
      control: false,
      table: { disable: true },
    },
  },
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        component:
          "Dot maps FODMAP level to a compact color cue. Keep visible copy nearby when the meaning matters, and only rely on the hidden label when surrounding context already explains the signal.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-dot-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Dot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Default dot paired with visible copy so the tiny indicator never has to carry the whole meaning alone.",
      },
    },
  },
  render: () => (
    <DotAuditFrame maxWidth="sm">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Portion signal
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Blueberry serving
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <Dot aria-hidden="true" variant="low" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Faible FODMAP</p>
            <p className="text-sm leading-5 text-muted-foreground">
              The visible label carries the meaning, so the dot stays out of the
              accessibility tree in this row.
            </p>
          </div>
        </div>
      </div>
    </DotAuditFrame>
  ),
};

export const CustomLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Accessible-label override for compact audit views where the visible copy is handled elsewhere in the surrounding table.",
      },
    },
  },
  render: () => (
    <DotAuditFrame maxWidth="sm">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Review queue
          </p>
          <p className="text-sm leading-5 text-muted-foreground">
            This row uses the dot alone because the column heading already
            explains the visual cue.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">
            Coconut yogurt
          </span>
          <Dot label="Validation nutritionnelle en attente" variant="unknown" />
        </div>
      </div>
    </DotAuditFrame>
  ),
};
