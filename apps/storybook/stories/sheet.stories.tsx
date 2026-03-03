import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Sets initial open state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls open state in controlled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    modal: {
      description: "Whether the sheet is rendered as a modal layer.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      description: "Callback invoked whenever open state changes.",
    },
    children: {
      description: "SheetTrigger and SheetContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    modal: true,
    onOpenChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-36 items-center justify-center">
      <Sheet {...args}>
        <SheetTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir le panneau de filtres
          </button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtres rapides</SheetTitle>
            <SheetDescription>
              Ajustez les preferences de recherche en un clic.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose asChild>
              <button
                className="rounded-(--radius) border border-border px-3 py-2 text-sm"
                type="button"
              >
                Annuler
              </button>
            </SheetClose>
            <button
              className="rounded-(--radius) border border-primary bg-primary px-3 py-2 text-sm text-primary-foreground"
              type="button"
            >
              Appliquer
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='sheet']");
    const trigger = canvas.getByRole("button", {
      name: "Ouvrir le panneau de filtres",
    });

    await expect(root).toHaveAttribute("data-slot", "sheet");
    await expect(trigger).toHaveAttribute("data-slot", "sheet-trigger");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='sheet-content']");
      if (!node) {
        throw new Error("Sheet content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const portal = document.body.querySelector("[data-slot='sheet-portal']");
    const overlay = document.body.querySelector(
      "[data-slot='sheet-overlay']",
    ) as HTMLElement | null;
    const close = document.body.querySelector(
      "[data-slot='sheet-close'][aria-label='Fermer']",
    ) as HTMLElement | null;

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "sheet-portal");
    await expect(overlay).toHaveAttribute("data-slot", "sheet-overlay");
    await expect(content).toHaveAttribute("data-slot", "sheet-content");

    await expect(overlay?.className ?? "").toContain("bg-muted/80");
    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("w-3/4");
    await expect(content.className).toContain("sm:max-w-sm");
    await expect(content.className).toContain(
      "data-[state=open]:slide-in-from-right",
    );

    await expect(close).toHaveAttribute("data-slot", "sheet-close");
    await expect(close?.className ?? "").toContain("focus-visible:border-ring");
    await expect(close?.className ?? "").toContain(
      "focus-visible:ring-ring-soft",
    );
    await expect(close?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );
  },
};

export const Left: Story = {
  args: {
    onOpenChange: fn(),
  },
  render: (args) => (
    <div className="flex min-h-36 items-center justify-center">
      <Sheet {...args}>
        <SheetTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir a gauche
          </button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Panneau gauche</SheetTitle>
            <SheetDescription>Navigation secondaire.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const Top: Story = {
  args: {
    onOpenChange: fn(),
  },
  render: (args) => (
    <div className="flex min-h-36 items-center justify-center">
      <Sheet {...args}>
        <SheetTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir en haut
          </button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Panneau superieur</SheetTitle>
            <SheetDescription>Informations contextuelles.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  args: {
    ...Default.args,
    onOpenChange: fn(),
  },
  globals: {
    theme: "dark",
  },
};
