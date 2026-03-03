import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Button, ButtonGroup } from "@fodmap/ui";

const meta = {
  title: "Primitives/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      description:
        "Controls whether grouped buttons are laid out horizontally or vertically.",
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    className: {
      description: "Additional classes merged with the button group container.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Grouped button elements rendered inside the container.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    orientation: "horizontal",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button onClick={fn()}>Précédent</Button>
      <Button onClick={fn()}>Suivant</Button>
    </ButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group");
    await expect(group).toHaveAttribute("data-slot", "button-group");
    await expect(group).toHaveAttribute("data-orientation", "horizontal");
    await expect(group.className).toContain(
      "[&>[data-slot=button]]:rounded-none",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Suivant" }));
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button>Monter</Button>
      <Button>Descendre</Button>
    </ButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group");
    await expect(group).toHaveAttribute("data-orientation", "vertical");
    await expect(group.className).toContain("flex-col");
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
