import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Label } from "@fodmapp/ui/label";
import { RadioGroup, RadioGroupItem } from "@fodmapp/ui/radio-group";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function RadioGroupAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-radio-group-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultValue: "gentle",
  disabled: false,
  onValueChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/RadioGroup",
  component: RadioGroup,
  argTypes: {
    defaultValue: {
      description: "Sets the initial selected value in uncontrolled mode.",
      control: "text",
      table: { defaultValue: { summary: "gentle" } },
    },
    value: {
      description: "Controls the selected value in controlled mode.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    disabled: {
      description: "Disables the whole radio group.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onValueChange: {
      description: "Callback invoked when the selected value changes.",
    },
    className: {
      description: "Additional classes merged with the radio group root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Composition of RadioGroupItem controls and labels.",
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
        include: ["[data-radio-group-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function RadioOptions({ disabled = false }: { disabled?: boolean }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <RadioGroupItem
          aria-label="Tolérance prudente"
          disabled={disabled}
          id="radio-gentle"
          value="gentle"
        />
        <div className="space-y-1">
          <Label htmlFor="radio-gentle">Tolérance prudente</Label>
          <p className="text-sm leading-5 text-muted-foreground">
            Introduisez une seule variation alimentaire à la fois.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem
          aria-label="Tolérance intermédiaire"
          disabled={disabled}
          id="radio-balanced"
          value="balanced"
        />
        <div className="space-y-1">
          <Label htmlFor="radio-balanced">Tolérance intermédiaire</Label>
          <p className="text-sm leading-5 text-muted-foreground">
            Gardez deux options possibles pour un même repas.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem
          aria-label="Tolérance exploratoire"
          disabled={disabled}
          id="radio-exploratory"
          value="exploratory"
        />
        <div className="space-y-1">
          <Label htmlFor="radio-exploratory">Tolérance exploratoire</Label>
          <p className="text-sm leading-5 text-muted-foreground">
            Ouvrez davantage d&apos;alternatives quand le contexte le permet.
          </p>
        </div>
      </div>
    </>
  );
}

function RadioGroupField(args: Story["args"]) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Préférences
        </p>
        <h3 className="text-sm font-semibold text-foreground">
          Niveau de flexibilité recommandé
        </h3>
      </div>
      <RadioGroup
        {...args}
        aria-label="Niveau de flexibilité recommandé"
        className="gap-4"
      >
        <RadioOptions disabled={args?.disabled ?? false} />
      </RadioGroup>
    </div>
  );
}

function DisabledRadioGroupField() {
  return (
    <RadioGroupField {...defaultPlaygroundArgs} disabled onValueChange={fn()} />
  );
}

function ResponsiveStressRadioGroupField() {
  return (
    <RadioGroup
      aria-label="Niveaux de flexibilité en largeur réduite"
      className="gap-4"
      defaultValue="narrow"
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem
          aria-label="Option mobile longue"
          id="radio-mobile-stress"
          value="narrow"
        />
        <Label className="leading-5" htmlFor="radio-mobile-stress">
          Garder visible une recommandation détaillée même lorsque le libellé du
          choix radio s&apos;étend sur plusieurs lignes dans une largeur mobile
          très contrainte.
        </Label>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem
          aria-label="Option mobile courte"
          id="radio-mobile-short"
          value="short"
        />
        <Label htmlFor="radio-mobile-short">Variante courte</Label>
      </div>
    </RadioGroup>
  );
}

export const Playground: Story = {
  render: (args) => (
    <RadioGroupAuditFrame centeredMinHeight={72} maxWidth="md">
      <RadioGroupField {...args} />
    </RadioGroupAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <RadioGroupAuditFrame centeredMinHeight={72} maxWidth="md">
      <RadioGroupField {...defaultPlaygroundArgs} />
    </RadioGroupAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <RadioGroupAuditFrame centeredMinHeight={72} maxWidth="md" surface>
      <RadioGroupField {...defaultPlaygroundArgs} />
    </RadioGroupAuditFrame>
  ),
};

export const Disabled: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <RadioGroupAuditFrame centeredMinHeight={72} maxWidth="md">
      <DisabledRadioGroupField />
    </RadioGroupAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onValueChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <RadioGroupAuditFrame centeredMinHeight={72} maxWidth="md">
      <RadioGroupField {...args} />
    </RadioGroupAuditFrame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", {
      name: "Niveau de flexibilité recommandé",
    });
    const gentle = canvas.getByRole("radio", { name: "Tolérance prudente" });
    const balanced = canvas.getByRole("radio", {
      name: "Tolérance intermédiaire",
    });
    const exploratory = canvas.getByRole("radio", {
      name: "Tolérance exploratoire",
    });

    await expect(group).toHaveAttribute("data-slot", "radio-group");
    await expect(gentle).toBeChecked();
    await expect(balanced).not.toBeChecked();

    await userEvent.click(balanced);

    await expect(args.onValueChange).toHaveBeenCalledWith("balanced");
    await expect(balanced).toBeChecked();
    await expect(gentle).not.toBeChecked();

    await userEvent.click(exploratory);

    await expect(args.onValueChange).toHaveBeenCalledWith("exploratory");
    await expect(exploratory).toBeChecked();
    await expect(balanced).not.toBeChecked();
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <RadioGroupAuditFrame centeredMinHeight={72} maxWidth="sm">
      <ResponsiveStressRadioGroupField />
    </RadioGroupAuditFrame>
  ),
};
