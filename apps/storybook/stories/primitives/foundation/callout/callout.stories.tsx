import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookOpenText, Info, TriangleAlert } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Callout,
  CalloutDescription,
  CalloutIcon,
  CalloutTitle,
} from "@fodmap/ui/callout";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function CalloutAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-callout-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

type CalloutStoryArgs = {
  variant: "info" | "caution" | "warning" | "danger" | "tip";
};

const defaultPlaygroundArgs = {
  variant: "info",
} satisfies CalloutStoryArgs;

function GuidanceCallout({ variant }: CalloutStoryArgs) {
  const Icon =
    variant === "caution"
      ? TriangleAlert
      : variant === "tip"
        ? Info
        : BookOpenText;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Recipe notes</p>
        <p className="text-sm text-muted-foreground">
          Keep the supporting guidance close to the content it explains.
        </p>
      </div>
      <Callout variant={variant}>
        <CalloutIcon>
          <Icon aria-hidden="true" className="size-5" />
        </CalloutIcon>
        <CalloutTitle>
          {variant === "caution"
            ? "Portion caution for breakfast review"
            : "Why this swap stays gentle for breakfast service"}
        </CalloutTitle>
        <CalloutDescription>
          {variant === "caution"
            ? "This serving size only stays conservative when the batch keeps the yogurt at 125 g or less per meal."
            : "Rice-based yogurt keeps the texture of the breakfast bowl while avoiding the lactose load that triggered the original review note."}
        </CalloutDescription>
      </Callout>
    </div>
  );
}

const meta = {
  title: "Primitives/Foundation/Callout",
  component: Callout as ComponentType<CalloutStoryArgs>,
  argTypes: {
    variant: {
      description: "Emphasis style for editorial or explanatory guidance.",
      control: { type: "inline-radio" },
      options: ["info", "caution", "warning", "danger", "tip"],
      table: { defaultValue: { summary: "info" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: {
      expanded: true,
      include: ["variant"],
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-callout-audit-root]"],
      },
    },
  },
} satisfies Meta<CalloutStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <CalloutAuditFrame maxWidth="xl" surface>
      <GuidanceCallout {...args} />
    </CalloutAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CalloutAuditFrame maxWidth="xl" surface>
      <GuidanceCallout {...defaultPlaygroundArgs} />
    </CalloutAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Why this swap stays gentle for breakfast service")
      .closest("[data-slot='callout']");

    await expect(root).toHaveAttribute("data-variant", "info");
    await expect(canvas.queryByRole("alert")).toBeNull();
    await expect(
      canvas.getByText("Why this swap stays gentle for breakfast service"),
    ).toHaveAttribute("data-slot", "callout-title");
    if ((root?.scrollWidth ?? 0) > (root?.clientWidth ?? 0)) {
      throw new Error("Callout content overflowed instead of wrapping.");
    }
  },
};

export const Caution: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CalloutAuditFrame maxWidth="xl" surface>
      <GuidanceCallout variant="caution" />
    </CalloutAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Portion caution for breakfast review")
      .closest("[data-slot='callout']");

    await expect(root).toHaveAttribute("data-variant", "caution");
    await expect(root?.className ?? "").toContain("border-warning");
    await expect(
      canvas.getByText("Portion caution for breakfast review"),
    ).toHaveAttribute("data-slot", "callout-title");
    await expect(
      canvas.getByText(
        "This serving size only stays conservative when the batch keeps the yogurt at 125 g or less per meal.",
      ),
    ).toHaveAttribute("data-slot", "callout-description");
    if ((root?.scrollWidth ?? 0) > (root?.clientWidth ?? 0)) {
      throw new Error(
        "Caution callout content overflowed instead of wrapping.",
      );
    }
  },
};
