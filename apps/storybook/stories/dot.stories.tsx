import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Dot } from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Dot",
  component: Dot,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description:
        "Maps FODMAP level to semantic status color for tiny indicators.",
      control: { type: "radio" },
      options: ["none", "low", "moderate", "high", "unknown"],
      table: { defaultValue: { summary: "unknown" } },
    },
    label: {
      description:
        "Optional accessible label override announced to screen readers.",
      control: "text",
      table: { defaultValue: { summary: "variant default label" } },
    },
    className: {
      description: "Additional classes merged with dot classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    variant: "unknown",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Dot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unknown: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dot = canvas.getByText("FODMAP inconnu").closest("[data-slot='dot']");
    await expect(dot).toHaveAttribute("data-variant", "unknown");
    await expect(dot?.className ?? "").toContain("bg-muted");
  },
};

export const None: Story = {
  args: {
    variant: "none",
  },
};

export const Low: Story = {
  args: {
    variant: "low",
  },
};

export const Moderate: Story = {
  args: {
    variant: "moderate",
  },
};

export const High: Story = {
  args: {
    variant: "high",
  },
};

export const CustomLabel: Story = {
  args: {
    variant: "low",
    label: "Compatible",
  },
};
