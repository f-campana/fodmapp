import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { ToggleGroup, ToggleGroupItem } from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  argTypes: {
    type: {
      description: "Selection mode for the group: single or multiple.",
      control: { type: "radio" },
      options: ["single", "multiple"],
      table: { defaultValue: { summary: "single" } },
    },
    orientation: {
      description: "Layout orientation of toggle group items.",
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    defaultValue: {
      description: "Initial selected value(s) in uncontrolled mode.",
      control: "object",
      table: { defaultValue: { summary: '"faible"' } },
    },
    onValueChange: {
      description: "Callback invoked when group selection changes.",
    },
    className: {
      description: "Additional classes merged with toggle group root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "ToggleGroupItem composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    type: "single",
    orientation: "horizontal",
    defaultValue: "faible",
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: (args) => (
    <ToggleGroup {...args} aria-label="Niveau de contrainte">
      <ToggleGroupItem value="faible" aria-label="Faible">
        Faible
      </ToggleGroupItem>
      <ToggleGroupItem value="modere" aria-label="Modéré">
        Modéré
      </ToggleGroupItem>
      <ToggleGroupItem value="eleve" aria-label="Élevé">
        Élevé
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByRole("radio", { name: "Modéré" });
    const root = target.closest("[data-slot='toggle-group']");

    await expect(root).toHaveAttribute("data-slot", "toggle-group");
    await expect(root).toHaveAttribute("data-orientation", "horizontal");
    await expect(target).toHaveAttribute("data-slot", "toggle-group-item");
    await expect(target.className).toContain("data-[state=on]:bg-accent");

    await userEvent.click(target);
    await expect(args.onValueChange).toHaveBeenCalledWith("modere");
  },
};

export const Multiple: Story = {
  args: {
    type: "multiple",
    defaultValue: ["faible"],
    onValueChange: fn(),
  },
  render: (args) => (
    <ToggleGroup {...args} aria-label="Filtres actifs">
      <ToggleGroupItem value="faible" aria-label="Faible">
        Faible
      </ToggleGroupItem>
      <ToggleGroupItem value="modere" aria-label="Modéré">
        Modéré
      </ToggleGroupItem>
      <ToggleGroupItem value="eleve" aria-label="Élevé">
        Élevé
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const DarkMode: Story = {
  ...Single,
  globals: {
    theme: "dark",
  },
};
