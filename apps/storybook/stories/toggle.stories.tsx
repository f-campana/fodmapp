import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Toggle } from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Visual style variant for the toggle control.",
      control: { type: "radio" },
      options: ["default", "outline"],
      table: { defaultValue: { summary: "default" } },
    },
    size: {
      description: "Size variant for the toggle control.",
      control: { type: "radio" },
      options: ["sm", "default", "lg"],
      table: { defaultValue: { summary: "default" } },
    },
    defaultPressed: {
      description: "Sets initial pressed state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables user interaction.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onPressedChange: {
      description: "Callback invoked when pressed state changes.",
    },
    className: {
      description: "Additional classes merged with toggle classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Visible label or icon content inside the toggle.",
      control: "text",
      table: { defaultValue: { summary: "Filtre" } },
    },
  },
  args: {
    variant: "default",
    size: "default",
    defaultPressed: false,
    disabled: false,
    onPressedChange: fn(),
    children: "Filtre",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Toggle {...args} aria-label="Filtre rapide">
      {args.children}
    </Toggle>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Filtre rapide" });

    await userEvent.click(toggle);

    await expect(args.onPressedChange).toHaveBeenCalledWith(true);
    await expect(toggle).toHaveAttribute("data-slot", "toggle");
    await expect(toggle).toHaveAttribute(
      "data-variant",
      args.variant ?? "default",
    );
    await expect(toggle).toHaveAttribute("data-size", args.size ?? "default");
    await expect(toggle.className).toContain("data-[state=on]:bg-accent");
    await expect(toggle.className).toContain(
      "data-[state=on]:text-accent-foreground",
    );
    await expect(toggle.className).toContain("focus-visible:ring-ring-soft");
    await expect(toggle.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Vue avancée",
    onPressedChange: fn(),
  },
  render: (args) => (
    <Toggle {...args} aria-label="Vue avancée">
      {args.children}
    </Toggle>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
