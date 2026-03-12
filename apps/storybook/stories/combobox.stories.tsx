import type { Meta, StoryObj } from "@storybook/react-vite";

import { type ReactNode, useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxMulti,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function ComboboxAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-combobox-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  modal: false,
  onOpenChange: fn(),
  onValueChange: fn(),
} as const;

const fruitOptions = [
  { value: "pomme", label: "Pomme" },
  { value: "banane", label: "Banane" },
  { value: "kiwi", label: "Kiwi" },
] as const;

const longComboboxOptions = Array.from({ length: 18 }, (_, index) => ({
  value: `ingredient-${index + 1}`,
  label: `Ingrédient recommandé ${index + 1}`,
}));

const meta = {
  title: "Composed/Combobox",
  component: Combobox,
  argTypes: {
    defaultOpen: {
      description: "Sets the initial popover open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls the popover open state.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    defaultValue: {
      description: "Initial selected value in single mode.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    value: {
      description: "Controlled selected value in single mode.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    modal: {
      description: "Whether the popover should behave as a modal layer.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      description: "Callback invoked when the popover open state changes.",
    },
    onValueChange: {
      description: "Callback invoked when the selected value changes.",
    },
    children: {
      description: "Composition of trigger, search input, groups, and items.",
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
        include: ["[data-combobox-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

function ComboboxScaffold({
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

function ComboboxStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <ComboboxAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </ComboboxAuditFrame>
  );
}

function SingleCombobox(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <Combobox {...args}>
      <ComboboxTrigger aria-label="Choisir un aliment" />
      <ComboboxContent {...contentProps}>
        <ComboboxInput placeholder="Rechercher un aliment" />
        <ComboboxList>
          <ComboboxEmpty>Aucun résultat</ComboboxEmpty>
          <ComboboxGroup heading="Fruits">
            {fruitOptions.map((option) => (
              <ComboboxItem key={option.value} value={option.value}>
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup heading="Légumes">
            <ComboboxItem value="carotte">Carotte</ComboboxItem>
            <ComboboxItem value="courgette">Courgette</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function MultiComboboxStory(portalContainer: HTMLDivElement | null) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <ComboboxMulti>
      <ComboboxTrigger aria-label="Choisir plusieurs aliments" />
      <ComboboxContent {...contentProps}>
        <ComboboxInput placeholder="Rechercher un aliment" />
        <ComboboxList>
          <ComboboxEmpty>Aucun résultat</ComboboxEmpty>
          <ComboboxGroup heading="Fruits">
            {fruitOptions.map((option) => (
              <ComboboxItem key={option.value} value={option.value}>
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </ComboboxMulti>
  );
}

function LongListCombobox(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <Combobox {...args}>
      <ComboboxTrigger aria-label="Choisir une recommandation" />
      <ComboboxContent {...contentProps}>
        <ComboboxInput placeholder="Rechercher une recommandation" />
        <ComboboxList className="max-h-44">
          <ComboboxEmpty>Aucun résultat</ComboboxEmpty>
          <ComboboxGroup heading="Recommandations">
            {longComboboxOptions.map((option) => (
              <ComboboxItem key={option.value} value={option.value}>
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ResponsiveStressCombobox(portalContainer: HTMLDivElement | null) {
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <Combobox>
      <ComboboxTrigger aria-label="Choisir une recommandation détaillée" />
      <ComboboxContent {...contentProps}>
        <ComboboxInput placeholder="Rechercher une recommandation détaillée" />
        <ComboboxList className="max-h-44">
          <ComboboxEmpty>Aucun résultat</ComboboxEmpty>
          <ComboboxGroup heading="Largeur réduite">
            <ComboboxItem value="detailed-primary">
              Recommandation principale avec un intitulé volontairement long
              pour tester le retour à la ligne
            </ComboboxItem>
            <ComboboxItem value="detailed-secondary">
              Variante secondaire avec plus de contexte
            </ComboboxItem>
            <ComboboxItem value="detailed-short">Variante compacte</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ComboboxStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <ComboboxScaffold
          description="Cherchez puis sélectionnez une option sans parcourir toute la liste manuellement."
          eyebrow="Recherche"
          title="Combobox simple"
        >
          {SingleCombobox(args, portalContainer)}
        </ComboboxScaffold>
      )}
    </ComboboxStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ComboboxStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <ComboboxScaffold
          description="Utilisez Combobox quand la recherche textuelle accélère la sélection."
          eyebrow="Recherche"
          title="Combobox simple"
        >
          {SingleCombobox(defaultPlaygroundArgs, portalContainer)}
        </ComboboxScaffold>
      )}
    </ComboboxStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ComboboxStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) => (
        <ComboboxScaffold
          description="Dans une carte, gardez le déclencheur et le panneau de résultats cohérents avec la surface."
          eyebrow="Surface"
          title="Combobox dans une carte"
        >
          {SingleCombobox(defaultPlaygroundArgs, portalContainer)}
        </ComboboxScaffold>
      )}
    </ComboboxStoryCanvas>
  ),
};

export const Multiple: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ComboboxStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <ComboboxScaffold
          description="Le mode multiple est utile quand plusieurs éléments doivent rester visibles dans le déclencheur."
          eyebrow="Sélection"
          title="Sélection multiple"
        >
          {MultiComboboxStory(portalContainer)}
        </ComboboxScaffold>
      )}
    </ComboboxStoryCanvas>
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
    <ComboboxStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => (
        <ComboboxScaffold
          description="Vérifie le portail, la recherche ouverte et la sélection sur une liste longue."
          eyebrow="Qualité"
          title="Contrats d&apos;interaction"
        >
          {LongListCombobox(args, portalContainer)}
        </ComboboxScaffold>
      )}
    </ComboboxStoryCanvas>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", {
      name: "Choisir une recommandation",
    });

    await expect(
      canvasElement.querySelector("[data-slot='combobox']"),
    ).toHaveAttribute("data-slot", "combobox");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const portal = canvasElement.querySelector("[data-slot='combobox-portal']");
    const input = canvas.getByPlaceholderText("Rechercher une recommandation");
    const option = canvas.getByRole("option", {
      name: "Ingrédient recommandé 12",
    });

    await expect(portal).toHaveAttribute("data-slot", "combobox-portal");
    await expect(input).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(option);

    await expect(args.onValueChange).toHaveBeenCalledWith("ingredient-12");
    await expect(trigger).toHaveTextContent("Ingrédient recommandé 12");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(
      canvasElement.querySelector("[data-slot='combobox-content']"),
    ).toBeNull();
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <ComboboxStoryCanvas centeredMinHeight={72} maxWidth="sm">
      {(portalContainer) => (
        <ComboboxScaffold
          description="Le déclencheur et les résultats doivent rester lisibles malgré des libellés longs."
          eyebrow="Responsive"
          title="Libellés longs"
        >
          {ResponsiveStressCombobox(portalContainer)}
        </ComboboxScaffold>
      )}
    </ComboboxStoryCanvas>
  ),
};
