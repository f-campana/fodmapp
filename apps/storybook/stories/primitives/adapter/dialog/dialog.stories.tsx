import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@fodmapp/ui/button";
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
} from "@fodmapp/ui/dialog";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function DialogAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-dialog-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function DialogStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <DialogAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </DialogAuditFrame>
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
  title: "Primitives/Adapter/Dialog",
  component: Dialog,
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
      description: "Keeps interaction inside the dialog when true.",
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
        include: ["[data-dialog-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function ConfirmationDialog(
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
    <Dialog {...args}>
      {options?.triggerSlot ? (
        <DialogTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            {...triggerProps}
            type="button"
          >
            Ouvrir la confirmation
          </button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline">Ouvrir la confirmation</Button>
        </DialogTrigger>
      )}
      <DialogContent {...contentProps}>
        <DialogHeader>
          <DialogTitle>Confirmer la substitution</DialogTitle>
          <DialogDescription>
            Voulez-vous appliquer cette substitution a votre plan ?
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          Cette action mettra a jour vos recommandations et la liste de courses
          associee.
        </DialogBody>
        <DialogFooter>
          {options?.closeSlot ? (
            <DialogClose asChild>
              <button
                className="rounded-(--radius) border border-border px-3 py-2 text-sm"
                {...closeProps}
                type="button"
              >
                Annuler
              </button>
            </DialogClose>
          ) : (
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
          )}
          <Button>Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Playground: Story = {
  render: (args) => (
    <DialogStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => ConfirmationDialog(args, portalContainer)}
    </DialogStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DialogStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        ConfirmationDialog(defaultPlaygroundArgs, portalContainer)
      }
    </DialogStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DialogStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        ConfirmationDialog(defaultPlaygroundArgs, portalContainer)
      }
    </DialogStoryCanvas>
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
    <DialogStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        ConfirmationDialog(args, portalContainer, {
          closeSlot: "custom-dialog-close",
          triggerSlot: "custom-dialog-trigger",
          useLocalPortal: true,
        })
      }
    </DialogStoryCanvas>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='dialog']");
    const trigger = canvas.getByRole("button", {
      name: "Ouvrir la confirmation",
    });

    await expect(root).toHaveAttribute("data-slot", "dialog");
    await expect(trigger).toHaveAttribute("data-slot", "custom-dialog-trigger");
    await expect(
      canvasElement.querySelector("[data-slot='dialog-trigger']"),
    ).toBeNull();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector("[data-slot='dialog-content']");
      if (!node) {
        throw new Error("Dialog content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(
      canvasElement.querySelector("[data-slot='dialog-portal']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='dialog-overlay']"),
    ).toBeTruthy();
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(content).toHaveAttribute("data-slot", "dialog-content");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const closeButton = within(content).getByRole("button", {
      name: "Annuler",
    });
    await expect(closeButton).toHaveAttribute(
      "data-slot",
      "custom-dialog-close",
    );
    await expect(
      content.querySelectorAll("[data-slot='dialog-close']"),
    ).toHaveLength(1);

    await waitFor(() => {
      if (!content.contains(document.activeElement)) {
        throw new Error("Dialog focus has not moved inside the content yet.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='dialog-content']")) {
        throw new Error("Dialog content is still mounted after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("Dialog trigger has not regained focus yet.");
      }
    });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
