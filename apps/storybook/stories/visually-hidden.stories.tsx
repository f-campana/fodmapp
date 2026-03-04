import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { VisuallyHidden } from "@fodmap/ui";

const meta = {
  title: "Utilities/VisuallyHidden",
  component: VisuallyHidden,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description:
        "Additional classes merged with the built-in sr-only utility classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description:
        "Text content that remains available to assistive technologies.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    children: "Ouvrir le menu",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InAccessibleButton: Story = {
  render: (args) => (
    <button className="rounded-md border border-border px-3 py-2" type="button">
      <span aria-hidden="true">☰</span>
      <VisuallyHidden {...args} />
    </button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByRole("button", { name: "Ouvrir le menu" });
    const hidden = canvas.getByText("Ouvrir le menu");

    await expect(button).toBeInTheDocument();
    await expect(hidden).toHaveAttribute("data-slot", "visually-hidden");
    await expect(hidden.className).toContain("sr-only");
  },
};

export const WithCustomClass: Story = {
  args: {
    children: "Texte auxiliaire",
    className: "text-red-500",
  },
  render: (args) => <VisuallyHidden {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const hidden = canvas.getByText("Texte auxiliaire");
    await expect(hidden.className).toContain("sr-only");
    await expect(hidden.className).toContain("text-red-500");
  },
};
