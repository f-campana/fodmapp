import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, fn, within } from "storybook/test";

import { Button } from "@fodmapp/ui/button";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ButtonAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-button-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  children: "Save changes",
  disabled: false,
  onClick: fn(),
  size: "default",
  type: "button",
  variant: "default",
} as const;

const meta = {
  title: "Primitives/Foundation/Button",
  component: Button,
  args: defaultPlaygroundArgs,
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      description: "Visual treatment for the button surface.",
      options: [
        "default",
        "secondary",
        "outline",
        "ghost",
        "destructive",
        "link",
      ],
      table: { defaultValue: { summary: "default" } },
    },
    size: {
      control: { type: "inline-radio" },
      description: "Height and spacing preset, including icon-only sizes.",
      options: [
        "default",
        "xs",
        "sm",
        "lg",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
      ],
      table: { defaultValue: { summary: "default" } },
    },
    disabled: {
      control: { type: "boolean" },
      description:
        "Prevents interaction and keeps the button in the accessibility tree.",
      table: { defaultValue: { summary: "false" } },
    },
    type: {
      control: { type: "inline-radio" },
      description:
        "Native button type. Defaults to `button` to avoid implicit form submission.",
      options: ["button", "submit", "reset"],
      table: { defaultValue: { summary: "button" } },
    },
    children: {
      control: "text",
      description: "Visible button label.",
      table: { type: { summary: "ReactNode" } },
    },
    onClick: {
      description: "Callback fired when the button is activated.",
    },
    asChild: {
      control: false,
      description:
        "Supported for polymorphic rendering; documented with a dedicated story.",
      table: { type: { summary: "boolean" } },
    },
    className: {
      control: "text",
      description:
        "Additional classes merged with the selected button variant.",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-button-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <ButtonAuditFrame maxWidth="md">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Plan changes</p>
          <p className="text-sm text-muted-foreground">
            Use one clear primary action for the next confirmed step.
          </p>
        </div>
        <Button {...args} />
      </div>
    </ButtonAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ButtonAuditFrame maxWidth="md">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Plan changes</p>
          <p className="text-sm text-muted-foreground">
            Save the reviewed substitutions once the meal plan is ready.
          </p>
        </div>
        <Button {...defaultPlaygroundArgs}>Save changes</Button>
      </div>
    </ButtonAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Save changes" });

    await expect(button).toHaveAttribute("data-slot", "button");
    await expect(button).toHaveAttribute("data-variant", "default");
    await expect(button).toHaveAttribute("data-size", "default");
    await expect(button).toHaveAttribute("type", "button");
    await expect(button.className).toContain("focus-visible:border-ring");
    await expect(button.className).toContain("focus-visible:ring-ring-soft");
  },
};

export const Disabled: Story = {
  args: {
    ...defaultPlaygroundArgs,
    children: "Await review",
    disabled: true,
  },
  parameters: fixedStoryParameters,
  render: (args) => (
    <ButtonAuditFrame maxWidth="md">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Plan changes</p>
          <p className="text-sm text-muted-foreground">
            Lock the action while the review packet is still incomplete.
          </p>
        </div>
        <Button {...args} />
      </div>
    </ButtonAuditFrame>
  ),
};

export const AsChildLink: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ButtonAuditFrame maxWidth="md">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Reference link</p>
          <p className="text-sm text-muted-foreground">
            Use `asChild` when the action is genuinely navigational.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/substitutions/review">Open review packet</a>
        </Button>
      </div>
    </ButtonAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Open review packet" });

    await expect(link).toHaveAttribute("data-slot", "button");
    await expect(link).toHaveAttribute("data-variant", "outline");
    await expect(link).not.toHaveAttribute("type");
  },
};
