import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Item",
  component: Item,
  tags: ["autodocs"],
  argTypes: {
    asChild: {
      description:
        "Delegates rendering to child element while keeping item classes.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      description: "Additional classes merged with the item root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Composed media/content/actions layout nodes.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    asChild: false,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Item>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemMedia>🥕</ItemMedia>
      <ItemContent>
        <ItemHeader>
          <ItemTitle>Carotte râpée</ItemTitle>
          <ItemActions>120 g</ItemActions>
        </ItemHeader>
        <ItemDescription>Portion recommandée</ItemDescription>
      </ItemContent>
    </Item>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Carotte râpée")
      .closest("[data-slot='item']");
    await expect(root).toBeTruthy();
    await expect(root?.className ?? "").toContain("border-border");
    await expect(canvas.getByText("🥕")).toHaveAttribute(
      "data-slot",
      "item-media",
    );
    await expect(canvas.getByText("Carotte râpée")).toHaveAttribute(
      "data-slot",
      "item-title",
    );
    await expect(canvas.getByText("Portion recommandée")).toHaveAttribute(
      "data-slot",
      "item-description",
    );
  },
};

export const Grouped: Story = {
  render: () => (
    <ItemGroup>
      <Item>
        <ItemMedia>🥒</ItemMedia>
        <ItemContent>
          <ItemTitle>Concombre</ItemTitle>
          <ItemDescription>Cru</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia>🍚</ItemMedia>
        <ItemContent>
          <ItemTitle>Riz blanc</ItemTitle>
          <ItemDescription>Cuit</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};

export const AsChildLink: Story = {
  args: {
    asChild: true,
  },
  render: (args) => (
    <Item {...args} asChild>
      <a href="/ingredients/riz">Voir la fiche riz</a>
    </Item>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Voir la fiche riz" });
    await expect(link).toHaveAttribute("data-slot", "item");
    await expect(link).toHaveAttribute("href", "/ingredients/riz");
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
