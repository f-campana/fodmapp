import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Separator } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function SeparatorAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-separator-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  decorative: true,
  orientation: "horizontal",
} as const;

const meta = {
  title: "Primitives/Adapter/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      description: "Sets the separator direction.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    decorative: {
      description:
        "Hide the semantic separator role when the divider is only visual.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    className: {
      description: "Additional classes merged with the separator root.",
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
        include: ["[data-separator-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

function SeparatorExample({ args }: { args?: Story["args"] }) {
  const orientation = args?.orientation ?? defaultPlaygroundArgs.orientation;
  const separatorClassName = [
    args?.className,
    orientation === "horizontal" ? "my-4" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (orientation === "vertical") {
    return (
      <SeparatorAuditFrame centeredMinHeight={72} maxWidth="sm">
        <div className="inline-flex h-20 items-center gap-4 rounded-(--radius) border border-border bg-card p-4">
          <span className="text-sm text-foreground">Plan</span>
          <Separator {...args} className={separatorClassName} />
          <span className="text-sm text-foreground">Review</span>
        </div>
      </SeparatorAuditFrame>
    );
  }

  return (
    <SeparatorAuditFrame maxWidth="md">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Ingredients</p>
        <Separator {...args} className={separatorClassName} />
        <p className="text-sm text-muted-foreground">
          Decorative separators split nearby content without adding a landmark.
        </p>
      </div>
    </SeparatorAuditFrame>
  );
}

export const Playground: Story = {
  render: (args) => <SeparatorExample args={args} />,
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => <SeparatorExample args={defaultPlaygroundArgs} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole("separator")).toBeNull();
  },
};

export const SemanticVertical: Story = {
  args: {
    ...defaultPlaygroundArgs,
    decorative: false,
    orientation: "vertical",
  },
  parameters: fixedStoryParameters,
  render: (args) => <SeparatorExample args={args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole("separator");

    await expect(separator).toHaveAttribute("data-slot", "separator");
    await expect(separator).toHaveAttribute("aria-orientation", "vertical");
  },
};
