import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Button } from "@fodmap/ui/button";
import { ButtonGroup } from "@fodmap/ui/button-group";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ButtonGroupAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-button-group-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/ButtonGroup",
  component: ButtonGroup,
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: { type: "inline-radio" },
      description: "Layout direction for grouped actions.",
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    children: {
      control: false,
      description: "Child buttons rendered inside the group.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-button-group-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderActions(orientation: "horizontal" | "vertical") {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Plan navigation</p>
        <p className="text-sm text-muted-foreground">
          Group peer navigation actions together and keep the primary save
          action outside the group.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonGroup aria-label="Plan navigation" orientation={orientation}>
          <Button variant="outline">Previous day</Button>
          <Button variant="outline">Today</Button>
          <Button variant="outline">Next day</Button>
        </ButtonGroup>
        <Button>Save changes</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Use a separate primary button when one action carries more weight than
        the grouped peers.
      </p>
    </div>
  );
}

function renderVerticalActions() {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Plan navigation</p>
        <p className="text-sm text-muted-foreground">
          Switch to vertical orientation when grouped peers need a narrow layout
          without wrapping into uneven rows.
        </p>
      </div>
      <ButtonGroup aria-label="Plan navigation" orientation="vertical">
        <Button variant="outline">Previous day</Button>
        <Button variant="outline">Today</Button>
        <Button variant="outline">Next day</Button>
      </ButtonGroup>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ButtonGroupAuditFrame maxWidth="md">
      {renderActions(args.orientation ?? "horizontal")}
    </ButtonGroupAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ButtonGroupAuditFrame maxWidth="md">
      {renderActions("horizontal")}
    </ButtonGroupAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Plan navigation" });
    const buttons = canvas.getAllByRole("button");

    await expect(group).toHaveAttribute("data-slot", "button-group");
    await expect(group).toHaveAttribute("data-orientation", "horizontal");
    await expect(group.className).toContain(
      "[&>[data-slot=button]]:rounded-none",
    );
    await expect(buttons).toHaveLength(4);
  },
};

export const Vertical: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ButtonGroupAuditFrame maxWidth="sm">
      {renderVerticalActions()}
    </ButtonGroupAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Plan navigation" });

    await expect(group).toHaveAttribute("data-orientation", "vertical");
    await expect(group.className).toContain("flex-col");
  },
};
