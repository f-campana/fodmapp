import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Badge } from "@fodmapp/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmapp/ui/card";

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
  actionTone,
  footer,
  title,
}: {
  action: string;
  actionTone: "outline" | "secondary";
  footer: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="gap-x-4 gap-y-3">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Breakfast swap reviewed for the low-FODMAP starter plan.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant={actionTone}>{action}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Coconut yogurt replaced the dairy version while preserving the same
            topping sequence and prep flow.
          </p>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 rounded-lg bg-muted/40 px-3 py-2">
              <dt className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                Portion
              </dt>
              <dd className="text-sm font-medium text-foreground">125 g</dd>
            </div>
            <div className="space-y-1 rounded-lg bg-muted/40 px-3 py-2">
              <dt className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                Confidence
              </dt>
              <dd className="text-sm font-medium text-foreground">
                Current snapshot
              </dd>
            </div>
            <div className="space-y-1 rounded-lg bg-muted/40 px-3 py-2">
              <dt className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                Next check
              </dt>
              <dd className="text-sm font-medium text-foreground">
                Next ingredient batch
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-x-4 gap-y-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase">
            Updated
          </p>
          <p>{footer}</p>
        </div>
        <div className="space-y-1 text-left sm:text-right">
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase">
            Owner
          </p>
          <p>Foundation QA</p>
        </div>
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
        actionTone="outline"
        footer="Updated 2 hours ago"
        title="Blueberry yogurt bowl review summary"
      />
    </CardAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Blueberry yogurt bowl review summary")
      .closest("[data-slot='card']");

    await expect(root).toBeTruthy();
    await expect(
      canvas.getByText("Blueberry yogurt bowl review summary"),
    ).toHaveAttribute("data-slot", "card-title");
    await expect(
      canvas.getByText("Ready").closest("[data-slot='card-action']"),
    ).toHaveAttribute("data-slot", "card-action");
    if ((root?.scrollWidth ?? 0) > (root?.clientWidth ?? 0)) {
      throw new Error("Card content overflowed instead of wrapping.");
    }
  },
};

export const ReviewSummary: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CardAuditFrame maxWidth="md">
      <RecipeReviewCard
        action="4 items"
        actionTone="secondary"
        footer="Shared with the review CSV"
        title="Phase 3 activation checklist and approval notes"
      />
    </CardAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Phase 3 activation checklist and approval notes")
      .closest("[data-slot='card']");

    await expect(root).toBeTruthy();
    await expect(
      canvas.getByText("Phase 3 activation checklist and approval notes"),
    ).toHaveAttribute("data-slot", "card-title");
    await expect(
      canvas.getByText("4 items").closest("[data-slot='card-action']"),
    ).toHaveAttribute("data-slot", "card-action");
    if ((root?.scrollWidth ?? 0) > (root?.clientWidth ?? 0)) {
      throw new Error("Review summary card overflowed instead of wrapping.");
    }
  },
};
