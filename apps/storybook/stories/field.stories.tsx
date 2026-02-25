import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Field, Input } from "@fodmap/ui";

const meta = {
  title: "Primitives/Field",
  component: Field,
  tags: ["autodocs"],
  args: {
    label: "Champ",
    children: <Input />,
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
    const input = canvas.getByPlaceholderText("ex: 75");
    await userEvent.type(input, "90");
    await expect(input).toHaveValue("90");
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
};

export const DarkModeWithError: Story = {
  ...WithError,
  globals: {
    theme: "dark",
  },
};
