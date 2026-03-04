import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { ScoreBar } from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/ScoreBar",
  component: ScoreBar,
  tags: ["autodocs"],
  argTypes: {
    value: {
      description: "Score value clamped between 0 and 1 to compute fill width.",
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      table: { defaultValue: { summary: "0.3" } },
    },
    label: {
      description: "Optional companion text displayed above the score track.",
      control: "text",
      table: { defaultValue: { summary: "Score FODMAP" } },
    },
    className: {
      description: "Additional classes merged with score bar root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    value: 0.3,
    label: "Score FODMAP",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof ScoreBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Danger: Story = {
  args: {
    value: 0.3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progress = canvas.getByRole("progressbar");
    const fill = progress.querySelector("[data-slot='score-bar-fill']");

    await expect(progress).toHaveAttribute("data-slot", "score-bar");
    await expect(progress).toHaveAttribute("aria-valuenow", "0.3");
    await expect(fill).toHaveAttribute("data-status", "danger");
    await expect(fill?.className ?? "").toContain("bg-danger");
  },
};

export const Warning: Story = {
  args: {
    value: 0.6,
  },
};

export const Success: Story = {
  args: {
    value: 0.86,
  },
};

export const Clamped: Story = {
  args: {
    value: 1.4,
    label: "Score ajusté",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const progress = canvas.getByRole("progressbar");

    await expect(progress).toHaveAttribute("aria-valuenow", "1");
  },
};

export const DarkMode: Story = {
  ...Success,
  globals: {
    theme: "dark",
  },
};
