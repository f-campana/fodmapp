import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function CollapsibleAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-collapsible-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  disabled: false,
} as const;

const meta = {
  title: "Primitives/Adapter/Collapsible",
  component: Collapsible,
  argTypes: {
    defaultOpen: {
      description: "Sets initial open state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables trigger interaction when true.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      description: "Additional classes merged with the collapsible root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "CollapsibleTrigger and CollapsibleContent composition.",
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
        include: ["[data-collapsible-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

function DefaultCollapsible(args: Story["args"]) {
  return (
    <Collapsible
      className={args?.className}
      defaultOpen={args?.defaultOpen ?? false}
      disabled={args?.disabled ?? false}
    >
      <CollapsibleTrigger>Conseils rapides avant cuisson</CollapsibleTrigger>
      <CollapsibleContent>
        Regroupez vos substitutions au même endroit et précisez uniquement les
        gestes qui changent vraiment la préparation.
      </CollapsibleContent>
    </Collapsible>
  );
}

function InitiallyOpenCollapsible() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Plan de préparation avant cuisson</CollapsibleTrigger>
      <CollapsibleContent>
        Faites tremper les légumineuses la veille, rincez-les abondamment puis
        gardez une seule variable nouvelle par repas.
      </CollapsibleContent>
    </Collapsible>
  );
}

function SurfaceCollapsible() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Voir les repères de substitution</CollapsibleTrigger>
      <CollapsibleContent>
        Gardez ici les alternatives déjà validées pour éviter de rouvrir toute
        la fiche pendant la préparation.
      </CollapsibleContent>
    </Collapsible>
  );
}

function DisabledCollapsible() {
  return (
    <Collapsible disabled>
      <CollapsibleTrigger>Section indisponible</CollapsibleTrigger>
      <CollapsibleContent>Contenu masqué</CollapsibleContent>
    </Collapsible>
  );
}

function ResponsiveStressCollapsible() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>
        Quels ajustements très détaillés pouvez-vous prévoir à l&apos;avance
        pour un déjeuner transportable, lorsque l&apos;intitulé du conseil doit
        rester lisible sur une largeur mobile très contrainte ?
      </CollapsibleTrigger>
      <CollapsibleContent>
        Préparez une base simple la veille, répartissez-la en portions et
        ajoutez au dernier moment les éléments plus fragiles afin de conserver
        une texture correcte sans introduire trop de variables en même temps.
      </CollapsibleContent>
    </Collapsible>
  );
}

export const Playground: Story = {
  render: (args) => (
    <CollapsibleAuditFrame maxWidth="md">
      <DefaultCollapsible {...args} />
    </CollapsibleAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CollapsibleAuditFrame maxWidth="md">
      <div className="w-full max-w-md space-y-4 text-left">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Préparation
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Note de cuisson secondaire
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Gardez un seul détail optionnel à portée de clic lorsque la
            préparation principale doit rester compacte.
          </p>
        </div>
        <DefaultCollapsible {...defaultPlaygroundArgs} />
      </div>
    </CollapsibleAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CollapsibleAuditFrame maxWidth="md" surface>
      <div className="w-full max-w-md space-y-4 text-left">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Carte
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Aide intégrée dans la surface
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Dans une carte ou un panneau, laissez visibles les repères déjà
            validés sans surcharger le bloc principal.
          </p>
        </div>
        <SurfaceCollapsible />
      </div>
    </CollapsibleAuditFrame>
  ),
};

export const InitiallyOpen: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CollapsibleAuditFrame maxWidth="md">
      <div className="w-full max-w-md space-y-4 text-left">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Comportement
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Ouvert dès le premier rendu
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Utilisez l'état initialement ouvert quand le conseil doit être lu
            dès l'arrivée sur la page.
          </p>
        </div>
        <InitiallyOpenCollapsible />
      </div>
    </CollapsibleAuditFrame>
  ),
};

export const Disabled: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CollapsibleAuditFrame maxWidth="md">
      <div className="w-full max-w-md space-y-4 text-left">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Disponibilité
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            État désactivé
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Conservez la place du contrôle lorsque la section existe encore dans
            le flux mais reste temporairement indisponible.
          </p>
        </div>
        <DisabledCollapsible />
      </div>
    </CollapsibleAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <CollapsibleAuditFrame maxWidth="md">
      <DefaultCollapsible {...defaultPlaygroundArgs} />
    </CollapsibleAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='collapsible']");
    const trigger = canvas.getByRole("button", {
      name: "Conseils rapides avant cuisson",
    });

    await expect(root).toHaveAttribute("data-slot", "collapsible");
    await expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");

    await userEvent.click(trigger);

    const content = canvas
      .getByText(
        "Regroupez vos substitutions au même endroit et précisez uniquement les gestes qui changent vraiment la préparation.",
      )
      .closest("[data-slot='collapsible-content']");

    await expect(root).toHaveAttribute("data-state", "open");
    await expect(content).toHaveAttribute("data-slot", "collapsible-content");
    await expect(content).toHaveAttribute(
      "id",
      trigger.getAttribute("aria-controls") ?? "",
    );

    await userEvent.click(trigger);

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(root).toHaveAttribute("data-state", "closed");
    await expect(
      canvas.queryByText(
        "Regroupez vos substitutions au même endroit et précisez uniquement les gestes qui changent vraiment la préparation.",
      ),
    ).toBeNull();
  },
};

export const ResponsiveStress: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CollapsibleAuditFrame maxWidth="sm">
      <div className="w-full max-w-md space-y-4 text-left">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Responsive
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Libellé long et contenu visible
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Le stress case doit laisser lire le libellé long et le contenu
            ouvert dès le premier affichage, même sur une largeur mobile.
          </p>
        </div>
        <ResponsiveStressCollapsible />
      </div>
    </CollapsibleAuditFrame>
  ),
};
