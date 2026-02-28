import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import { Input } from "@fodmap/ui";

const meta = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "Saisir un aliment",
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Saisir un aliment");
    await userEvent.type(input, "courgette");
    await expect(input).toHaveValue("courgette");
    await expect(input.className).toContain(
      "focus-visible:ring-ring-accessible",
    );
    await expect(input.className).not.toContain("focus-visible:ring-ring-soft");
  },
};

export const Invalid: Story = {
  args: {
    "aria-invalid": "true",
    placeholder: "Valeur invalide",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Saisie indisponible",
  },
};

export const DarkMode: Story = {
  args: {
    placeholder: "Recherche nocturne",
  },
  globals: {
    theme: "dark",
  },
};
