import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect } from "storybook/test";

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
      table: { defaultValue: { summary: "h-4 w-48" } },
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

function SkeletonPreview({ children }: { children: ReactNode }) {
  return (
    <div className="w-fit rounded-lg border border-border bg-card p-4">
      {children}
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <SkeletonPreview>
      <Skeleton {...args} />
    </SkeletonPreview>
  ),
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector("[data-slot='skeleton']");
    await expect(skeleton).toBeTruthy();
    await expect(skeleton?.className ?? "").toContain("animate-pulse");
    await expect(skeleton?.className ?? "").toContain("bg-muted");
    await expect(skeleton?.className ?? "").toContain("h-4");
    await expect(skeleton?.className ?? "").toContain("w-48");
  },
};

export const CardLines: Story = {
  render: () => (
    <SkeletonPreview>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[220px]" />
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </SkeletonPreview>
  ),
};

export const DarkMode: Story = {
  ...CardLines,
  globals: {
    theme: "dark",
  },
};
