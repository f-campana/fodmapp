import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@fodmap/ui";

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RecipeCard: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Galette de sarrasin</CardTitle>
        <CardDescription>Version faible FODMAP</CardDescription>
        <CardAction>12 min</CardAction>
      </CardHeader>
      <CardContent>Avec farine de sarrasin et ciboulette.</CardContent>
      <CardFooter>4 portions</CardFooter>
    </Card>
  ),
};

export const DarkModeRecipeCard: Story = {
  globals: {
    theme: "dark",
  },
};
