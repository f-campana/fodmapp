import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Label, RadioGroup, RadioGroupItem } from "@fodmap/ui";

const meta = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      description: "Sets initial selected value for uncontrolled mode.",
      control: "text",
      table: { defaultValue: { summary: "sans-lactose" } },
    },
    value: {
      description: "Controls selected value when used in controlled mode.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    disabled: {
      description: "Disables the whole radio group.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onValueChange: {
      description: "Callback invoked when selected value changes.",
    },
    className: {
      description: "Additional classes merged with radio group classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "RadioGroupItem options with labels.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultValue: "sans-lactose",
    disabled: false,
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function options(disabled = false) {
  return (
    <>
      <div className="flex items-center gap-2">
        <RadioGroupItem
          aria-label="Sans lactose"
          disabled={disabled}
          id="regime-sans-lactose"
          value="sans-lactose"
        />
        <Label htmlFor="regime-sans-lactose">Sans lactose</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem
          aria-label="Végétarien"
          disabled={disabled}
          id="regime-vegetarien"
          value="vegetarien"
        />
        <Label htmlFor="regime-vegetarien">Végétarien</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem
          aria-label="Sans gluten"
          disabled={disabled}
          id="regime-sans-gluten"
          value="sans-gluten"
        />
        <Label htmlFor="regime-sans-gluten">Sans gluten</Label>
      </div>
    </>
  );
}

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args} aria-label="Préférence alimentaire">
      {options()}
    </RadioGroup>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", {
      name: "Préférence alimentaire",
    });
    const target = canvas.getByRole("radio", { name: "Végétarien" });

    await userEvent.click(target);
    await expect(args.onValueChange).toHaveBeenCalledWith("vegetarien");

    await expect(group).toHaveAttribute("data-slot", "radio-group");
    await expect(target).toHaveAttribute("data-slot", "radio-group-item");
    await expect(target.className).toContain("focus-visible:border-ring");
    await expect(target.className).toContain("focus-visible:ring-ring-soft");
    await expect(target.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onValueChange: fn(),
  },
  render: (args) => (
    <RadioGroup {...args} aria-label="Préférence désactivée">
      {options(true)}
    </RadioGroup>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByRole("radio", { name: "Végétarien" });

    await expect(target).toBeDisabled();
    target.click();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
