import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Sonner, toast } from "@fodmap/ui";

const meta = {
  title: "Primitives/Sonner",
  component: Sonner,
  tags: ["autodocs"],
  argTypes: {
    position: {
      description: "Toaster viewport position.",
      control: { type: "select" },
      options: [
        "top-left",
        "top-right",
        "top-center",
        "bottom-left",
        "bottom-right",
        "bottom-center",
      ],
      table: { defaultValue: { summary: "bottom-right" } },
    },
    richColors: {
      description: "Enables richer semantic toast colors.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    closeButton: {
      description: "Shows a close button for each toast.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    expand: {
      description: "Keeps all visible toasts expanded.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    visibleToasts: {
      description: "Maximum number of visible toasts.",
      control: { type: "number" },
      table: { defaultValue: { summary: "3" } },
    },
    duration: {
      description: "Default toast duration in milliseconds.",
      control: { type: "number" },
      table: { defaultValue: { summary: "4000" } },
    },
    toastOptions: {
      description: "Default options applied to each toast.",
      control: { type: "object" },
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    position: "bottom-right",
    richColors: true,
    closeButton: true,
    expand: false,
    visibleToasts: 3,
    duration: 4000,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Sonner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => toast("Action enregistree")}
        type="button"
      >
        Afficher une notification
      </button>
      <Sonner {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const marker = canvasElement.querySelector("[data-slot='sonner']");

    await expect(marker).toHaveAttribute("data-slot", "sonner");

    const trigger = canvas.getByRole("button", {
      name: "Afficher une notification",
    });

    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
    await userEvent.click(trigger);

    await waitFor(() => {
      const toastNode = document.body.querySelector("[data-sonner-toast]");
      if (!toastNode) {
        throw new Error("Toast not mounted yet.");
      }
    });

    await expect(marker?.className ?? "").toContain(
      "[&_[data-sonner-toast]]:bg-popover",
    );
    await expect(marker?.className ?? "").toContain(
      "[&_[data-sonner-toast]]:text-popover-foreground",
    );
    await expect(marker?.className ?? "").toContain(
      "[&_[data-sonner-toast]]:border-border",
    );
  },
};

export const Action: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() =>
          toast("Supprimer l element ?", {
            action: {
              label: "Confirmer",
              onClick: () => undefined,
            },
            cancel: {
              label: "Annuler",
              onClick: () => undefined,
            },
          })
        }
        type="button"
      >
        Afficher une action
      </button>
      <Sonner {...args} />
    </div>
  ),
};

export const PromiseToast: Story = {
  name: "Promise",
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() =>
          toast.promise(
            new globalThis.Promise<string>(
              (resolve: (value: string) => void) => {
                setTimeout(() => resolve("Export termine"), 500);
              },
            ),
            {
              loading: "Export en cours",
              success: (message: string) => message,
              error: "Echec de l export",
            },
          )
        }
        type="button"
      >
        Afficher une promesse
      </button>
      <Sonner {...args} />
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
