import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect } from "storybook/test";

import { Skeleton } from "@fodmapp/ui/skeleton";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function SkeletonAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-skeleton-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Skeleton",
  component: Skeleton,
  tags: ["batch-l"],
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    docs: {
      description: {
        component:
          "Skeleton is a decorative placeholder only. Pair it with surrounding loading copy or `aria-busy` on the parent region when the broader surface needs a loading announcement.",
      },
    },
    a11y: {
      test: "error",
      context: {
        include: ["[data-skeleton-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

function LoadingRecipeCard() {
  return (
    <div className="rounded-(--radius) border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full max-w-[20rem]" />
          <Skeleton className="h-4 w-full max-w-[14rem]" />
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SkeletonAuditFrame maxWidth="md">
      <LoadingRecipeCard />
    </SkeletonAuditFrame>
  ),
};

export const ListRows: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SkeletonAuditFrame maxWidth="md">
      <div className="space-y-3 rounded-(--radius) border border-border bg-card p-4">
        <LoadingRecipeCard />
        <LoadingRecipeCard />
      </div>
    </SkeletonAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <SkeletonAuditFrame maxWidth="md">
      <LoadingRecipeCard />
    </SkeletonAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    for (const skeleton of canvasElement.querySelectorAll(
      "[data-slot='skeleton']",
    )) {
      await expect(skeleton).toHaveAttribute("aria-hidden", "true");
    }
  },
};
