import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Badge } from "@fodmap/ui";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description:
        "Controls the visual appearance for neutral, secondary, destructive, and outline contexts.",
      control: { type: "radio" },
      options: ["default", "secondary", "destructive", "outline"],
      table: { defaultValue: { summary: "default" } },
    },
    children: {
      description: "Content rendered inside the badge.",
      control: "text",
      table: {
        type: { summary: "ReactNode" },
      },
    },
    className: {
      description:
        "Additional CSS classes merged with the badge variant classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    variant: "default",
    children: "Niveau bas",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Niveau bas");
    await expect(badge.className).toContain("bg-primary");
    await expect(badge.className).toContain("text-primary-foreground");
    await expect(badge.className).toContain("hover:bg-primary-hover");
    await expect(badge.className).not.toContain("hover:bg-primary/90");
    await expect(badge.className).toContain("focus-visible:border-ring");
    await expect(badge.className).toContain("focus-visible:ring-ring-soft");
    await expect(badge).toHaveAttribute("data-slot", "badge");
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
    await expect(badge.className).toContain("bg-secondary");
    await expect(badge.className).toContain("text-secondary-foreground");
    await expect(badge.className).toContain("hover:bg-secondary-hover");
    await expect(badge.className).not.toContain("hover:bg-secondary/80");
    await expect(badge).toHaveAttribute("data-slot", "badge");
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
    await expect(badge.className).toContain("bg-destructive");
    await expect(badge.className).toContain("text-destructive-foreground");
    await expect(badge.className).toContain("hover:bg-destructive-hover");
    await expect(badge.className).not.toContain("hover:bg-destructive/80");
    await expect(badge.className).not.toContain("bg-destructive/10");
    await expect(badge).toHaveAttribute("data-slot", "badge");
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
