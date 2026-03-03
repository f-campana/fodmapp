import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Skeleton } from "@fodmap/ui";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description:
        "Additional utility classes to define skeleton shape and dimensions.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    className: "h-4 w-48",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skeleton = canvasElement.querySelector("[data-slot='skeleton']");
    await expect(skeleton).toBeTruthy();
    await expect(skeleton?.className ?? "").toContain("animate-pulse");
    await expect(skeleton?.className ?? "").toContain("bg-muted");
    await expect(skeleton?.className ?? "").not.toContain(
      "hover:bg-primary/90",
    );
    await expect(canvas).toBeTruthy();
  },
};

export const CardLines: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[220px]" />
      <Skeleton className="h-4 w-[180px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  ),
};

export const DarkMode: Story = {
  ...CardLines,
  globals: {
    theme: "dark",
  },
};
