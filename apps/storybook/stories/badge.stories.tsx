import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Badge } from "@fodmap/ui";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Niveau bas",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Niveau bas");
    await expect(badge.className).toContain("focus:ring-ring-accessible");
    await expect(badge.className).not.toContain("focus:ring-ring ");
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondaire",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Secondaire");
    await expect(badge.className).toContain("hover:bg-secondary-hover");
    await expect(badge.className).not.toContain("hover:bg-secondary/80");
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Alerte",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Alerte");
    await expect(badge.className).toContain("hover:bg-destructive-hover");
    await expect(badge.className).not.toContain("hover:bg-destructive/80");
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Contour",
  },
};

export const DarkModeDefault: Story = {
  args: {
    variant: "default",
    children: "Mode sombre",
  },
  globals: {
    theme: "dark",
  },
};
