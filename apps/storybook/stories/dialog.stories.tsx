import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Sets initial open state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls open state when used in controlled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    modal: {
      description: "Whether the dialog is rendered as a modal layer.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      description: "Callback invoked whenever open state changes.",
    },
    children: {
      description: "DialogTrigger and DialogContent composition.",
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
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-32 items-center justify-center">
      <Dialog {...args}>
        <DialogTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir la confirmation
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la substitution</DialogTitle>
            <DialogDescription>
              Voulez-vous appliquer cette substitution a votre plan ?
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            Cette action mettra a jour vos recommandations et la liste de
            courses associee.
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <button
                className="rounded-(--radius) border border-border px-3 py-2 text-sm"
                type="button"
              >
                Annuler
              </button>
            </DialogClose>
            <button
              className="rounded-(--radius) border border-primary bg-primary px-3 py-2 text-sm text-primary-foreground"
              type="button"
            >
              Valider
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='dialog']");
    const trigger = canvas.getByRole("button", {
      name: "Ouvrir la confirmation",
    });

    await expect(root).toHaveAttribute("data-slot", "dialog");
    await expect(trigger).toHaveAttribute("data-slot", "dialog-trigger");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='dialog-content']");
      if (!node) {
        throw new Error("Dialog content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const overlay = document.body.querySelector(
      "[data-slot='dialog-overlay']",
    ) as HTMLElement | null;
    const portal = document.body.querySelector("[data-slot='dialog-portal']");
    const title = document.body.querySelector("[data-slot='dialog-title']");
    const description = document.body.querySelector(
      "[data-slot='dialog-description']",
    );
    const header = document.body.querySelector("[data-slot='dialog-header']");
    const body = document.body.querySelector("[data-slot='dialog-body']");
    const footer = document.body.querySelector("[data-slot='dialog-footer']");
    const closeButton = document.body.querySelector(
      "[data-slot='dialog-close'][aria-label='Fermer']",
    ) as HTMLElement | null;

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "dialog-portal");
    await expect(overlay).toHaveAttribute("data-slot", "dialog-overlay");
    await expect(content).toHaveAttribute("data-slot", "dialog-content");
    await expect(title).toHaveAttribute("data-slot", "dialog-title");
    await expect(description).toHaveAttribute(
      "data-slot",
      "dialog-description",
    );
    await expect(header).toHaveAttribute("data-slot", "dialog-header");
    await expect(body).toHaveAttribute("data-slot", "dialog-body");
    await expect(footer).toHaveAttribute("data-slot", "dialog-footer");

    await expect(overlay?.className ?? "").toContain("bg-muted/80");
    await expect(overlay?.className ?? "").toContain(
      "data-[state=open]:animate-in",
    );
    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:fade-in-0");
    await expect(content.className).toContain("data-[state=open]:zoom-in-95");

    await expect(closeButton).toHaveAttribute("data-slot", "dialog-close");
    await expect(closeButton?.className ?? "").toContain(
      "focus-visible:border-ring",
    );
    await expect(closeButton?.className ?? "").toContain(
      "focus-visible:ring-ring-soft",
    );
    await expect(closeButton?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );
  },
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
