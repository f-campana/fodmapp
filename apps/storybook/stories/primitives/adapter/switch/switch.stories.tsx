import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Label } from "@fodmap/ui/label";
import { Switch } from "@fodmap/ui/switch";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function SwitchAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-switch-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultChecked: false,
  disabled: false,
  "aria-invalid": false,
  onCheckedChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/Switch",
  component: Switch,
  argTypes: {
    defaultChecked: {
      description: "Sets the initial checked state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables pointer and keyboard interaction.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    "aria-invalid": {
      description: "Applies semantic invalid styling tokens.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onCheckedChange: {
      description: "Callback fired whenever the checked state changes.",
    },
    className: {
      description: "Additional classes merged with the switch root.",
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
        include: ["[data-switch-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;
type SwitchStoryArgs = Story["args"];

function SwitchField({
  args,
  description,
  label,
  switchProps,
}: {
  args?: SwitchStoryArgs;
  description: string;
  label: string;
  switchProps?: {
    "data-slot"?: string;
    className?: ComponentProps<typeof Switch>["className"];
  };
}) {
  const controlId = useId();
  const { defaultChecked = false, onCheckedChange, ...switchArgs } = args ?? {};
  const [checked, setChecked] = useState(defaultChecked);

  useEffect(() => {
    setChecked(defaultChecked);
  }, [defaultChecked]);

  return (
    <div className="flex items-start justify-between gap-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="min-w-0 space-y-1">
        <Label
          className="text-sm font-medium text-foreground"
          htmlFor={controlId}
        >
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Switch
          {...switchArgs}
          {...switchProps}
          checked={checked}
          id={controlId}
          onCheckedChange={(nextChecked) => {
            setChecked(nextChecked);
            onCheckedChange?.(nextChecked);
          }}
        />
        <span className="text-xs text-muted-foreground">
          {checked ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <SwitchAuditFrame maxWidth="md">
      <SwitchField
        args={args}
        description="Keep daily reminders enabled so the substitution check-in appears before lunch."
        label="Daily reminders"
      />
    </SwitchAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SwitchAuditFrame maxWidth="md">
      <SwitchField
        args={defaultPlaygroundArgs}
        description="Keep daily reminders enabled so the substitution check-in appears before lunch."
        label="Daily reminders"
      />
    </SwitchAuditFrame>
  ),
};

export const Disabled: Story = {
  args: {
    ...defaultPlaygroundArgs,
    defaultChecked: true,
    disabled: true,
    onCheckedChange: fn(),
  },
  parameters: fixedStoryParameters,
  render: (args) => (
    <SwitchAuditFrame maxWidth="md">
      <SwitchField
        args={args}
        description="Reminder settings are locked while the shared care plan is being reviewed."
        label="Daily reminders"
      />
    </SwitchAuditFrame>
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
    onCheckedChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <SwitchAuditFrame maxWidth="md">
      <SwitchField
        args={args}
        description="Verify label linkage, stable slot hooks, and checked semantics."
        label="Daily reminders"
        switchProps={{ "data-slot": "custom-switch" }}
      />
    </SwitchAuditFrame>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Daily reminders" });
    const label = canvas.getByText("Daily reminders");

    await expect(control).toHaveAttribute("data-slot", "switch");
    await expect(
      control.querySelector("[data-slot='switch-thumb']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='custom-switch']"),
    ).toBeNull();
    await expect(control).toHaveAttribute("aria-checked", "false");
    await expect(control.className).toContain("cursor-pointer");
    await expect(control.className).toContain("focus-visible:ring-ring-soft");

    await userEvent.click(label);

    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
    await expect(control).toHaveAttribute("aria-checked", "true");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <SwitchAuditFrame maxWidth="sm">
      <SwitchField
        args={{
          ...defaultPlaygroundArgs,
          defaultChecked: true,
          onCheckedChange: fn(),
        }}
        description="Show the reminder only after breakfast, skip it when the plan already contains a checked substitution, and keep the helper copy readable on smaller screens."
        label="Daily substitution reminder"
      />
    </SwitchAuditFrame>
  ),
};
