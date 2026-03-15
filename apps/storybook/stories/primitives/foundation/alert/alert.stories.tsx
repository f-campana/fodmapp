import type { Meta, StoryObj } from "@storybook/react-vite";

import { CircleAlert, Info } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Alert, AlertDescription, AlertTitle } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function AlertAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-alert-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

type AlertStoryArgs = {
  variant: "default" | "destructive";
};

const defaultPlaygroundArgs = {
  variant: "default",
} satisfies AlertStoryArgs;

function ReviewAlert({ variant }: AlertStoryArgs) {
  const isDestructive = variant === "destructive";
  const Icon = isDestructive ? CircleAlert : Info;

  return (
    <Alert variant={variant}>
      <Icon aria-hidden="true" />
      <AlertTitle>
        {isDestructive ? "Activation blocked" : "Review ready"}
      </AlertTitle>
      <AlertDescription>
        {isDestructive
          ? "Snapshot values changed after export. Regenerate the packet before any activation apply step."
          : "Draft materialization and rescoring finished. Human review can now update the CSV before activation."}
      </AlertDescription>
    </Alert>
  );
}

const meta = {
  title: "Primitives/Foundation/Alert",
  component: Alert as ComponentType<AlertStoryArgs>,
  argTypes: {
    variant: {
      description: "Visual treatment for an inline alert message.",
      control: { type: "inline-radio" },
      options: ["default", "destructive"],
      table: { defaultValue: { summary: "default" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: {
      expanded: true,
      include: ["variant"],
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-alert-audit-root]"],
      },
    },
  },
} satisfies Meta<AlertStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <AlertAuditFrame maxWidth="md">
      <ReviewAlert {...args} />
    </AlertAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AlertAuditFrame maxWidth="md">
      <ReviewAlert {...defaultPlaygroundArgs} />
    </AlertAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");

    await expect(alert).toHaveAttribute("data-slot", "alert");
    await expect(alert).toHaveAttribute("data-variant", "default");
    await expect(canvas.getByText("Review ready")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
    await expect(
      canvas.getByText(
        "Draft materialization and rescoring finished. Human review can now update the CSV before activation.",
      ),
    ).toHaveAttribute("data-slot", "alert-description");
  },
};

export const Destructive: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AlertAuditFrame maxWidth="md">
      <ReviewAlert variant="destructive" />
    </AlertAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");

    await expect(alert).toHaveAttribute("data-variant", "destructive");
    await expect(alert.className).toContain("border-destructive");
    await expect(canvas.getByText("Activation blocked")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
  },
};
