import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Progress } from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Progress",
  component: Progress,
  tags: ["autodocs"],
  argTypes: {
    value: {
      description: "Current progress value from 0 to 100.",
      control: { type: "range", min: 0, max: 100, step: 1 },
      table: { defaultValue: { summary: "35" } },
    },
    max: {
      description: "Maximum value used for aria semantics.",
      control: { type: "number", min: 1, max: 100 },
      table: { defaultValue: { summary: "100" } },
    },
    className: {
      description: "Additional classes merged with progress root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    value: 35,
    max: 100,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Progress {...args} aria-label="Progression recette" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progress = canvas.getByRole("progressbar", {
      name: "Progression recette",
    });
    const indicator = progress.querySelector(
      "[data-slot='progress-indicator']",
    );

    await expect(progress).toHaveAttribute("data-slot", "progress");
    await expect(progress.className).toContain("bg-muted");
    await expect(indicator).toHaveAttribute("data-slot", "progress-indicator");
    await expect(indicator?.className ?? "").toContain("bg-primary");
  },
};

export const Complete: Story = {
  args: {
    value: 100,
  },
  render: (args) => <Progress {...args} aria-label="Progression complète" />,
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
