import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import { Calendar } from "@fodmap/ui";

const meta = {
  title: "Primitives/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  argTypes: {
    mode: {
      description: "Selection mode for day picking.",
      control: { type: "inline-radio" },
      options: ["single", "multiple", "range"],
      table: { defaultValue: { summary: "single" } },
    },
    showOutsideDays: {
      description: "Shows days from adjacent months.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    fixedWeeks: {
      description: "Always renders six week rows.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    numberOfMonths: {
      description: "Number of months displayed at once.",
      control: { type: "number" },
      table: { defaultValue: { summary: "1" } },
    },
    disabled: {
      description: "Matcher used to disable days.",
      control: false,
      table: { type: { summary: "Matcher | Matcher[]" } },
    },
    selected: {
      description: "Selected date value(s).",
      control: false,
      table: { type: { summary: "Date | Date[] | DateRange | undefined" } },
    },
    onSelect: {
      description: "Callback invoked when selection changes.",
    },
  },
  args: {
    mode: "single",
    showOutsideDays: true,
    fixedWeeks: false,
    numberOfMonths: 1,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;
type RangeSelection = { from: Date | undefined; to?: Date | undefined };

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <Calendar {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='calendar']");
    const dayButton = canvasElement.querySelector("[role='gridcell'] button");

    await expect(root).toHaveAttribute("data-slot", "calendar");
    await expect(root?.className ?? "").toContain("border-border");
    await expect(dayButton?.className ?? "").toContain(
      "aria-selected:bg-primary",
    );
    await expect(dayButton?.className ?? "").toContain(
      "aria-selected:text-primary-foreground",
    );

    const nextButton = canvas.getByLabelText(/next month/i);
    await expect(nextButton.className).not.toContain(
      "focus-visible:ring-ring/50",
    );

    await userEvent.click(nextButton);
  },
};

function RangeExample(args: Story["args"]) {
  const [range, setRange] = useState<RangeSelection | undefined>();

  return (
    <div className="flex min-h-80 items-center justify-center">
      <Calendar
        {...args}
        mode="range"
        onSelect={(nextRange) =>
          setRange(nextRange as RangeSelection | undefined)
        }
        selected={range}
      />
    </div>
  );
}

export const Range: Story = {
  render: (args) => <RangeExample {...args} />,
};

export const MultipleMonths: Story = {
  args: {
    mode: "single",
    numberOfMonths: 2,
  },
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <Calendar {...args} />
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
