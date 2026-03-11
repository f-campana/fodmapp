import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { DatePicker } from "@fodmap/ui";

import { StoryFrame } from "./story-frame";

const meta = {
  title: "Composed/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  argTypes: {
    value: {
      description: "Controlled selected date value.",
      control: { type: "date" },
      table: { defaultValue: { summary: "undefined" } },
    },
    defaultValue: {
      description: "Initial selected date in uncontrolled mode.",
      control: { type: "date" },
      table: { defaultValue: { summary: "undefined" } },
    },
    open: {
      description: "Controlled popover open state.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    defaultOpen: {
      description: "Initial popover open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    placeholder: {
      description: "Placeholder text shown when no date is selected.",
      control: { type: "text" },
      table: { defaultValue: { summary: "Choisir une date" } },
    },
    triggerAriaLabel: {
      description: "Accessible label applied to the trigger button.",
      control: { type: "text" },
      table: { defaultValue: { summary: "Sélecteur de date" } },
    },
    disabled: {
      description: "Disables trigger interaction.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    calendarProps: {
      description:
        "Additional Calendar props excluding mode/selected/onSelect.",
      control: { type: "object" },
      table: { defaultValue: { summary: "{}" } },
    },
    className: {
      description: "Additional class names for the date picker root.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    triggerClassName: {
      description: "Additional class names for the trigger slot.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    contentClassName: {
      description: "Additional class names for the popover content slot.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    calendarClassName: {
      description: "Additional class names for the calendar slot.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    onValueChange: {
      description: "Callback invoked when the selected date changes.",
    },
    onOpenChange: {
      description: "Callback invoked when popover open state changes.",
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
    placeholder: "Choisir une date",
    triggerAriaLabel: "Date de rendez-vous",
    calendarProps: {
      defaultMonth: new Date(2026, 2, 1),
    },
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <StoryFrame centeredMinHeight={72} maxWidth="sm" surface>
      <DatePicker {...args} />
    </StoryFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='date-picker']");
    const trigger = canvas.getByRole("button", {
      name: "Date de rendez-vous",
    });

    await expect(root).toHaveAttribute("data-slot", "date-picker");
    await expect(trigger).toHaveAttribute("data-slot", "date-picker-trigger");
    await expect(trigger.className).toContain("border-input");
    await expect(trigger.className).toContain(
      "data-[empty=true]:text-muted-foreground",
    );
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='date-picker-content']",
      );
      if (!node) {
        throw new Error("DatePicker content not mounted yet.");
      }
      return node as HTMLElement;
    });

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");

    const calendar = document.body.querySelector(
      "[data-slot='date-picker-calendar']",
    );
    await expect(calendar).toHaveAttribute("data-slot", "date-picker-calendar");

    const dayButton = document.body.querySelector(
      "[data-slot='date-picker-calendar'] [role='gridcell'] button",
    ) as HTMLButtonElement | null;

    if (!dayButton) {
      throw new Error("No calendar day button found.");
    }

    await userEvent.click(dayButton);

    await waitFor(() => {
      if (document.body.querySelector("[data-slot='date-picker-content']")) {
        throw new Error(
          "DatePicker content should close after date selection.",
        );
      }
    });
  },
};

function ControlledExample(args: Story["args"]) {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 2, 14));

  return (
    <StoryFrame centeredMinHeight={72} maxWidth="sm" surface>
      <div className="space-y-3">
        <DatePicker
          {...args}
          onValueChange={(nextValue) => {
            setValue(nextValue);
            args?.onValueChange?.(nextValue);
          }}
          value={value}
        />
        <p className="text-sm text-muted-foreground">
          Valeur: {value ? value.toISOString().slice(0, 10) : "aucune"}
        </p>
      </div>
    </StoryFrame>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
};

export const WithBounds: Story = {
  args: {
    calendarProps: {
      defaultMonth: new Date(2026, 2, 1),
      fromDate: new Date(2026, 2, 5),
      toDate: new Date(2026, 2, 26),
    },
  },
  render: (args) => (
    <StoryFrame centeredMinHeight={72} maxWidth="sm" surface>
      <DatePicker {...args} />
    </StoryFrame>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <StoryFrame centeredMinHeight={72} maxWidth="sm" surface>
      <DatePicker {...args} />
    </StoryFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  args: {
    ...Default.args,
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  globals: {
    theme: "dark",
  },
};
