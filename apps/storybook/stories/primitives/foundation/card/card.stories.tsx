import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function CardAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-card-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

function RecipeReviewCard({
  action,
  footer,
  title,
}: {
  action: string;
  footer: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Breakfast swap reviewed for the low-FODMAP starter plan.
        </CardDescription>
        <CardAction>{action}</CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Coconut yogurt replaced the dairy version while preserving the same
            topping sequence and prep flow.
          </p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
            <li>Portion: 125 g</li>
            <li>Confidence: reviewed against current scoring snapshot</li>
            <li>Next check: after the next ingredient refresh batch</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3 text-sm text-muted-foreground">
        <span>{footer}</span>
        <span>Owner: Foundation QA</span>
      </CardFooter>
    </Card>
  );
}

const meta = {
  title: "Primitives/Foundation/Card",
  component: Card,
  parameters: {
    controls: { disable: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-card-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CardAuditFrame maxWidth="md">
      <RecipeReviewCard
        action="Ready"
        footer="Updated 2 hours ago"
        title="Blueberry yogurt bowl"
      />
    </CardAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Blueberry yogurt bowl")
      .closest("[data-slot='card']");

    await expect(root).toBeTruthy();
    await expect(canvas.getByText("Blueberry yogurt bowl")).toHaveAttribute(
      "data-slot",
      "card-title",
    );
    await expect(canvas.getByText("Ready")).toHaveAttribute(
      "data-slot",
      "card-action",
    );
  },
};

export const ReviewSummary: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CardAuditFrame maxWidth="md">
      <RecipeReviewCard
        action="4 items"
        footer="Shared with the review CSV"
        title="Phase 3 activation checklist"
      />
    </CardAuditFrame>
  ),
};
