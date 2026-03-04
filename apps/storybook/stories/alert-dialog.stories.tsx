import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/AlertDialog",
  component: AlertDialog,
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
    onOpenChange: {
      description: "Callback invoked when open state changes.",
    },
    children: {
      description: "AlertDialogTrigger and AlertDialogContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    onOpenChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-36 items-center justify-center">
      <AlertDialog {...args}>
        <AlertDialogTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Supprimer cette substitution
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la substitution enregistree.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='alert-dialog']");
    const trigger = canvas.getByRole("button", {
      name: "Supprimer cette substitution",
    });

    await expect(root).toHaveAttribute("data-slot", "alert-dialog");
    await expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='alert-dialog-content']",
      );
      if (!node) {
        throw new Error("Alert dialog content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const overlay = document.body.querySelector(
      "[data-slot='alert-dialog-overlay']",
    ) as HTMLElement | null;
    const portal = document.body.querySelector(
      "[data-slot='alert-dialog-portal']",
    );
    const title = document.body.querySelector(
      "[data-slot='alert-dialog-title']",
    );
    const description = document.body.querySelector(
      "[data-slot='alert-dialog-description']",
    );
    const action = document.body.querySelector(
      "[data-slot='alert-dialog-action']",
    ) as HTMLElement | null;
    const cancel = document.body.querySelector(
      "[data-slot='alert-dialog-cancel']",
    ) as HTMLElement | null;

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "alert-dialog-portal");
    await expect(overlay).toHaveAttribute("data-slot", "alert-dialog-overlay");
    await expect(content).toHaveAttribute("data-slot", "alert-dialog-content");
    await expect(title).toHaveAttribute("data-slot", "alert-dialog-title");
    await expect(description).toHaveAttribute(
      "data-slot",
      "alert-dialog-description",
    );

    await expect(overlay?.className ?? "").toContain("bg-muted/80");
    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:zoom-in-95");

    await expect(action?.className ?? "").toContain(
      "focus-visible:border-ring",
    );
    await expect(action?.className ?? "").toContain(
      "focus-visible:ring-ring-soft",
    );
    await expect(action?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );

    await expect(cancel?.className ?? "").toContain(
      "focus-visible:border-ring",
    );
    await expect(cancel?.className ?? "").toContain(
      "focus-visible:ring-ring-soft",
    );
    await expect(cancel?.className ?? "").not.toContain(
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
