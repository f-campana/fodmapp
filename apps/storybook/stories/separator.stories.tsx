import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Separator } from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      description: "Sets horizontal or vertical separator orientation.",
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    decorative: {
      description:
        "Marks separator as decorative when no semantic role is needed.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    className: {
      description: "Additional classes merged with separator classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    orientation: "horizontal",
    decorative: true,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-72 rounded-(--radius) border border-border bg-card p-4 text-sm text-muted-foreground">
      <p>Ingrédients</p>
      <Separator {...args} decorative={false} className="my-3" />
      <p>Instructions</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole("separator");

    await expect(separator).toHaveAttribute("data-slot", "separator");
    await expect(separator.className).toContain("bg-border");
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    decorative: false,
  },
  render: (args) => (
    <div className="inline-flex h-16 items-center gap-3 rounded-(--radius) border border-border bg-card p-3 text-sm">
      <span>Avant</span>
      <Separator {...args} />
      <span>Après</span>
    </div>
  ),
};
