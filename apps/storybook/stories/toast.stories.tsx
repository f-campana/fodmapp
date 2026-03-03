import { useRef } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Sonner, Toast } from "@fodmap/ui";

const meta = {
  title: "Primitives/Toast",
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
      description: "Shows a close button on each toast.",
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
        onClick={() => Toast.show("Date sauvegardee")}
        type="button"
      >
        Afficher un toast
      </button>
      <Sonner {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrapper = canvasElement.querySelector("[data-slot='sonner']");
    const trigger = canvas.getByRole("button", { name: "Afficher un toast" });

    await expect(wrapper).toHaveAttribute("data-slot", "sonner");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");

    await userEvent.click(trigger);

    await waitFor(() => {
      const toastNode = document.body.querySelector("[data-sonner-toast]");
      if (!toastNode) {
        throw new Error("Toast not mounted yet.");
      }
    });

    await expect(
      within(document.body).getByText("Date sauvegardee"),
    ).toBeInTheDocument();
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex min-h-80 flex-wrap items-center justify-center gap-2">
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => Toast.success("Succes")}
        type="button"
      >
        Success
      </button>
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => Toast.info("Information")}
        type="button"
      >
        Info
      </button>
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => Toast.warning("Attention")}
        type="button"
      >
        Warning
      </button>
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => Toast.error("Erreur")}
        type="button"
      >
        Error
      </button>
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => Toast.loading("Chargement")}
        type="button"
      >
        Loading
      </button>
      <Sonner {...args} />
    </div>
  ),
};

export const Promise: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => {
          Toast.promise(
            new globalThis.Promise<string>((resolve) => {
              setTimeout(() => resolve("Import termine"), 500);
            }),
            {
              loading: "Import en cours",
              success: (message) => String(message),
              error: "Echec de l import",
            },
          );
        }}
        type="button"
      >
        Lancer une promesse
      </button>
      <Sonner {...args} />
    </div>
  ),
};

function DismissExample(args: Story["args"]) {
  const toastIdRef = useRef<ReturnType<typeof Toast.show> | null>(null);

  return (
    <div className="flex min-h-80 items-center justify-center gap-2">
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => {
          toastIdRef.current = Toast.show("Toast a fermer", {
            duration: Number.POSITIVE_INFINITY,
          });
        }}
        type="button"
      >
        Afficher
      </button>
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => {
          if (toastIdRef.current) {
            Toast.dismiss(toastIdRef.current);
          }
        }}
        type="button"
      >
        Fermer
      </button>
      <Sonner {...args} />
    </div>
  );
}

export const Dismiss: Story = {
  render: (args) => <DismissExample {...args} />,
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
