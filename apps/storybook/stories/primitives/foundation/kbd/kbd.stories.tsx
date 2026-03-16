import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Kbd, KbdGroup } from "@fodmapp/ui/kbd";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function KbdAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-kbd-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  argTypes: {
    children: {
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
          "Kbd documents keyboard input in interface copy. It does not register shortcuts or add command behavior by itself.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-kbd-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Single key hint used inline inside help text rather than as decorative typography.",
      },
    },
  },
  render: () => (
    <KbdAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Help text
          </p>
          <p className="text-sm leading-5 text-foreground">
            Press <Kbd>Enter</Kbd> to confirm the suggested swap.
          </p>
        </div>
      </div>
    </KbdAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const key = canvas.getByText("Enter");

    await expect(key.tagName).toBe("KBD");
    await expect(key).toHaveAttribute("data-slot", "kbd");
  },
};

export const Shortcut: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Grouped shortcut hint for support copy where the app already owns the actual keyboard binding.",
      },
    },
  },
  render: () => (
    <KbdAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Search shortcut
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm leading-5 text-muted-foreground">
              Open ingredient search from anywhere in the meal planner.
            </p>
            <KbdGroup>
              <Kbd>Cmd</Kbd>
              <span
                aria-hidden="true"
                className="text-sm text-muted-foreground"
              >
                +
              </span>
              <Kbd>K</Kbd>
            </KbdGroup>
          </div>
        </div>
      </div>
    </KbdAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByText("Cmd").closest("[data-slot='kbd-group']");

    await expect(group).toHaveAttribute("data-slot", "kbd-group");
    await expect(canvas.getByText("K")).toHaveAttribute("data-slot", "kbd");
  },
};
