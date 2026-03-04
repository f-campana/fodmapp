import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Spinner } from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  argTypes: {
    size: {
      description:
        "Controls spinner dimensions for dense or prominent contexts.",
      control: { type: "radio" },
      options: ["sm", "default", "lg"],
      table: { defaultValue: { summary: "default" } },
    },
    label: {
      description:
        "Accessible status text announced to assistive technologies.",
      control: "text",
      table: { defaultValue: { summary: "Chargement" } },
    },
    className: {
      description: "Additional classes merged with spinner root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    size: "default",
    label: "Chargement",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    await expect(status).toHaveAttribute("data-slot", "spinner");
    await expect(status).toHaveAttribute("data-size", "default");
    await expect(canvas.getByText("Chargement")).toBeInTheDocument();

    const svg = status.querySelector("svg");
    await expect(svg).toBeTruthy();
    await expect(svg?.className.baseVal ?? "").toContain("animate-spin");
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    label: "Chargement court",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    label: "Chargement prolongé",
  },
};

export const DarkMode: Story = {
  args: {
    size: "default",
    label: "Chargement sombre",
  },
  globals: {
    theme: "dark",
  },
};
