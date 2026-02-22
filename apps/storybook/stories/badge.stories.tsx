import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const Neutral: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondaire",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Alerte",
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
