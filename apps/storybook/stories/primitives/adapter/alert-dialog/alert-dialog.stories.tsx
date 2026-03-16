import { type ComponentProps, type ReactNode, useState } from "react";

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
} from "@fodmap/ui/alert-dialog";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function AlertDialogAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-alert-dialog-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function AlertDialogStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <AlertDialogAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </AlertDialogAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  onOpenChange: fn(),
} as const;

const triggerClassName = [
  "inline-flex cursor-pointer items-center justify-center rounded-(--radius)",
  "border border-outline-border bg-outline px-3 py-2 text-sm font-medium text-outline-foreground",
  "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
  "hover:bg-outline-hover",
  "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
].join(" ");

type AlertDialogStoryArgs = ComponentProps<typeof AlertDialog>;

type AlertDialogStoryOptions = {
  actionLabel?: string;
  actionSlot?: string;
  cancelLabel?: string;
  cancelSlot?: string;
  contentClassName?: string;
  description?: string;
  title?: string;
  triggerLabel?: string;
  triggerSlot?: string;
  useLocalPortal?: boolean;
};

function DeletionAlert(
  args: AlertDialogStoryArgs,
  portalContainer: HTMLDivElement | null,
  options?: AlertDialogStoryOptions,
) {
  const contentProps =
    options?.useLocalPortal && portalContainer
      ? { container: portalContainer }
      : {};

  return (
    <AlertDialog {...args}>
      <AlertDialogTrigger
        className={triggerClassName}
        data-slot={options?.triggerSlot}
      >
        {options?.triggerLabel ?? "Supprimer la substitution"}
      </AlertDialogTrigger>
      <AlertDialogContent
        {...contentProps}
        className={options?.contentClassName}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {options?.title ?? "Confirmer la suppression"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {options?.description ??
              "Cette action retirera la substitution de votre plan actuel."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-slot={options?.cancelSlot}>
            {options?.cancelLabel ?? "Annuler"}
          </AlertDialogCancel>
          <AlertDialogAction data-slot={options?.actionSlot}>
            {options?.actionLabel ?? "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const meta = {
  title: "Primitives/Adapter/AlertDialog",
  component: AlertDialog,
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
    onOpenChange: {
      description: "Callback fired whenever the open state changes.",
    },
    children: {
      description: "Trigger and alert content composition.",
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
        include: ["[data-alert-dialog-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <AlertDialogStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => DeletionAlert(args, portalContainer)}
    </AlertDialogStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AlertDialogStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        DeletionAlert(defaultPlaygroundArgs, portalContainer)
      }
    </AlertDialogStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AlertDialogStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        DeletionAlert(defaultPlaygroundArgs, portalContainer)
      }
    </AlertDialogStoryCanvas>
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
    docs: { disable: true },
  },
  render: (args) => (
    <AlertDialogStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        DeletionAlert(args, portalContainer, {
          actionSlot: "custom-action",
          cancelSlot: "custom-cancel",
          triggerSlot: "custom-trigger",
          useLocalPortal: true,
        })
      }
    </AlertDialogStoryCanvas>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='alert-dialog']");
    const trigger = canvas.getByRole("button", {
      name: "Supprimer la substitution",
    });

    await expect(root).toHaveAttribute("data-slot", "alert-dialog");
    await expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
    await expect(
      canvasElement.querySelector("[data-slot='custom-trigger']"),
    ).toBeNull();

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector(
        "[data-slot='alert-dialog-content']",
      );
      if (!node) {
        throw new Error("Alert dialog content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    const portal = canvasElement.querySelector(
      "[data-slot='alert-dialog-portal']",
    );
    const overlay = canvasElement.querySelector(
      "[data-slot='alert-dialog-overlay']",
    );
    const cancel = within(content).getByRole("button", { name: "Annuler" });
    const action = within(content).getByRole("button", { name: "Supprimer" });

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "alert-dialog-portal");
    await expect(overlay).toHaveAttribute("data-slot", "alert-dialog-overlay");
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(cancel).toHaveAttribute("data-slot", "alert-dialog-cancel");
    await expect(action).toHaveAttribute("data-slot", "alert-dialog-action");
    await expect(
      canvasElement.querySelector("[data-slot='custom-cancel']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='custom-action']"),
    ).toBeNull();

    await waitFor(() => {
      if (document.activeElement !== cancel) {
        throw new Error("Alert dialog cancel button is not focused yet.");
      }
    });

    await userEvent.tab();
    await expect(action).toHaveFocus();
    await userEvent.tab();
    await expect(cancel).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='alert-dialog-content']")) {
        throw new Error("Alert dialog content is still mounted after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("Alert dialog trigger has not regained focus yet.");
      }
    });

    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <AlertDialogStoryCanvas centeredMinHeight={80} maxWidth="sm">
      {(portalContainer) =>
        DeletionAlert(
          {
            ...defaultPlaygroundArgs,
            defaultOpen: true,
          },
          portalContainer,
          {
            actionLabel: "Supprimer definitivement",
            cancelLabel: "Conserver la substitution",
            contentClassName: "max-w-sm",
            description:
              "Cette suppression s'appliquera a votre plan de la semaine, a la liste de courses associee, et aux notes de tolerance partagees avec votre dieteticien.",
            title:
              "Supprimer cette substitution avant la prochaine synchronisation hebdomadaire ?",
            triggerLabel: "Verifier la suppression",
            useLocalPortal: true,
          },
        )
      }
    </AlertDialogStoryCanvas>
  ),
};
