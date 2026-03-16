import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Badge } from "@fodmapp/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function BadgeAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-badge-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  variant: "default",
  children: "Faible FODMAP",
} as const;

const meta = {
  title: "Primitives/Foundation/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Chooses the visual tone for a read-only status label.",
      control: { type: "radio" },
      options: ["default", "secondary", "destructive", "outline"],
      table: { defaultValue: { summary: "default" } },
    },
    children: {
      description: "Short status copy rendered inside the badge.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      description: "Additional classes merged with the badge root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    docs: {
      description: {
        component:
          "Badge is a compact read-only status label. Use Chip when the user can toggle or remove something.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-badge-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

function IngredientStatusCard({ args }: { args?: Story["args"] }) {
  return (
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Ingredient status
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Cooked carrot
          </h3>
        </div>
        <Badge {...args} />
      </div>
      <p className="text-sm leading-5 text-muted-foreground">
        Keep the badge short and factual so it reads as supporting status, not
        as a filter control.
      </p>
    </div>
  );
}

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Adjust the label copy and tone while keeping the same read-only ingredient-summary context.",
      },
    },
  },
  render: (args) => (
    <BadgeAuditFrame maxWidth="sm">
      <IngredientStatusCard args={args} />
    </BadgeAuditFrame>
  ),
};

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Default informational badge used as supporting status inside a compact ingredient card.",
      },
    },
  },
  render: () => (
    <BadgeAuditFrame maxWidth="sm">
      <IngredientStatusCard args={defaultPlaygroundArgs} />
    </BadgeAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Faible FODMAP");

    await expect(badge.tagName).toBe("SPAN");
    await expect(badge).toHaveAttribute("data-slot", "badge");
    await expect(badge).toHaveAttribute("data-variant", "default");
  },
};

export const ReviewRequired: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Destructive tone remains read-only and should be reserved for factual review states, not button-like alerts.",
      },
    },
  },
  render: () => (
    <BadgeAuditFrame maxWidth="sm">
      <IngredientStatusCard
        args={{ variant: "destructive", children: "Relecture requise" }}
      />
    </BadgeAuditFrame>
  ),
};
