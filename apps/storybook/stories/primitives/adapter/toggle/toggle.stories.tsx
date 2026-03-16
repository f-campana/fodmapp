import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Toggle } from "@fodmap/ui/toggle";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ToggleAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-toggle-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  variant: "default",
  size: "default",
  defaultPressed: false,
  disabled: false,
  onPressedChange: fn(),
  children: "Show tolerated swaps",
} as const;

const meta = {
  title: "Primitives/Adapter/Toggle",
  component: Toggle,
  argTypes: {
    variant: {
      description: "Visual treatment for the toggle control.",
      control: { type: "inline-radio" },
      options: ["default", "outline"],
      table: { defaultValue: { summary: "default" } },
    },
    size: {
      description: "Size variant for the control surface.",
      control: { type: "inline-radio" },
      options: ["sm", "default", "lg"],
      table: { defaultValue: { summary: "default" } },
    },
    defaultPressed: {
      description: "Sets the initial pressed state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables pointer and keyboard interaction.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onPressedChange: {
      description: "Callback fired whenever the pressed state changes.",
    },
    className: {
      description: "Additional classes merged with the toggle root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Visible label inside the toggle button.",
      control: "text",
      table: { defaultValue: { summary: "Show tolerated swaps" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-toggle-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;
type ToggleStoryArgs = Story["args"];

function ToggleField({
  args,
  description,
  label,
  rowClassName,
  toggleProps,
}: {
  args?: ToggleStoryArgs;
  description: string;
  label: string;
  rowClassName?: string;
  toggleProps?: {
    "data-slot"?: string;
    className?: ComponentProps<typeof Toggle>["className"];
  };
}) {
  const {
    children = "Show tolerated swaps",
    defaultPressed = false,
    onPressedChange,
    ...toggleArgs
  } = args ?? {};
  const [pressed, setPressed] = useState(defaultPressed);

  useEffect(() => {
    setPressed(defaultPressed);
  }, [defaultPressed]);

  return (
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className={rowClassName ?? "flex items-center gap-3"}>
        <Toggle
          {...toggleArgs}
          {...toggleProps}
          aria-label={typeof children === "string" ? children : label}
          pressed={pressed}
          onPressedChange={(nextPressed) => {
            setPressed(nextPressed);
            onPressedChange?.(nextPressed);
          }}
        >
          {children}
        </Toggle>
        <span className="text-xs text-muted-foreground">
          {pressed ? "Active filter" : "Filter off"}
        </span>
      </div>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ToggleAuditFrame maxWidth="md">
      <ToggleField
        args={args}
        description="Use a single toggle when the user needs a quick view or formatting action without changing a persistent setting."
        label="Quick view"
      />
    </ToggleAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ToggleAuditFrame maxWidth="md">
      <ToggleField
        args={defaultPlaygroundArgs}
        description="Use a single toggle when the user needs a quick view or formatting action without changing a persistent setting."
        label="Quick view"
      />
    </ToggleAuditFrame>
  ),
};

export const Disabled: Story = {
  args: {
    ...defaultPlaygroundArgs,
    defaultPressed: true,
    disabled: true,
    onPressedChange: fn(),
  },
  parameters: fixedStoryParameters,
  render: (args) => (
    <ToggleAuditFrame maxWidth="md">
      <ToggleField
        args={args}
        description="Keep the current view visible while a background sync temporarily locks the toggle."
        label="Quick view"
      />
    </ToggleAuditFrame>
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
  args: {
    ...defaultPlaygroundArgs,
    onPressedChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <ToggleAuditFrame maxWidth="md">
      <ToggleField
        args={args}
        description="Verify pressed semantics, stable slot hooks, and focus tokens."
        label="Quick view"
        toggleProps={{ "data-slot": "custom-toggle" }}
      />
    </ToggleAuditFrame>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Show tolerated swaps" });

    await expect(toggle).toHaveAttribute("data-slot", "toggle");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(
      canvasElement.querySelector("[data-slot='custom-toggle']"),
    ).toBeNull();
    await expect(toggle.className).toContain("cursor-pointer");
    await expect(toggle.className).toContain("focus-visible:ring-ring-soft");

    await userEvent.click(toggle);

    await expect(args.onPressedChange).toHaveBeenCalledWith(true);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <ToggleAuditFrame maxWidth="sm">
      <ToggleField
        args={{
          ...defaultPlaygroundArgs,
          children:
            "Only show substitutions reviewed during the last seven days",
          onPressedChange: fn(),
        }}
        description="Longer toggle copy should still read cleanly on mobile when you explicitly allow wrapping on the control surface."
        label="Quick view"
        rowClassName="flex flex-col items-stretch gap-2"
        toggleProps={{
          className:
            "h-auto min-h-11 w-full shrink whitespace-normal px-3 py-2 text-left justify-start",
        }}
      />
    </ToggleAuditFrame>
  ),
};
