import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "@fodmap/ui";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Appliquer",
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "default",
    size: "default",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Appliquer" });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Comparer",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Détails",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Supprimer",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Fermer",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Voir plus",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Indisponible",
  },
};

export const DarkModePrimary: Story = {
  args: {
    children: "Confirmer",
  },
  globals: {
    theme: "dark",
  },
};
