import { type ComponentProps, type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { ToggleGroup, ToggleGroupItem } from "@fodmapp/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ToggleGroupAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-toggle-group-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  type: "single",
  orientation: "horizontal",
  defaultValue: "low",
  disabled: false,
  onValueChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/ToggleGroup",
  component: ToggleGroup,
  argTypes: {
    type: {
      description: "Selection mode for the group.",
      control: { type: "inline-radio" },
      options: ["single", "multiple"],
      table: { defaultValue: { summary: "single" } },
    },
    orientation: {
      description: "Layout orientation for the group.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    defaultValue: {
      description: "Initial selected value or values in uncontrolled mode.",
      control: "object",
      table: { defaultValue: { summary: '"low"' } },
    },
    disabled: {
      description: "Disables every toggle in the group.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onValueChange: {
      description: "Callback fired whenever the selected value set changes.",
    },
    className: {
      description: "Additional classes merged with the group root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "ToggleGroupItem composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-toggle-group-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;
type ToggleGroupStoryArgs = Story["args"];
type ToggleGroupValue = string | string[];
type ToggleGroupChangeHandler = (value: ToggleGroupValue) => void;

type ToggleGroupFieldItem = {
  className?: string;
  dataSlot?: string;
  label: string;
  value: string;
};

function normalizeToggleGroupValue(
  args?: ToggleGroupStoryArgs,
): ToggleGroupValue {
  if (args?.type === "multiple") {
    return Array.isArray(args.defaultValue)
      ? args.defaultValue
      : args?.defaultValue
        ? [args.defaultValue]
        : ["low"];
  }

  return Array.isArray(args?.defaultValue)
    ? (args.defaultValue[0] ?? "low")
    : (args?.defaultValue ?? "low");
}

function summarizeValue(value: ToggleGroupValue) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function ToggleGroupField({
  args,
  description,
  groupProps,
  items,
  label,
}: {
  args?: ToggleGroupStoryArgs;
  description: string;
  groupProps?: {
    "data-slot"?: string;
    className?: ComponentProps<typeof ToggleGroup>["className"];
  };
  items: readonly ToggleGroupFieldItem[];
  label: string;
}) {
  const {
    className,
    defaultValue,
    disabled = false,
    onValueChange,
    orientation = "horizontal",
    type = "single",
  } = args ?? {};
  const initialValue = normalizeToggleGroupValue(args);
  const serializedDefaultValue = Array.isArray(defaultValue)
    ? defaultValue.join(",")
    : (defaultValue ?? "");
  const handleValueChange = onValueChange as
    | ToggleGroupChangeHandler
    | undefined;

  return (
    <ToggleGroupFieldState
      className={className}
      description={description}
      disabled={disabled}
      groupProps={groupProps}
      initialValue={initialValue}
      items={items}
      key={`${type}-${orientation}-${serializedDefaultValue}`}
      label={label}
      onValueChange={handleValueChange}
      orientation={orientation}
      type={type}
    />
  );
}

function ToggleGroupFieldState({
  className,
  description,
  disabled,
  groupProps,
  initialValue,
  items,
  label,
  onValueChange,
  orientation,
  type,
}: {
  className?: ComponentProps<typeof ToggleGroup>["className"];
  description: string;
  disabled: boolean;
  groupProps?: {
    "data-slot"?: string;
    className?: ComponentProps<typeof ToggleGroup>["className"];
  };
  initialValue: ToggleGroupValue;
  items: readonly ToggleGroupFieldItem[];
  label: string;
  onValueChange?: ToggleGroupChangeHandler;
  orientation: "horizontal" | "vertical";
  type: "single" | "multiple";
}) {
  const [currentValue, setCurrentValue] =
    useState<ToggleGroupValue>(initialValue);

  return (
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {type === "multiple" ? (
        <ToggleGroup
          className={groupProps?.className ?? className}
          data-slot={groupProps?.["data-slot"]}
          disabled={disabled}
          orientation={orientation}
          type="multiple"
          value={Array.isArray(currentValue) ? currentValue : [currentValue]}
          onValueChange={(nextValue) => {
            setCurrentValue(nextValue);
            onValueChange?.(nextValue);
          }}
        >
          {items.map((item) => (
            <ToggleGroupItem
              aria-label={item.label}
              className={item.className}
              data-slot={item.dataSlot}
              key={item.value}
              value={item.value}
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <ToggleGroup
          className={groupProps?.className ?? className}
          data-slot={groupProps?.["data-slot"]}
          disabled={disabled}
          orientation={orientation}
          type="single"
          value={
            Array.isArray(currentValue) ? (currentValue[0] ?? "") : currentValue
          }
          onValueChange={(nextValue) => {
            setCurrentValue(nextValue);
            onValueChange?.(nextValue);
          }}
        >
          {items.map((item) => (
            <ToggleGroupItem
              aria-label={item.label}
              className={item.className}
              data-slot={item.dataSlot}
              key={item.value}
              value={item.value}
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <p className="text-xs text-muted-foreground">
        Current selection: {summarizeValue(currentValue)}
      </p>
    </div>
  );
}

const defaultItems = [
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
];

export const Playground: Story = {
  render: (args) => (
    <ToggleGroupAuditFrame maxWidth="md">
      <ToggleGroupField
        args={args}
        description="Use a small group when the user needs one active filter or a compact multi-select set."
        items={defaultItems}
        label="Symptom threshold"
      />
    </ToggleGroupAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ToggleGroupAuditFrame maxWidth="md">
      <ToggleGroupField
        args={defaultPlaygroundArgs}
        description="Use a small group when the user needs one active filter or a compact multi-select set."
        items={defaultItems}
        label="Symptom threshold"
      />
    </ToggleGroupAuditFrame>
  ),
};

export const Multiple: Story = {
  args: {
    ...defaultPlaygroundArgs,
    type: "multiple",
    defaultValue: ["low", "moderate"],
    onValueChange: fn(),
  },
  parameters: fixedStoryParameters,
  render: (args) => (
    <ToggleGroupAuditFrame maxWidth="md">
      <ToggleGroupField
        args={args}
        description="Multiple mode lets users keep several quick filters active at the same time."
        items={defaultItems}
        label="Active filters"
      />
    </ToggleGroupAuditFrame>
  ),
};

export const Vertical: Story = {
  args: {
    ...defaultPlaygroundArgs,
    orientation: "vertical",
    onValueChange: fn(),
  },
  parameters: fixedStoryParameters,
  render: (args) => (
    <ToggleGroupAuditFrame maxWidth="md">
      <ToggleGroupField
        args={args}
        description="Vertical layout works better when labels become slightly more descriptive."
        items={[
          { label: "Breakfast safe", value: "breakfast" },
          { label: "Lunch safe", value: "lunch" },
          { label: "Dinner safe", value: "dinner" },
        ]}
        label="Meal window"
      />
    </ToggleGroupAuditFrame>
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
    onValueChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <ToggleGroupAuditFrame maxWidth="md">
      <ToggleGroupField
        args={args}
        description="Verify keyboard focus movement, stable slot hooks, and single-select state changes."
        groupProps={{ "data-slot": "custom-group" }}
        items={[
          { dataSlot: "custom-item", label: "Low", value: "low" },
          { label: "Moderate", value: "moderate" },
          { label: "High", value: "high" },
        ]}
        label="Symptom threshold"
      />
    </ToggleGroupAuditFrame>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const low = canvas.getByRole("radio", { name: "Low" });
    const moderate = canvas.getByRole("radio", { name: "Moderate" });
    const root = low.closest("[data-slot='toggle-group']");

    await expect(root).toHaveAttribute("data-slot", "toggle-group");
    await expect(root).toHaveAttribute("data-orientation", "horizontal");
    await expect(
      canvasElement.querySelector("[data-slot='custom-group']"),
    ).toBeNull();
    await expect(low).toHaveAttribute("data-slot", "toggle-group-item");
    await expect(
      canvasElement.querySelector("[data-slot='custom-item']"),
    ).toBeNull();
    await expect(low).toHaveAttribute("aria-checked", "true");
    await expect(moderate).toHaveAttribute("aria-checked", "false");
    await expect(moderate.className).toContain("data-[state=on]:bg-accent");

    low.focus();
    await userEvent.keyboard("{ArrowRight}");

    await expect(moderate).toHaveFocus();
    await expect(low).toHaveAttribute("aria-checked", "true");
    await expect(moderate).toHaveAttribute("aria-checked", "false");

    await userEvent.click(moderate);

    await expect(args.onValueChange).toHaveBeenCalledWith("moderate");
    await expect(low).toHaveAttribute("aria-checked", "false");
    await expect(moderate).toHaveAttribute("aria-checked", "true");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <ToggleGroupAuditFrame maxWidth="sm">
      <ToggleGroupField
        args={{
          ...defaultPlaygroundArgs,
          orientation: "vertical",
          onValueChange: fn(),
        }}
        description="Longer labels should stay readable on small screens when you switch to a vertical layout and allow each item to wrap intentionally."
        groupProps={{ className: "w-full items-stretch" }}
        items={[
          {
            className:
              "h-auto min-h-11 w-full shrink whitespace-normal px-3 py-2 text-left justify-start",
            label: "Breakfast substitutions reviewed this week",
            value: "breakfast",
          },
          {
            className:
              "h-auto min-h-11 w-full shrink whitespace-normal px-3 py-2 text-left justify-start",
            label: "Lunch substitutions still under review",
            value: "lunch",
          },
          {
            className:
              "h-auto min-h-11 w-full shrink whitespace-normal px-3 py-2 text-left justify-start",
            label: "Dinner substitutions safe for batch cooking",
            value: "dinner",
          },
        ]}
        label="Meal window"
      />
    </ToggleGroupAuditFrame>
  ),
};
