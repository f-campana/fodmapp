import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Checkbox, Label } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function CheckboxAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-checkbox-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultChecked: false,
  disabled: false,
  "aria-invalid": false,
  onCheckedChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/Checkbox",
  component: Checkbox,
  argTypes: {
    defaultChecked: {
      description: "Sets the initial checked state in uncontrolled usage.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables interaction and applies disabled styling.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    "aria-invalid": {
      description: "Applies invalid semantics and validation styling tokens.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onCheckedChange: {
      description: "Callback invoked when the checked state changes.",
    },
    className: {
      description: "Additional classes merged with the checkbox root.",
      control: "text",
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
        include: ["[data-checkbox-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

function CheckboxField(args: Story["args"]) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        {...args}
        id="meal-plan"
        aria-label="Enregistrer dans mon plan"
      />
      <div className="space-y-1">
        <Label htmlFor="meal-plan">Enregistrer dans mon plan</Label>
        <p className="text-sm leading-5 text-muted-foreground">
          Gardez cette substitution visible lors de vos prochains repas.
        </p>
      </div>
    </div>
  );
}

function SurfaceCheckboxField() {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Préférences
        </p>
        <h3 className="text-sm font-semibold text-foreground">
          Conserver dans la fiche
        </h3>
      </div>
      <CheckboxField {...defaultPlaygroundArgs} />
    </div>
  );
}

function InvalidCheckboxField() {
  return (
    <div className="space-y-2">
      <CheckboxField {...defaultPlaygroundArgs} aria-invalid />
      <p className="text-sm text-validation-error-text">
        Cette confirmation est requise avant de poursuivre.
      </p>
    </div>
  );
}

function ResponsiveStressCheckboxField() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          aria-label="Prévenir si une instruction longue doit rester visible sur mobile"
          id="checkbox-mobile-stress"
        />
        <Label className="leading-5" htmlFor="checkbox-mobile-stress">
          Prévenir si une instruction longue doit rester visible sur mobile,
          même lorsque le texte de confirmation s&apos;étend sur plusieurs
          lignes dans une largeur très contrainte.
        </Label>
      </div>
      <p className="text-sm leading-5 text-muted-foreground">
        Vérifiez l&apos;alignement du contrôle, le retour à la ligne du libellé
        et l&apos;absence de débordement horizontal.
      </p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <CheckboxAuditFrame centeredMinHeight={72} maxWidth="md">
      <CheckboxField {...args} />
    </CheckboxAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CheckboxAuditFrame centeredMinHeight={72} maxWidth="md">
      <CheckboxField {...defaultPlaygroundArgs} />
    </CheckboxAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CheckboxAuditFrame centeredMinHeight={72} maxWidth="md" surface>
      <SurfaceCheckboxField />
    </CheckboxAuditFrame>
  ),
};

export const Invalid: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CheckboxAuditFrame centeredMinHeight={72} maxWidth="md">
      <InvalidCheckboxField />
    </CheckboxAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onCheckedChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <CheckboxAuditFrame centeredMinHeight={72} maxWidth="md">
      <CheckboxField {...args} />
    </CheckboxAuditFrame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", {
      name: "Enregistrer dans mon plan",
    });

    await expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    await expect(checkbox).toHaveAttribute("aria-checked", "false");

    await userEvent.click(checkbox);

    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <CheckboxAuditFrame centeredMinHeight={72} maxWidth="sm">
      <ResponsiveStressCheckboxField />
    </CheckboxAuditFrame>
  ),
};
