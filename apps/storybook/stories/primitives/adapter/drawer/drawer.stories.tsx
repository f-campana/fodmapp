import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@fodmapp/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@fodmapp/ui/drawer";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function DrawerAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-drawer-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function DrawerStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <DrawerAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </DrawerAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  direction: "bottom",
  dismissible: true,
  modal: true,
  shouldScaleBackground: true,
  onOpenChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/Drawer",
  component: Drawer,
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
    direction: {
      description: "Selects the edge the drawer slides from.",
      control: { type: "inline-radio" },
      options: ["bottom", "top", "left", "right"],
      table: { defaultValue: { summary: "bottom" } },
    },
    dismissible: {
      description: "Allows outside interaction to close the drawer.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    modal: {
      description: "Blocks outside interaction while open.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    shouldScaleBackground: {
      description: "Scales the background surface while open.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      description: "Callback fired whenever the open state changes.",
    },
    children: {
      description: "Trigger and content composition.",
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
        include: ["[data-drawer-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

function QuickActionsDrawer(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
  options?: {
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
    <Drawer {...args}>
      {options?.triggerSlot ? (
        <DrawerTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            {...triggerProps}
            type="button"
          >
            Ouvrir le tiroir
          </button>
        </DrawerTrigger>
      ) : (
        <DrawerTrigger asChild>
          <Button variant="outline">Ouvrir le tiroir</Button>
        </DrawerTrigger>
      )}
      <DrawerContent {...contentProps}>
        <DrawerHeader>
          <DrawerTitle>Parametres rapides</DrawerTitle>
          <DrawerDescription>
            Ajustez les filtres les plus utilises en un geste.
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-3 px-4 pb-4 text-sm">
          <div className="rounded-(--radius) border border-border bg-card p-3">
            <div className="font-medium text-foreground">Portion cible</div>
            <div className="mt-1 text-muted-foreground">
              Maintenir la recommandation a 120 g pour ce repas.
            </div>
          </div>
          <div className="rounded-(--radius) border border-border bg-card p-3">
            <div className="font-medium text-foreground">Filtre actif</div>
            <div className="mt-1 text-muted-foreground">
              Masquer les substitutions a faible priorite.
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Annuler</Button>
          </DrawerClose>
          <Button>Appliquer</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export const Playground: Story = {
  render: (args) => (
    <DrawerStoryCanvas centeredMinHeight={80} maxWidth="md">
      {(portalContainer) => QuickActionsDrawer(args, portalContainer)}
    </DrawerStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DrawerStoryCanvas centeredMinHeight={80} maxWidth="md">
      {(portalContainer) =>
        QuickActionsDrawer(defaultPlaygroundArgs, portalContainer)
      }
    </DrawerStoryCanvas>
  ),
};

export const RightSide: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DrawerStoryCanvas centeredMinHeight={80} maxWidth="md">
      {(portalContainer) =>
        QuickActionsDrawer(
          {
            ...defaultPlaygroundArgs,
            direction: "right",
            onOpenChange: fn(),
          },
          portalContainer,
        )
      }
    </DrawerStoryCanvas>
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
    <DrawerStoryCanvas centeredMinHeight={80} maxWidth="md">
      {(portalContainer) =>
        QuickActionsDrawer(args, portalContainer, {
          triggerSlot: "custom-drawer-trigger",
          useLocalPortal: true,
        })
      }
    </DrawerStoryCanvas>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='drawer']");
    const trigger = canvas.getByRole("button", { name: "Ouvrir le tiroir" });

    await expect(root).toHaveAttribute("data-slot", "drawer");
    await expect(trigger).toHaveAttribute("data-slot", "custom-drawer-trigger");
    await expect(
      canvasElement.querySelector("[data-slot='drawer-trigger']"),
    ).toBeNull();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector("[data-slot='drawer-content']");
      if (!node) {
        throw new Error("Drawer content is not mounted yet.");
      }

      if (node.getAttribute("data-state") !== "open") {
        throw new Error("Drawer content is not open yet.");
      }

      return node as HTMLElement;
    });

    await expect(
      canvasElement.querySelector("[data-slot='drawer-portal']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='drawer-overlay']"),
    ).toBeTruthy();
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(content).toHaveAttribute("data-slot", "drawer-content");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      if (!content.contains(document.activeElement)) {
        throw new Error("Drawer focus has not moved inside the content yet.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (content.getAttribute("data-state") !== "closed") {
        throw new Error("Drawer content is still open after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("Drawer trigger has not regained focus yet.");
      }
    });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
