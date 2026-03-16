import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "@fodmapp/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function HoverCardAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-hover-card-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function HoverCardStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <HoverCardAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </HoverCardAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  openDelay: 0,
  closeDelay: 0,
  onOpenChange: fn(),
} as const;

const hoverCardTriggerClassName = [
  "inline-flex min-h-11 items-center justify-center rounded-(--radius)",
  "border border-border bg-card px-3 py-2 text-sm font-medium text-foreground",
  "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
].join(" ");

const meta = {
  title: "Primitives/Adapter/HoverCard",
  component: HoverCard,
  argTypes: {
    defaultOpen: {
      description: "Sets the initial open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls the open state when managed externally.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    openDelay: {
      description: "Delay in ms before opening on hover or focus.",
      control: { type: "number" },
      table: { defaultValue: { summary: "0" } },
    },
    closeDelay: {
      description: "Delay in ms before closing after leaving the trigger.",
      control: { type: "number" },
      table: { defaultValue: { summary: "0" } },
    },
    onOpenChange: {
      description: "Callback fired whenever the hover card visibility changes.",
    },
    children: {
      description: "HoverCardTrigger and HoverCardContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-hover-card-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

function FoodHoverCard(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
  options?: {
    longCopy?: boolean;
    triggerSlot?: string;
    showFollowUp?: boolean;
    useLocalPortal?: boolean;
  },
) {
  const contentProps =
    options?.useLocalPortal && portalContainer
      ? { container: portalContainer }
      : {};
  const triggerProps = options?.triggerSlot
    ? { "data-slot": options.triggerSlot }
    : {};

  return (
    <div className="flex w-full items-center justify-center gap-3">
      <HoverCard {...args}>
        <HoverCardTrigger asChild>
          <button
            className={hoverCardTriggerClassName}
            type="button"
            {...triggerProps}
          >
            View food card
          </button>
        </HoverCardTrigger>
        <HoverCardContent {...contentProps}>
          <div className="grid gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Roasted vegetable bowl
              </div>
              <div className="text-sm text-muted-foreground">
                {options?.longCopy
                  ? "Stage the tolerated garnish, reheating note, and fallback portion guidance in one compact card so the mobile layout stays readable."
                  : "Stage the tolerated garnish and portion note together."}
              </div>
            </div>
            <div className="rounded-(--radius-sm) border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              Keep the first serving measured before adding extras.
            </div>
          </div>
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>
      {options?.showFollowUp ? (
        <button className={hoverCardTriggerClassName} type="button">
          Next action
        </button>
      ) : null}
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <HoverCardStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => FoodHoverCard(args, portalContainer)}
    </HoverCardStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <HoverCardStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        FoodHoverCard(
          {
            ...defaultPlaygroundArgs,
            defaultOpen: true,
            onOpenChange: undefined,
          },
          portalContainer,
          {
            useLocalPortal: true,
          },
        )
      }
    </HoverCardStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <HoverCardStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        FoodHoverCard(
          {
            ...defaultPlaygroundArgs,
            defaultOpen: true,
            onOpenChange: undefined,
          },
          portalContainer,
          {
            useLocalPortal: true,
          },
        )
      }
    </HoverCardStoryCanvas>
  ),
};

export const DarkMode: Story = {
  ...Default,
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
};

export const InteractionChecks: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onOpenChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: (args) => (
    <HoverCardStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        FoodHoverCard(args, portalContainer, {
          triggerSlot: "custom-hover-card-trigger",
          showFollowUp: true,
          useLocalPortal: true,
        })
      }
    </HoverCardStoryCanvas>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='hover-card']");
    const trigger = canvas.getByRole("button", { name: "View food card" });

    await expect(root).toHaveAttribute("data-slot", "hover-card");
    await expect(trigger).toHaveAttribute(
      "data-slot",
      "custom-hover-card-trigger",
    );
    await expect(
      canvasElement.querySelector("[data-slot='hover-card-trigger']"),
    ).toBeNull();

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    const content = await waitFor(() => {
      const node = canvasElement.querySelector(
        "[data-slot='hover-card-content']",
      );
      if (!node) {
        throw new Error("Hover card content is not mounted yet.");
      }

      return node as HTMLElement;
    });
    const portal = canvasElement.querySelector(
      "[data-slot='hover-card-portal']",
    );
    const arrow = canvasElement.querySelector("[data-slot='hover-card-arrow']");

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "hover-card-portal");
    await expect(content).toHaveAttribute("data-slot", "hover-card-content");
    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");
    await expect(arrow).toHaveAttribute("data-slot", "hover-card-arrow");

    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Next action" }),
    ).toHaveFocus();

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='hover-card-content']")) {
        throw new Error("Hover card content is still mounted after blur.");
      }
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: () => (
    <HoverCardStoryCanvas centeredMinHeight={80} maxWidth="sm">
      {(portalContainer) => (
        <div className="flex w-full justify-end">
          {FoodHoverCard(
            {
              ...defaultPlaygroundArgs,
              defaultOpen: true,
              onOpenChange: undefined,
            },
            portalContainer,
            {
              longCopy: true,
              useLocalPortal: true,
            },
          )}
        </div>
      )}
    </HoverCardStoryCanvas>
  ),
};
