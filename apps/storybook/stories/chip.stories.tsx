import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Chip } from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Chip",
  component: Chip,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description:
        "Controls visual style for selectable or removable filter chips.",
      control: { type: "radio" },
      options: ["default", "secondary", "outline"],
      table: { defaultValue: { summary: "default" } },
    },
    selected: {
      description: "Shows selected visual state on the main trigger.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    removable: {
      description: "Adds a dedicated remove button next to the trigger.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables both trigger and remove actions.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    removeLabel: {
      description: "Accessible label used by the remove button.",
      control: "text",
      table: { defaultValue: { summary: "Supprimer le filtre" } },
    },
    children: {
      description: "Label content rendered inside the selectable trigger.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    onSelect: {
      description: "Callback invoked when the main chip trigger is clicked.",
    },
    onRemove: {
      description: "Callback invoked when remove button is clicked.",
    },
    className: {
      description: "Additional classes merged with chip root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    variant: "default",
    selected: false,
    removable: false,
    disabled: false,
    removeLabel: "Supprimer le filtre",
    children: "Sans gluten",
    onSelect: fn(),
    onRemove: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Sans gluten" });

    await userEvent.click(trigger);
    await expect(args.onSelect).toHaveBeenCalled();

    const root = trigger.closest("[data-slot='chip']");
    await expect(root).toHaveAttribute("data-slot", "chip");
    await expect(root).toHaveAttribute("data-selected", "false");

    await expect(trigger.className).toContain("focus-visible:border-ring");
    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const Selected: Story = {
  args: {
    selected: true,
    children: "Toléré",
  },
};

export const Removable: Story = {
  args: {
    removable: true,
    children: "Faible lactose",
    onSelect: fn(),
    onRemove: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Faible lactose" });
    const remove = canvas.getByRole("button", { name: "Supprimer le filtre" });

    await userEvent.click(remove);
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    await expect(args.onSelect).not.toHaveBeenCalled();

    await userEvent.click(trigger);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Riche en fibres",
  },
};

export const Disabled: Story = {
  args: {
    removable: true,
    disabled: true,
    children: "Indisponible",
    onSelect: fn(),
    onRemove: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Indisponible" });
    const remove = canvas.getByRole("button", { name: "Supprimer le filtre" });

    await expect(trigger).toBeDisabled();
    await expect(remove).toBeDisabled();

    trigger.click();
    remove.click();

    await expect(args.onSelect).not.toHaveBeenCalled();
    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};

export const DarkMode: Story = {
  ...Removable,
  globals: {
    theme: "dark",
  },
};
