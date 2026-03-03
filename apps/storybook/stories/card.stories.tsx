import React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    children: {
      description:
        "Content rendered inside the card container, typically via card compound components.",
      control: "text",
      table: {
        type: { summary: "ReactNode" },
      },
    },
    className: {
      description:
        "Additional CSS classes merged with the root card container classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RecipeCard: Story = {
  render: () => (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <CardTitle>Galette de sarrasin</CardTitle>
        <CardDescription>Version faible FODMAP</CardDescription>
        <CardAction>12 min</CardAction>
      </CardHeader>
      <CardContent>Avec farine de sarrasin et ciboulette.</CardContent>
      <CardFooter>4 portions</CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = canvas.getByText("Galette de sarrasin");
    const description = canvas.getByText("Version faible FODMAP");
    const action = canvas.getByText("12 min");
    const content = canvas.getByText("Avec farine de sarrasin et ciboulette.");
    const footer = canvas.getByText("4 portions");

    const root = title.closest("[data-slot='card']");
    await expect(root).toBeTruthy();
    await expect(root?.className ?? "").toContain("border-border");
    await expect(root?.className ?? "").toContain("bg-card");
    await expect(root?.className ?? "").toContain("text-card-foreground");

    await expect(title).toHaveAttribute("data-slot", "card-title");
    await expect(description).toHaveAttribute("data-slot", "card-description");
    await expect(action).toHaveAttribute("data-slot", "card-action");
    await expect(content).toHaveAttribute("data-slot", "card-content");
    await expect(footer).toHaveAttribute("data-slot", "card-footer");
    await expect(title.parentElement).toHaveAttribute(
      "data-slot",
      "card-header",
    );
  },
};

export const DarkModeRecipeCard: Story = {
  ...RecipeCard,
  globals: {
    theme: "dark",
  },
};
