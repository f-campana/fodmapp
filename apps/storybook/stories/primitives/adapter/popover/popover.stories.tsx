import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@fodmapp/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@fodmapp/ui/popover";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function PopoverAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-popover-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function PopoverStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <PopoverAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </PopoverAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  modal: false,
  onOpenChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/Popover",
  component: Popover,
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
    modal: {
      description: "Treats outside interaction as modal when true.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      description: "Callback fired whenever the open state changes.",
    },
    children: {
      description: "Anchor, trigger, and content composition.",
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
        include: ["[data-popover-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

function DetailPopover(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
  options?: {
    anchored?: boolean;
    showArrow?: boolean;
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
    <Popover {...args}>
      {options?.anchored ? (
        <div className="flex flex-col items-start gap-2">
          <PopoverAnchor className="text-sm text-muted-foreground">
            Zone de contexte
          </PopoverAnchor>
          {options?.triggerSlot ? (
            <PopoverTrigger asChild>
              <button
                className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
                {...triggerProps}
                type="button"
              >
                Ouvrir les details
              </button>
            </PopoverTrigger>
          ) : (
            <PopoverTrigger asChild>
              <Button variant="outline">Ouvrir les details</Button>
            </PopoverTrigger>
          )}
        </div>
      ) : options?.triggerSlot ? (
        <PopoverTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            {...triggerProps}
            type="button"
          >
            Ouvrir les details
          </button>
        </PopoverTrigger>
      ) : (
        <PopoverTrigger asChild>
          <Button variant="outline">Ouvrir les details</Button>
        </PopoverTrigger>
      )}
      <PopoverContent {...contentProps}>
        <div className="grid gap-2">
          <div className="font-medium text-foreground">Portion recommandee</div>
          <div className="text-sm text-muted-foreground">
            120 g maximum pour garder une charge digestive stable.
          </div>
          <div className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm">
            Astuce : associez-la a une garniture simple pour limiter les ecarts.
          </div>
        </div>
        {options?.showArrow ? <PopoverArrow /> : null}
      </PopoverContent>
    </Popover>
  );
}

export const Playground: Story = {
  render: (args) => (
    <PopoverStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        DetailPopover(args, portalContainer, {
          anchored: false,
          showArrow: false,
        })
      }
    </PopoverStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <PopoverStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        DetailPopover(defaultPlaygroundArgs, portalContainer, {
          anchored: false,
          showArrow: false,
        })
      }
    </PopoverStoryCanvas>
  ),
};

export const Anchored: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <PopoverStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        DetailPopover(defaultPlaygroundArgs, portalContainer, {
          anchored: true,
          showArrow: true,
        })
      }
    </PopoverStoryCanvas>
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
    <PopoverStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        DetailPopover(args, portalContainer, {
          anchored: true,
          showArrow: true,
          triggerSlot: "custom-popover-trigger",
          useLocalPortal: true,
        })
      }
    </PopoverStoryCanvas>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='popover']");
    const trigger = canvas.getByRole("button", { name: "Ouvrir les details" });
    const anchor = canvas.getByText("Zone de contexte");

    await expect(root).toHaveAttribute("data-slot", "popover");
    await expect(trigger).toHaveAttribute(
      "data-slot",
      "custom-popover-trigger",
    );
    await expect(
      canvasElement.querySelector("[data-slot='popover-trigger']"),
    ).toBeNull();
    await expect(anchor).toHaveAttribute("data-slot", "popover-anchor");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector("[data-slot='popover-content']");
      if (!node) {
        throw new Error("Popover content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(
      canvasElement.querySelector("[data-slot='popover-portal']"),
    ).toBeTruthy();
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(content).toHaveAttribute("data-slot", "popover-content");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      if (!content.contains(document.activeElement)) {
        throw new Error("Popover focus has not moved inside the content yet.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='popover-content']")) {
        throw new Error("Popover content is still mounted after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("Popover trigger has not regained focus yet.");
      }
    });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
