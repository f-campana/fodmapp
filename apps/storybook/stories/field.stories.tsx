import React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import { Field, Input } from "@fodmap/ui";

const meta = {
  title: "Primitives/Field",
  component: Field,
  tags: ["autodocs"],
  argTypes: {
    label: {
      description: "Label text associated with the wrapped control.",
      control: "text",
      table: { defaultValue: { summary: "required" } },
    },
    id: {
      description:
        "Optional explicit control id used to bind label, hint, and error semantics.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    hint: {
      description: "Optional helper text rendered under the control.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    error: {
      description:
        "Optional error message; when provided, the control is marked aria-invalid.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    required: {
      description: "Displays a required marker next to the label.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      description: "Additional classes applied to the root field container.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    labelClassName: {
      description: "Additional classes applied to the field label element.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "A single form control element wrapped by the field.",
      control: false,
      table: { type: { summary: "ReactElement" } },
    },
  },
  args: {
    label: "Champ",
    id: "champ",
    hint: undefined,
    error: undefined,
    required: false,
    className: undefined,
    labelClassName: undefined,
    children: <Input id="champ" />,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithHint: Story = {
  render: () => (
    <div style={{ width: 340 }}>
      <Field
        id="serving-size"
        label="Portion"
        hint="Valeur recommandée en grammes"
      >
        <Input placeholder="ex: 75" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Portion");
    const input = canvas.getByPlaceholderText("ex: 75");
    const hint = canvas.getByText("Valeur recommandée en grammes");
    await userEvent.type(input, "90");
    await expect(input).toHaveValue("90");
    await expect(label).toHaveAttribute("for", "serving-size");
    await expect(input).toHaveAttribute("id", "serving-size");
    await expect(hint).toHaveAttribute("id", "serving-size-hint");
    await expect(input).toHaveAttribute(
      "aria-describedby",
      "serving-size-hint",
    );
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(input.closest("[data-slot='field']")).toBeTruthy();
  },
};

export const WithError: Story = {
  render: () => (
    <div style={{ width: 340 }}>
      <Field id="email" label="Adresse email" error="Format invalide" required>
        <Input placeholder="nom@domaine.fr" />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Adresse email");
    const input = canvas.getByPlaceholderText("nom@domaine.fr");
    const error = canvas.getByText("Format invalide");

    await expect(label).toHaveAttribute("for", "email");
    await expect(input).toHaveAttribute("id", "email");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", "email-error");
    await expect(error).toHaveAttribute("id", "email-error");
    await expect(error.className).toContain("text-validation-error-text");
    await expect(input.closest("[data-slot='field']")).toBeTruthy();
  },
};

export const DarkModeWithError: Story = {
  ...WithError,
  globals: {
    theme: "dark",
  },
};
