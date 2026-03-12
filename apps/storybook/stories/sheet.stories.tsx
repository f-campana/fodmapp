import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function SheetAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-sheet-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function SheetStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <SheetAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </SheetAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  modal: true,
  onOpenChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/Sheet",
  component: Sheet,
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
      description: "Keeps interaction inside the sheet when true.",
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
        include: ["[data-sheet-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function FilterSheet(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
  options?: {
    closeSlot?: string;
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
  const closeProps = options?.closeSlot
    ? { "data-slot": options.closeSlot }
    : {};

  return (
    <Sheet {...args}>
      {options?.triggerSlot ? (
        <SheetTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            {...triggerProps}
            type="button"
          >
            Ouvrir le panneau de filtres
          </button>
        </SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button variant="outline">Ouvrir le panneau de filtres</Button>
        </SheetTrigger>
      )}
      <SheetContent {...contentProps}>
        <SheetHeader>
          <SheetTitle>Filtres rapides</SheetTitle>
          <SheetDescription>
            Ajustez les preferences de recherche en un clic.
          </SheetDescription>
        </SheetHeader>
        <div className="rounded-(--radius) border border-border bg-card p-4 text-sm text-muted-foreground">
          Affinez les resultats par profil de repas, niveau de tolerance et
          substitutions deja validees.
        </div>
        <SheetFooter className="border-t border-border pt-4">
          {options?.closeSlot ? (
            <SheetClose asChild>
              <button
                className="rounded-(--radius) border border-border px-3 py-2 text-sm"
                {...closeProps}
                type="button"
              >
                Annuler
              </button>
            </SheetClose>
          ) : (
            <SheetClose asChild>
              <Button variant="outline">Annuler</Button>
            </SheetClose>
          )}
          <Button>Appliquer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const Playground: Story = {
  render: (args) => (
    <SheetStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => FilterSheet(args, portalContainer)}
    </SheetStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SheetStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => FilterSheet(defaultPlaygroundArgs, portalContainer)}
    </SheetStoryCanvas>
  ),
};

export const LeftSide: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SheetStoryCanvas centeredMinHeight={72} maxWidth="md">
      {() => {
        return (
          <Sheet {...defaultPlaygroundArgs} onOpenChange={fn()}>
            <SheetTrigger asChild>
              <Button variant="outline">Ouvrir a gauche</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Panneau gauche</SheetTitle>
                <SheetDescription>Navigation secondaire.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        );
      }}
    </SheetStoryCanvas>
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
    <SheetStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        FilterSheet(args, portalContainer, {
          closeSlot: "custom-sheet-close",
          triggerSlot: "custom-sheet-trigger",
          useLocalPortal: true,
        })
      }
    </SheetStoryCanvas>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='sheet']");
    const trigger = canvas.getByRole("button", {
      name: "Ouvrir le panneau de filtres",
    });

    await expect(root).toHaveAttribute("data-slot", "sheet");
    await expect(trigger).toHaveAttribute("data-slot", "custom-sheet-trigger");
    await expect(
      canvasElement.querySelector("[data-slot='sheet-trigger']"),
    ).toBeNull();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector("[data-slot='sheet-content']");
      if (!node) {
        throw new Error("Sheet content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(
      canvasElement.querySelector("[data-slot='sheet-portal']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='sheet-overlay']"),
    ).toBeTruthy();
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(content).toHaveAttribute("data-slot", "sheet-content");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toHaveAttribute("data-side", "right");

    const closeButton = within(content).getByRole("button", {
      name: "Annuler",
    });
    await expect(closeButton).toHaveAttribute(
      "data-slot",
      "custom-sheet-close",
    );
    await expect(
      content.querySelectorAll("[data-slot='sheet-close']"),
    ).toHaveLength(1);

    await waitFor(() => {
      if (!content.contains(document.activeElement)) {
        throw new Error("Sheet focus has not moved inside the content yet.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='sheet-content']")) {
        throw new Error("Sheet content is still mounted after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("Sheet trigger has not regained focus yet.");
      }
    });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
