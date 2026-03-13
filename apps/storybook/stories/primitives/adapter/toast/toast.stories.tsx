import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Sonner, Toast } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ToastAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-toast-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  position: "bottom-right",
  richColors: true,
  closeButton: true,
  expand: false,
  visibleToasts: 3,
  duration: 4000,
  containerAriaLabel: "Notifications produit",
} as const;

const STORY_TOASTER_IDS = {
  playground: "toast-playground",
  default: "toast-default",
  promise: "toast-promise",
  dark: "toast-dark",
  interaction: "toast-interaction",
  responsive: "toast-responsive",
} as const;

const triggerClassName = [
  "inline-flex cursor-pointer items-center justify-center rounded-(--radius)",
  "border border-outline-border bg-outline px-3 py-2 text-sm font-medium text-outline-foreground",
  "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
  "hover:bg-outline-hover",
  "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
].join(" ");

type ToastStoryArgs = ComponentProps<typeof Sonner>;

function ToastHost({
  args,
  toasterId,
}: {
  args?: ToastStoryArgs;
  toasterId: string;
}) {
  return (
    <Sonner
      {...args}
      id={toasterId}
      toastOptions={{
        ...args?.toastOptions,
        closeButtonAriaLabel:
          args?.toastOptions?.closeButtonAriaLabel ?? "Fermer la notification",
      }}
    />
  );
}

function ToastWorkflowExample({
  args,
  toasterId,
}: {
  args?: ToastStoryArgs;
  toasterId: string;
}) {
  const toastIdRef = useRef<ReturnType<typeof Toast.show> | null>(null);
  const [lastAction, setLastAction] = useState("aucune");

  return (
    <div className="space-y-4">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={triggerClassName}
            onClick={() => {
              toastIdRef.current = Toast.success(
                "Alternative enregistree pour le diner",
                {
                  action: {
                    label: "Voir le plan",
                    onClick: () => setLastAction("voir-plan"),
                  },
                  description:
                    "Le recapitulatif sans ail reste prioritaire pour les trois prochains repas.",
                  duration: Number.POSITIVE_INFINITY,
                  toasterId,
                },
              );
            }}
            type="button"
          >
            Enregistrer la substitution
          </button>
          <button
            className={triggerClassName}
            onClick={() => {
              if (toastIdRef.current) {
                Toast.dismiss(toastIdRef.current);
              }
            }}
            type="button"
          >
            Masquer la notification
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Derniere action: {lastAction}
        </p>
      </div>
      <ToastHost args={args} toasterId={toasterId} />
    </div>
  );
}

function PromiseToastExample({
  args,
  toasterId,
}: {
  args?: ToastStoryArgs;
  toasterId: string;
}) {
  return (
    <div className="rounded-(--radius) border border-border bg-card p-4">
      <button
        className={triggerClassName}
        onClick={() => {
          Toast.promise(
            new globalThis.Promise<string>((resolve) => {
              setTimeout(() => resolve("Export termine"), 500);
            }),
            {
              error: "Echec de l export",
              loading: "Export du recapitulatif en cours",
              success: (message: unknown) => String(message),
              toasterId,
            },
          );
        }}
        type="button"
      >
        Lancer l export
      </button>
      <ToastHost args={args} toasterId={toasterId} />
    </div>
  );
}

function ResponsiveToastPreview({
  args,
  toasterId,
}: {
  args?: ToastStoryArgs;
  toasterId: string;
}) {
  useEffect(() => {
    const toastId = Toast.show("Plan du diner mis a jour", {
      action: {
        label: "Ouvrir le recapitulatif",
        onClick: () => undefined,
      },
      description:
        "Le menu compact garde la sauce a l ail retiree et laisse la portion testee visible pour demain matin.",
      duration: Number.POSITIVE_INFINITY,
      toasterId,
    });

    return () => {
      Toast.dismiss(toastId);
    };
  }, [toasterId]);

  return (
    <div className="rounded-(--radius) border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Verifiez que la notification reste entierement visible a 320 px et 390
        px sans couper le texte ni l action.
      </p>
      <ToastHost args={args} toasterId={toasterId} />
    </div>
  );
}

const meta = {
  title: "Composed/Toast",
  component: Sonner,
  argTypes: {
    position: {
      description: "Viewport position used by the mounted Sonner host.",
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
      description: "Enables semantic toast colors on the host.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    closeButton: {
      description: "Shows a close button on rendered toasts.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    expand: {
      description: "Keeps stacked toasts expanded.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    visibleToasts: {
      description: "Maximum number of visible toasts before stacking.",
      control: { type: "number" },
      table: { defaultValue: { summary: "3" } },
    },
    duration: {
      description: "Default duration applied by the Sonner host.",
      control: { type: "number" },
      table: { defaultValue: { summary: "4000" } },
    },
    containerAriaLabel: {
      description: "Accessible label applied to the live region host.",
      control: { type: "text" },
      table: { defaultValue: { summary: "Notifications produit" } },
    },
    toastOptions: {
      description: "Default options passed through to Sonner toasts.",
      control: { type: "object" },
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-toast-audit-root]", "[data-sonner-toaster]"],
      },
    },
  },
} satisfies Meta<typeof Sonner>;

export default meta;

type Story = StoryObj<typeof meta>;
type StoryArgs = Story["args"];
type StoryPlayContext = Parameters<NonNullable<Story["play"]>>[0];

export const Playground: Story = {
  render: (args: StoryArgs) => (
    <ToastAuditFrame centeredMinHeight={72} maxWidth="xl">
      <ToastWorkflowExample
        args={args}
        toasterId={STORY_TOASTER_IDS.playground}
      />
    </ToastAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ToastAuditFrame centeredMinHeight={72} maxWidth="xl">
      <ToastWorkflowExample
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.default}
      />
    </ToastAuditFrame>
  ),
};

export const PromiseFlow: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ToastAuditFrame centeredMinHeight={72} maxWidth="md">
      <PromiseToastExample
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.promise}
      />
    </ToastAuditFrame>
  ),
};

export const DarkMode: Story = {
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
  render: () => (
    <ToastAuditFrame centeredMinHeight={72} maxWidth="xl">
      <ToastWorkflowExample
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.dark}
      />
    </ToastAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args: StoryArgs) => (
    <ToastAuditFrame centeredMinHeight={72} maxWidth="xl">
      <ToastWorkflowExample
        args={args}
        toasterId={STORY_TOASTER_IDS.interaction}
      />
    </ToastAuditFrame>
  ),
  play: async ({ canvasElement }: StoryPlayContext) => {
    const canvas = within(canvasElement);

    Toast.dismiss();

    await userEvent.click(
      canvas.getByRole("button", { name: "Enregistrer la substitution" }),
    );

    const body = within(document.body);

    await waitFor(async () => {
      await expect(
        document.body.querySelector("[data-sonner-toaster]"),
      ).toBeTruthy();
    });

    await expect(
      canvasElement.querySelector("[data-slot='sonner']"),
    ).toHaveAttribute("data-slot", "sonner");
    await expect(
      body.getByLabelText(/Notifications produit/i),
    ).toBeInTheDocument();
    await expect(
      body.getByText("Alternative enregistree pour le diner"),
    ).toBeInTheDocument();

    await userEvent.click(body.getByRole("button", { name: "Voir le plan" }));

    await waitFor(async () => {
      await expect(
        canvas.getByText("Derniere action: voir-plan"),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      canvas.getByRole("button", { name: "Enregistrer la substitution" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Masquer la notification" }),
    );

    await waitFor(async () => {
      await expect(
        body.queryByText("Alternative enregistree pour le diner"),
      ).toBeNull();
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <ToastAuditFrame centeredMinHeight={72} maxWidth="sm">
      <ResponsiveToastPreview
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.responsive}
      />
    </ToastAuditFrame>
  ),
};
