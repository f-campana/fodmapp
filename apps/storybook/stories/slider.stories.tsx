import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Slider } from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      description: "Sets initial slider thumb value array.",
      control: "object",
      table: { defaultValue: { summary: "[40]" } },
    },
    min: {
      description: "Minimum value of the slider range.",
      control: { type: "number", min: 0, max: 100 },
      table: { defaultValue: { summary: "0" } },
    },
    max: {
      description: "Maximum value of the slider range.",
      control: { type: "number", min: 1, max: 100 },
      table: { defaultValue: { summary: "100" } },
    },
    step: {
      description: "Step increment between allowed slider values.",
      control: { type: "number", min: 1, max: 25 },
      table: { defaultValue: { summary: "1" } },
    },
    disabled: {
      description: "Disables slider interaction.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onValueChange: {
      description: "Callback invoked when slider value changes.",
    },
    className: {
      description: "Additional classes merged with slider root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    defaultValue: [40],
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-72">
      <Slider {...args} aria-label="Seuil FODMAP" />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole("slider", { name: "Seuil FODMAP" });
    const root = thumb.closest("[data-slot='slider']");

    await expect(root).toHaveAttribute("data-slot", "slider");
    await expect(
      root?.querySelector("[data-slot='slider-track']"),
    ).toBeTruthy();
    await expect(
      root?.querySelector("[data-slot='slider-range']"),
    ).toBeTruthy();
    await expect(thumb).toHaveAttribute("data-slot", "slider-thumb");
    await expect(thumb.className).toContain("focus-visible:ring-ring-soft");
    await expect(thumb.className).not.toContain("focus-visible:ring-ring/50");

    thumb.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onValueChange).toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onValueChange: fn(),
  },
  render: (args) => (
    <div className="w-72">
      <Slider {...args} aria-label="Seuil désactivé" />
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
