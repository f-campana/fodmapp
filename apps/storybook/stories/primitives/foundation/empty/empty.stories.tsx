import type { Meta, StoryObj } from "@storybook/react-vite";

import { ClipboardList, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "@fodmapp/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function EmptyAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-empty-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

function EmptyState({
  actions,
  description,
  icon,
  title,
}: {
  actions: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Empty>
      <EmptyIcon>{icon}</EmptyIcon>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
      <EmptyActions>{actions}</EmptyActions>
    </Empty>
  );
}

const meta = {
  title: "Primitives/Foundation/Empty",
  component: Empty,
  parameters: {
    controls: { disable: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-empty-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Empty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <EmptyAuditFrame centeredMinHeight={80} maxWidth="md">
      <EmptyState
        actions={
          <>
            <Button>Browse recipes</Button>
            <Button variant="outline">Import a meal plan</Button>
          </>
        }
        description="Start with a breakfast, lunch, or dinner template so the weekly planner can suggest compatible swaps."
        icon={<ClipboardList aria-hidden="true" className="size-5" />}
        title="No saved meal plans yet"
      />
    </EmptyAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("No saved meal plans yet")
      .closest("[data-slot='empty']");

    await expect(root).toBeTruthy();
    await expect(canvas.getByText("No saved meal plans yet")).toHaveAttribute(
      "data-slot",
      "empty-title",
    );
    await expect(
      canvas.getByRole("button", { name: "Browse recipes" }),
    ).toBeInTheDocument();
  },
};

export const FilteredResults: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <EmptyAuditFrame centeredMinHeight={80} maxWidth="md">
      <EmptyState
        actions={
          <>
            <Button>Clear filters</Button>
            <Button variant="outline">Open saved searches</Button>
          </>
        }
        description="No breakfast swaps match dairy-free, low-fructan, and under 10 minutes together. Remove one filter to see reviewed options again."
        icon={<SearchX aria-hidden="true" className="size-5" />}
        title="No swaps match this filter set"
      />
    </EmptyAuditFrame>
  ),
};
