import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { VisuallyHidden } from "@fodmapp/ui";

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

const defaultArgs = {
  children: "Open navigation",
} as const;

const meta = {
  title: "Utilities/VisuallyHidden",
  component: VisuallyHidden,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "Assistive-only text that still participates in naming.",
      table: {
        defaultValue: { summary: '"Open navigation"' },
        type: { summary: "ReactNode" },
      },
    },
    className: {
      control: false,
      table: { disable: true },
    },
  },
  args: defaultArgs,
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        component:
          "Use VisuallyHidden for assistive-only naming or descriptive text when the visible UI should stay compact. The hidden copy should clarify an existing visible control, not replace all visible context.",
      },
    },
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
    <span
      aria-hidden="true"
      className="inline-flex flex-col gap-1"
      data-testid="menu-icon"
    >
      <span className="block h-0.5 w-4 rounded-full bg-current" />
      <span className="block h-0.5 w-4 rounded-full bg-current" />
      <span className="block h-0.5 w-4 rounded-full bg-current" />
    </span>
  );
}

function AccessibleNameExample({ args }: { args?: Story["args"] }) {
  return (
    <VisuallyHiddenAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Assistive-only name
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Icon-only navigation trigger
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            The icon remains visual-only while the button name comes from the
            hidden text rendered inside the control.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs outline-hidden transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft"
            type="button"
          >
            <MenuIcon />
            <VisuallyHidden {...args} />
          </button>
          <p className="text-sm leading-5 text-muted-foreground">
            Screen readers announce "Open navigation" while sighted users only
            see the menu icon.
          </p>
        </div>
      </div>
    </VisuallyHiddenAuditFrame>
  );
}

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Single truthful example showing accessible naming for an icon-only control without turning the story into a generic button demo.",
      },
    },
  },
  render: () => <AccessibleNameExample args={defaultArgs} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Open navigation" });
    const hidden = canvas.getByText("Open navigation");
    const icon = canvas.getByTestId("menu-icon");

    await expect(button).toHaveAccessibleName("Open navigation");
    await expect(button.className).toContain("cursor-pointer");
    await expect(button.className).toContain("focus-visible:ring-ring-soft");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(hidden).toHaveAttribute("data-slot", "visually-hidden");
  },
};
