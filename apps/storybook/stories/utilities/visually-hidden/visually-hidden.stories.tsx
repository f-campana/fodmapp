import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { VisuallyHidden } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function VisuallyHiddenAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-visually-hidden-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  children: "Open navigation",
} as const;

const meta = {
  title: "Utilities/VisuallyHidden",
  component: VisuallyHidden,
  tags: ["autodocs"],
  argTypes: {
    children: {
      description: "Assistive-only text that still participates in naming.",
      control: "text",
      table: { defaultValue: { summary: '"Open navigation"' } },
    },
    className: {
      control: false,
      table: { disable: true },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-visually-hidden-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;

type Story = StoryObj<typeof meta>;

function MenuIcon() {
  return (
    <span aria-hidden="true" className="inline-flex flex-col gap-1">
      <span className="block h-0.5 w-4 rounded-full bg-current" />
      <span className="block h-0.5 w-4 rounded-full bg-current" />
      <span className="block h-0.5 w-4 rounded-full bg-current" />
    </span>
  );
}

function AccessibleIconButton({ args }: { args?: Story["args"] }) {
  return (
    <VisuallyHiddenAuditFrame centeredMinHeight={72} maxWidth="sm">
      <div className="space-y-3 rounded-(--radius) border border-border bg-card p-4">
        <button
          className="inline-flex size-11 items-center justify-center rounded-full border border-border text-foreground shadow-xs"
          type="button"
        >
          <MenuIcon />
          <VisuallyHidden {...args} />
        </button>
        <p className="text-sm text-muted-foreground">
          Keep the visible control compact and move the descriptive copy into
          assistive-only text when the icon alone is not enough.
        </p>
      </div>
    </VisuallyHiddenAuditFrame>
  );
}

export const Playground: Story = {
  render: (args) => <AccessibleIconButton args={args} />,
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => <AccessibleIconButton args={defaultPlaygroundArgs} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Open navigation" });
    const hidden = canvas.getByText("Open navigation");

    await expect(button).toBeInTheDocument();
    await expect(hidden).toHaveAttribute("data-slot", "visually-hidden");
  },
};
