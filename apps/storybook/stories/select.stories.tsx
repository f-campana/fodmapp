import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@fodmapp/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function SelectAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-select-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  dir: "ltr",
  disabled: false,
  required: false,
  onOpenChange: fn(),
  onValueChange: fn(),
} as const;

const frequentOptions = [
  { value: "profil", label: "Profil" },
  { value: "parametres", label: "Paramètres" },
  { value: "mode-expert", label: "Mode expert" },
] as const;

const groupedSections = [
  {
    label: "Suivi",
    items: [
      { value: "journal", label: "Journal alimentaire" },
      { value: "scores", label: "Scores personnels" },
    ],
  },
  {
    label: "Analyse",
    items: [
      { value: "substitutions", label: "Substitutions" },
      { value: "rapport", label: "Rapport expert" },
    ],
  },
] as const;

const longListOptions = Array.from({ length: 18 }, (_, index) => ({
  value: `follow-up-${index + 1}`,
  label: `Option de suivi ${index + 1}`,
}));

const meta = {
  title: "Primitives/Adapter/Select",
  component: Select,
  argTypes: {
    defaultOpen: {
      description: "Sets the initial open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description:
        "Controls the open state when the select is externally managed.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    defaultValue: {
      description: "Sets the initial selected value in uncontrolled mode.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    value: {
      description: "Controls the selected value in controlled mode.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    dir: {
      description: "Reading direction used by keyboard navigation and layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    disabled: {
      description: "Disables the trigger and prevents interactions.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      description: "Marks the field as required for form submission.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      description: "Form field name used during submission.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    onOpenChange: {
      description: "Callback invoked whenever the open state changes.",
    },
    onValueChange: {
      description: "Callback invoked whenever the selected value changes.",
    },
    children: {
      description:
        "Composition of trigger, content, groups, labels, and items.",
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
        include: ["[data-select-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

function SelectScaffold({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="w-full space-y-4">
      <div className="space-y-1 text-left">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

function SelectStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <SelectAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </SelectAuditFrame>
  );
}

function BasicSelect(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <Select {...args}>
      <SelectTrigger aria-label="Choisir une vue">
        <SelectValue placeholder="Choisir une vue" />
      </SelectTrigger>
      <SelectContent {...contentProps}>
        <SelectGroup>
          <SelectLabel>Mon compte</SelectLabel>
          <SelectSeparator />
          {frequentOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function GroupedSelect(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <Select {...args}>
      <SelectTrigger aria-label="Choisir une catégorie">
        <SelectValue placeholder="Choisir une catégorie" />
      </SelectTrigger>
      <SelectContent {...contentProps}>
        {groupedSections.map((section, index) => (
          <div key={section.label}>
            {index > 0 ? <SelectSeparator /> : null}
            <SelectGroup>
              <SelectLabel>{section.label}</SelectLabel>
              {section.items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

function LongListSelect(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <Select {...args}>
      <SelectTrigger aria-label="Choisir un suivi">
        <SelectValue placeholder="Choisir un suivi" />
      </SelectTrigger>
      <SelectContent className="max-h-44" {...contentProps}>
        <SelectGroup>
          <SelectLabel>Suivis disponibles</SelectLabel>
          <SelectSeparator />
          {longListOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ResponsiveStressSelect(portalContainer: HTMLDivElement | null) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <Select>
      <SelectTrigger aria-label="Choisir une configuration détaillée">
        <SelectValue placeholder="Choisir une configuration détaillée" />
      </SelectTrigger>
      <SelectContent className="max-h-44" {...contentProps}>
        <SelectGroup>
          <SelectLabel>Largeur réduite</SelectLabel>
          <SelectSeparator />
          <SelectItem value="mobile-primary">
            Configuration principale avec un intitulé volontairement long pour
            vérifier le retour à la ligne
          </SelectItem>
          <SelectItem value="mobile-secondary">
            Variante secondaire avec précision complémentaire
          </SelectItem>
          <SelectItem value="mobile-compact">Variante compacte</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export const Playground: Story = {
  render: (args) => (
    <SelectStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <SelectScaffold
          description="Choisissez la vue active sans exposer toute la liste en permanence."
          eyebrow="Navigation"
          title="Sélecteur standard"
        >
          {BasicSelect(args, portalContainer)}
        </SelectScaffold>
      )}
    </SelectStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SelectStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <SelectScaffold
          description="Utilisez un Select quand une seule option doit être choisie parmi un ensemble compact."
          eyebrow="Navigation"
          title="Sélecteur standard"
        >
          {BasicSelect(defaultPlaygroundArgs, portalContainer)}
        </SelectScaffold>
      )}
    </SelectStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SelectStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) => (
        <SelectScaffold
          description="Dans une carte ou un panneau, gardez le déclencheur aligné avec le contenu principal."
          eyebrow="Surface"
          title="Select dans une carte"
        >
          {BasicSelect(defaultPlaygroundArgs, portalContainer)}
        </SelectScaffold>
      )}
    </SelectStoryCanvas>
  ),
};

export const Grouped: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SelectStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <SelectScaffold
          description="Regroupez les options lorsqu'elles appartiennent à des sections distinctes du produit."
          eyebrow="Organisation"
          title="Options groupées"
        >
          {GroupedSelect(defaultPlaygroundArgs, portalContainer)}
        </SelectScaffold>
      )}
    </SelectStoryCanvas>
  ),
};

export const InteractionChecks: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <SelectStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <SelectScaffold
          description="Vérifie l'ouverture, le portail, la sélection et le comportement de liste longue."
          eyebrow="Qualité"
          title="Contrats d'interaction"
        >
          {LongListSelect(args, portalContainer)}
        </SelectScaffold>
      )}
    </SelectStoryCanvas>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Choisir un suivi" });

    await expect(
      canvasElement.querySelector("[data-slot='select']"),
    ).toHaveAttribute("data-slot", "select");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const portal = canvasElement.querySelector("[data-slot='select-portal']");
    const viewport = canvasElement.querySelector(
      "[data-slot='select-viewport']",
    );
    const listbox = canvas.getByRole("listbox");
    const option = canvas.getByRole("option", { name: "Option de suivi 12" });

    await expect(portal).toHaveAttribute("data-slot", "select-portal");
    await expect(viewport).toHaveAttribute("tabindex", "0");
    await expect(listbox).toHaveAttribute("data-state", "open");

    await userEvent.click(option);

    await expect(args.onValueChange).toHaveBeenCalledWith("follow-up-12");
    await expect(trigger).toHaveTextContent("Option de suivi 12");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(
      canvasElement.querySelector("[data-slot='select-content']"),
    ).toBeNull();
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <SelectStoryCanvas centeredMinHeight={72} maxWidth="sm">
      {(portalContainer) => (
        <SelectScaffold
          description="Le déclencheur doit rester lisible et sans débordement sur une largeur mobile serrée."
          eyebrow="Responsive"
          title="Libellés longs"
        >
          {ResponsiveStressSelect(portalContainer)}
        </SelectScaffold>
      )}
    </SelectStoryCanvas>
  ),
};
