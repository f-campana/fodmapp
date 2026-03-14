import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button, Sonner, toast } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function SonnerAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-sonner-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  position: "bottom-right",
  richColors: false,
  closeButton: true,
  expand: false,
  visibleToasts: 3,
  duration: 4000,
  containerAriaLabel: "Notifications produit",
} as const;

const STORY_TOASTER_IDS = {
  playground: "sonner-playground",
  default: "sonner-default",
  promise: "sonner-promise",
  dark: "sonner-dark",
  interaction: "sonner-interaction",
  responsive: "sonner-responsive",
} as const;

type SonnerStoryArgs = ComponentProps<typeof Sonner>;

function SonnerHost({
  args,
  toasterId,
}: {
  args?: SonnerStoryArgs;
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

function SonnerActionExample({
  args,
  toasterId,
}: {
  args?: SonnerStoryArgs;
  toasterId: string;
}) {
  const [lastDecision, setLastDecision] = useState("aucune");

  return (
    <div className="space-y-4">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <Button
          onClick={() =>
            toast("Revue hebdomadaire prete", {
              action: {
                label: "Ouvrir la revue",
                onClick: () => setLastDecision("ouvrir-revue"),
              },
              cancel: {
                label: "Plus tard",
                onClick: () => setLastDecision("rappeler-plus-tard"),
              },
              description:
                "Les portions testees et exceptions recentes sont pretes pour la revue du vendredi.",
              duration: Number.POSITIVE_INFINITY,
              toasterId,
            })
          }
        >
          Afficher la revue
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">
          Derniere decision: {lastDecision}
        </p>
      </div>
      <SonnerHost args={args} toasterId={toasterId} />
    </div>
  );
}

function SonnerPromiseExample({
  args,
  toasterId,
}: {
  args?: SonnerStoryArgs;
  toasterId: string;
}) {
  return (
    <div className="rounded-(--radius) border border-border bg-card p-4">
      <Button
        onClick={() =>
          toast.promise(
            new globalThis.Promise<string>((resolve) => {
              setTimeout(() => resolve("Rapport envoye"), 500);
            }),
            {
              error: "Echec de l envoi",
              loading: "Envoi du rapport en cours",
              success: (message: string) => String(message),
              toasterId,
            },
          )
        }
      >
        Envoyer le rapport
      </Button>
      <SonnerHost args={args} toasterId={toasterId} />
    </div>
  );
}

function ResponsiveSonnerPreview({
  args,
  toasterId,
}: {
  args?: SonnerStoryArgs;
  toasterId: string;
}) {
  useEffect(() => {
    const toastId = toast("Controle qualite termine", {
      action: {
        label: "Voir les details",
        onClick: () => undefined,
      },
      description:
        "Le recapitulatif mobile garde la synthese des portions et la prochaine revue a portee sans couper le texte ni le bouton d action.",
      duration: Number.POSITIVE_INFINITY,
      toasterId,
    });

    return () => {
      toast.dismiss(toastId);
    };
  }, [toasterId]);

  return (
    <div className="rounded-(--radius) border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Verifiez le host portale a 320 px et 390 px avec une description plus
        dense que la notification par defaut.
      </p>
      <SonnerHost args={args} toasterId={toasterId} />
    </div>
  );
}

const meta = {
  title: "Primitives/Adapter/Sonner",
  component: Sonner,
  argTypes: {
    position: {
      description: "Viewport position for the mounted toast host.",
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
      description:
        "Passes Sonner's semantic flag through without replacing the wrapper's tokenized notification styling.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    closeButton: {
      description: "Shows a close button on rendered notifications.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    expand: {
      description: "Keeps stacked notifications expanded.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    visibleToasts: {
      description: "Maximum number of visible notifications.",
      control: { type: "number" },
      table: { defaultValue: { summary: "3" } },
    },
    duration: {
      description: "Default duration used by Sonner.",
      control: { type: "number" },
      table: { defaultValue: { summary: "4000" } },
    },
    containerAriaLabel: {
      description: "Accessible label applied to the Sonner live region.",
      control: { type: "text" },
      table: { defaultValue: { summary: "Notifications produit" } },
    },
    toastOptions: {
      description: "Default options passed through to Sonner notifications.",
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
        include: ["[data-sonner-audit-root]", "[data-sonner-toaster]"],
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
    <SonnerAuditFrame centeredMinHeight={72} maxWidth="xl">
      <SonnerActionExample
        args={args}
        toasterId={STORY_TOASTER_IDS.playground}
      />
    </SonnerAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SonnerAuditFrame centeredMinHeight={72} maxWidth="xl">
      <SonnerActionExample
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.default}
      />
    </SonnerAuditFrame>
  ),
};

export const PromiseWorkflow: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SonnerAuditFrame centeredMinHeight={72} maxWidth="md">
      <SonnerPromiseExample
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.promise}
      />
    </SonnerAuditFrame>
  ),
};

export const DarkMode: Story = {
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
  render: () => (
    <SonnerAuditFrame centeredMinHeight={72} maxWidth="xl">
      <SonnerActionExample
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.dark}
      />
    </SonnerAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args: StoryArgs) => (
    <SonnerAuditFrame centeredMinHeight={72} maxWidth="xl">
      <SonnerActionExample
        args={args}
        toasterId={STORY_TOASTER_IDS.interaction}
      />
    </SonnerAuditFrame>
  ),
  play: async ({ canvasElement }: StoryPlayContext) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    toast.dismiss();

    await userEvent.click(
      canvas.getByRole("button", { name: "Afficher la revue" }),
    );

    await waitFor(async () => {
      await expect(
        document.body.querySelector("[data-sonner-toaster]"),
      ).toBeTruthy();
    });

    const renderedToast = await waitFor(() => {
      const node = body
        .getByText("Revue hebdomadaire prete")
        .closest("[data-sonner-toast]");
      if (!node) {
        throw new Error("Notification not mounted yet");
      }

      return node as HTMLElement;
    });

    await expect(
      canvasElement.querySelector("[data-slot='sonner']"),
    ).toHaveAttribute("data-slot", "sonner");
    await expect(
      body.getByLabelText(/Notifications produit/i),
    ).toBeInTheDocument();
    await expect(
      body.getByText("Revue hebdomadaire prete"),
    ).toBeInTheDocument();
    await expect(renderedToast).toHaveAttribute("data-styled", "false");
    await expect(renderedToast).toHaveAttribute("data-rich-colors", "false");
    await expect(
      body.getByRole("button", { name: "Ouvrir la revue" }).className,
    ).toContain("bg-primary");
    await expect(
      body.getByRole("button", { name: "Plus tard" }).className,
    ).toContain("border-outline-border");

    await userEvent.click(
      body.getByRole("button", { name: "Ouvrir la revue" }),
    );

    await waitFor(async () => {
      await expect(
        canvas.getByText("Derniere decision: ouvrir-revue"),
      ).toBeInTheDocument();
    });

    toast.dismiss();

    await waitFor(async () => {
      await expect(body.queryByText("Revue hebdomadaire prete")).toBeNull();
    });

    await userEvent.click(
      canvas.getByRole("button", { name: "Afficher la revue" }),
    );

    const closeButtons = body.getAllByRole("button", {
      name: "Fermer la notification",
    });

    await userEvent.click(closeButtons[closeButtons.length - 1]!);

    await waitFor(async () => {
      await expect(body.queryByText("Revue hebdomadaire prete")).toBeNull();
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <SonnerAuditFrame centeredMinHeight={72} maxWidth="sm">
      <ResponsiveSonnerPreview
        args={defaultPlaygroundArgs}
        toasterId={STORY_TOASTER_IDS.responsive}
      />
    </SonnerAuditFrame>
  ),
};
