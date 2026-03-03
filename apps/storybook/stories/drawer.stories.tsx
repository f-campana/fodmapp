import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Initial open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controlled open state.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    direction: {
      description: "Drawer opening direction.",
      control: { type: "inline-radio" },
      options: ["bottom", "top", "left", "right"],
      table: { defaultValue: { summary: "bottom" } },
    },
    dismissible: {
      description: "Whether outside interaction can dismiss the drawer.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    modal: {
      description: "Whether the drawer traps interactions.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    shouldScaleBackground: {
      description: "Whether the background should scale when open.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      description: "Callback invoked when open state changes.",
    },
    children: {
      description: "Trigger and content composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    direction: "bottom",
    dismissible: true,
    modal: true,
    shouldScaleBackground: true,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <Drawer {...args}>
        <DrawerTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir le tiroir
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Parametres rapides</DrawerTitle>
            <DrawerDescription>
              Ajustez les filtres les plus utilises en un geste.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Fermer</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: "Ouvrir le tiroir" }),
    );

    await waitFor(() => {
      const content = document.body.querySelector(
        "[data-slot='drawer-content']",
      );
      if (!content) {
        throw new Error("Drawer content is not mounted yet.");
      }
    });

    const root = canvasElement.querySelector("[data-slot='drawer']");
    const portal = document.body.querySelector("[data-slot='drawer-portal']");
    const overlay = document.body.querySelector("[data-slot='drawer-overlay']");
    const content = document.body.querySelector(
      "[data-slot='drawer-content']",
    ) as HTMLElement | null;

    await expect(root).toHaveAttribute("data-slot", "drawer");
    await expect(portal).toHaveAttribute("data-slot", "drawer-portal");
    await expect(overlay).toHaveAttribute("data-slot", "drawer-overlay");
    await expect(content).toHaveAttribute("data-slot", "drawer-content");
    await expect(content?.className ?? "").toContain("bg-popover");
    await expect(content?.className ?? "").toContain("text-popover-foreground");
    await expect(content?.className ?? "").toContain(
      "data-[vaul-drawer-direction=bottom]:inset-x-0",
    );

    const closeButton = document.body.querySelector(
      "[data-slot='drawer-close']",
    );
    await expect(
      (closeButton as HTMLElement | null)?.className ?? "",
    ).not.toContain("focus-visible:ring-ring/50");
  },
};

function ControlledDrawer(args: Story["args"]) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-80 items-center justify-center">
      <Drawer {...args} onOpenChange={setOpen} open={open}>
        <DrawerTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir en mode controle
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mode controle</DrawerTitle>
            <DrawerDescription>
              Etat ouvert: {open ? "oui" : "non"}
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledDrawer {...args} />,
};

export const WithFooterActions: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <Drawer {...args}>
        <DrawerTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir les actions
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Actions disponibles</DrawerTitle>
            <DrawerDescription>
              Validez ou annulez les changements.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <button
              className="rounded-(--radius) bg-primary px-3 py-2 text-sm text-primary-foreground"
              type="button"
            >
              Enregistrer
            </button>
            <DrawerClose>Annuler</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
