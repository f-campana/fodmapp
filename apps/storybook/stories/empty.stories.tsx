import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Empty",
  component: Empty,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description:
        "Additional classes merged with the empty-state root container.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Composed icon, title, description, and actions content.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Empty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyIcon>◌</EmptyIcon>
      <EmptyTitle>Aucun aliment</EmptyTitle>
      <EmptyDescription>Commencez par ajouter un ingrédient.</EmptyDescription>
      <EmptyActions>
        <Button>Ajouter</Button>
      </EmptyActions>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Aucun aliment")
      .closest("[data-slot='empty']");
    await expect(root).toBeTruthy();
    await expect(root?.className ?? "").toContain("border-border");
    await expect(root?.className ?? "").toContain("bg-card");
    await expect(canvas.getByText("◌")).toHaveAttribute(
      "data-slot",
      "empty-icon",
    );
    await expect(canvas.getByText("Aucun aliment")).toHaveAttribute(
      "data-slot",
      "empty-title",
    );
    await expect(
      canvas.getByText("Commencez par ajouter un ingrédient."),
    ).toHaveAttribute("data-slot", "empty-description");
  },
};

export const WithoutActions: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyIcon>⌁</EmptyIcon>
      <EmptyTitle>Filtre trop strict</EmptyTitle>
      <EmptyDescription>Essayez d'élargir la recherche.</EmptyDescription>
    </Empty>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
