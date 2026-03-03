import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Kbd, KbdGroup } from "@fodmap/ui";

const meta = {
  title: "Primitives/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  argTypes: {
    children: {
      description: "Keyboard key label rendered inside the element.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      description: "Additional classes merged with kbd root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    children: "Cmd",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleKey: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const key = canvas.getByText("Cmd");
    await expect(key.tagName).toBe("KBD");
    await expect(key).toHaveAttribute("data-slot", "kbd");
    await expect(key.className).toContain("border-border");
    await expect(key.className).toContain("bg-muted");
  },
};

export const Shortcut: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>Cmd</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByText("Cmd").closest("[data-slot='kbd-group']");
    await expect(group).toBeTruthy();
    await expect(canvas.getByText("K")).toHaveAttribute("data-slot", "kbd");
  },
};
