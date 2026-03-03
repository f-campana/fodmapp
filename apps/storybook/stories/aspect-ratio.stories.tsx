import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { AspectRatio } from "@fodmap/ui";

const meta = {
  title: "Primitives/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  argTypes: {
    ratio: {
      description: "Sets width-to-height ratio for contained media.",
      control: { type: "number", min: 0.5, max: 3, step: 0.1 },
      table: { defaultValue: { summary: "1.777... (16/9)" } },
    },
    className: {
      description: "Additional classes merged with the aspect-ratio root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Media or content constrained by the given ratio.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    ratio: 16 / 9,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-72 rounded-(--radius) border border-border bg-card p-2">
      <AspectRatio {...args} className="overflow-hidden rounded-(--radius)">
        <img
          alt="Assiette équilibrée"
          className="size-full object-cover"
          src="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = canvas.getByRole("img", { name: "Assiette équilibrée" });

    await expect(image.closest("[data-slot='aspect-ratio']")).toHaveAttribute(
      "data-slot",
      "aspect-ratio",
    );
  },
};

export const Square: Story = {
  args: {
    ratio: 1,
  },
  render: (args) => (
    <div className="w-48 rounded-(--radius) border border-border bg-card p-2">
      <AspectRatio
        {...args}
        className="overflow-hidden rounded-(--radius) bg-muted"
      />
    </div>
  ),
};
