import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@fodmapp/ui/tooltip";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function TooltipAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-tooltip-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function TooltipStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <TooltipAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </TooltipAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  disableHoverableContent: false,
  onOpenChange: fn(),
} as const;

const tooltipTriggerClassName = [
  "inline-flex min-h-11 items-center justify-center rounded-(--radius)",
  "border border-border bg-card px-3 py-2 text-sm font-medium text-foreground",
  "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
].join(" ");

const meta = {
  title: "Primitives/Adapter/Tooltip",
  component: Tooltip,
  argTypes: {
    defaultOpen: {
      description: "Sets the initial open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls the tooltip open state when managed externally.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    disableHoverableContent: {
      description: "Prevents the pointer from keeping the tooltip open.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      description: "Callback fired whenever the tooltip visibility changes.",
    },
    children: {
      description: "TooltipTrigger and TooltipContent composition.",
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
        include: ["[data-tooltip-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

function ContextTooltip(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
  options?: {
    longCopy?: boolean;
    triggerSlot?: string;
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
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <div className="flex w-full items-center justify-center">
        <Tooltip {...args}>
          <TooltipTrigger asChild>
            <button
              className={tooltipTriggerClassName}
              type="button"
              {...triggerProps}
            >
              Check portion note
            </button>
          </TooltipTrigger>
          <TooltipContent {...contentProps}>
            {options?.longCopy
              ? "Keep the onion-free garnish measured and stage the fallback portion note directly next to the meal card so the mobile layout stays readable."
              : "Keep the garnish portion measured before serving."}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const Playground: Story = {
  render: (args) => (
    <TooltipStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => ContextTooltip(args, portalContainer)}
    </TooltipStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TooltipStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        ContextTooltip(
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
    </TooltipStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TooltipStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        ContextTooltip(
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
    </TooltipStoryCanvas>
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
    <TooltipStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        ContextTooltip(args, portalContainer, {
          triggerSlot: "custom-tooltip-trigger",
          useLocalPortal: true,
        })
      }
    </TooltipStoryCanvas>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='tooltip']");
    const provider = canvasElement.querySelector(
      "[data-slot='tooltip-provider']",
    );
    const trigger = canvas.getByRole("button", { name: "Check portion note" });

    await expect(root).toHaveAttribute("data-slot", "tooltip");
    await expect(provider).toHaveAttribute("data-slot", "tooltip-provider");
    await expect(trigger).toHaveAttribute(
      "data-slot",
      "custom-tooltip-trigger",
    );
    await expect(
      canvasElement.querySelector("[data-slot='tooltip-trigger']"),
    ).toBeNull();

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    const content = await waitFor(() => {
      const node = canvasElement.querySelector("[data-slot='tooltip-content']");
      if (!node) {
        throw new Error("Tooltip content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(trigger).toHaveAttribute("aria-describedby");
    await expect(content).toHaveAttribute("data-slot", "tooltip-content");
    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='tooltip-content']")) {
        throw new Error("Tooltip content is still mounted after Escape.");
      }
    });
    await expect(trigger).toHaveFocus();
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
    <TooltipStoryCanvas centeredMinHeight={80} maxWidth="sm">
      {(portalContainer) => (
        <div className="flex w-full justify-end">
          {ContextTooltip(
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
    </TooltipStoryCanvas>
  ),
};
