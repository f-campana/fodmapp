import { type ComponentProps, type ComponentType, type ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Field } from "@fodmap/ui/field";
import { Input } from "@fodmap/ui/input";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function FieldAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-field-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

type FieldStoryArgs = Pick<
  ComponentProps<typeof Field>,
  "error" | "hint" | "id" | "label" | "labelClassName" | "required"
>;

const defaultPlaygroundArgs = {
  error: undefined,
  hint: "Saisissez la valeur complete pour cette ligne du plan.",
  id: "field-playground",
  label: "Dose test",
  labelClassName: undefined,
  required: false,
} satisfies FieldStoryArgs;

function FieldExample({
  args,
  childAriaDescribedBy,
  childPlaceholder,
}: {
  args?: FieldStoryArgs;
  childAriaDescribedBy?: string;
  childPlaceholder: string;
}) {
  const fieldArgs = args ?? defaultPlaygroundArgs;

  return (
    <div className="space-y-3">
      {childAriaDescribedBy ? (
        <p className="text-sm text-muted-foreground" id={childAriaDescribedBy}>
          Note existante deja associee au controle.
        </p>
      ) : null}
      <Field {...fieldArgs}>
        <Input
          aria-describedby={childAriaDescribedBy}
          placeholder={childPlaceholder}
        />
      </Field>
    </div>
  );
}

const meta = {
  title: "Composed/Field",
  component: Field as ComponentType<FieldStoryArgs>,
  argTypes: {
    label: {
      description: "Visible label associated with the wrapped control.",
      control: { type: "text" },
      table: { defaultValue: { summary: "required" } },
    },
    id: {
      description: "Explicit id used to link label, hint, and error semantics.",
      control: { type: "text" },
      table: { defaultValue: { summary: "required" } },
    },
    hint: {
      description: "Optional helper text appended to aria-describedby.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    error: {
      description:
        "Optional error message that also marks the control invalid.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    required: {
      description: "Shows the required marker next to the label.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    labelClassName: {
      description: "Additional classes merged with the label element.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: {
      expanded: true,
      include: ["label", "id", "hint", "error", "required", "labelClassName"],
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-field-audit-root]"],
      },
    },
  },
} satisfies Meta<FieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <FieldAuditFrame maxWidth="md">
      <FieldExample args={args} childPlaceholder="Ex: 75" />
    </FieldAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <FieldAuditFrame maxWidth="md">
      <fieldset className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          Coordonnees du suivi
        </legend>
        <Field
          hint="Comme sur le dossier partage avec l equipe."
          id="contact-name"
          label="Nom complet"
          required
        >
          <Input placeholder="Ex: Camille Martin" />
        </Field>
        <Field
          hint="Adresse utilisee pour les comptes rendus."
          id="contact-email"
          label="Adresse email"
        >
          <Input placeholder="nom@cabinet.fr" type="email" />
        </Field>
      </fieldset>
    </FieldAuditFrame>
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
    error: "La dose est requise.",
    hint: "Ajoutez la dose qui a ete toleree la semaine precedente.",
    required: true,
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <FieldAuditFrame maxWidth="md">
      <FieldExample
        args={args}
        childAriaDescribedBy="field-existing-note"
        childPlaceholder="Ex: 75"
      />
    </FieldAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='field']");
    const input = canvas.getByLabelText(/Dose test/);
    const error = canvas.getByText("La dose est requise.");
    const hint = canvas.getByText(
      "Ajoutez la dose qui a ete toleree la semaine precedente.",
    );
    const label = canvas.getByText("Dose test");

    await expect(root).toHaveAttribute("data-slot", "field");
    await expect(label).toHaveAttribute("for", "field-playground");
    await expect(input).toHaveAttribute("id", "field-playground");
    await expect(input).toHaveAttribute(
      "aria-describedby",
      "field-existing-note field-playground-hint field-playground-error",
    );
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(hint).toHaveAttribute("id", "field-playground-hint");
    await expect(error).toHaveAttribute("id", "field-playground-error");
    await expect(canvas.getByText("*")).toBeTruthy();
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <FieldAuditFrame maxWidth="sm">
      <Field
        error="Ajoutez une note plus precise pour que la recommandation puisse etre relue correctement sur mobile."
        hint="Cette question sert a decrire la dose exacte et le contexte du repas pour les personnes qui consultent ensuite le journal de suivi."
        id="mobile-dose"
        label="Dose test et contexte du repas observe pendant la premiere semaine"
        required
      >
        <Input placeholder="Ex: 75 g apres le dejeuner" />
      </Field>
    </FieldAuditFrame>
  ),
};
