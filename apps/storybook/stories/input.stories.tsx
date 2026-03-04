import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Input } from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      description: "Defines the native input type used for value entry.",
      control: { type: "radio" },
      options: ["text", "email", "password", "search", "number"],
      table: { defaultValue: { summary: "text" } },
    },
    placeholder: {
      description: "Placeholder shown when the input has no value.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    disabled: {
      description:
        "Disables interaction and applies disabled visual state styles.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    "aria-invalid": {
      description:
        "Marks the input as invalid for accessibility and semantic invalid styling.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      description: "Additional CSS classes merged with the input styles.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    onChange: {
      description: "Callback fired when the input value changes.",
    },
  },
  args: {
    type: "text",
    placeholder: "Saisir un aliment",
    disabled: false,
    "aria-invalid": false,
    onChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
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
    await expect(input.className).toContain("focus-visible:border-ring");
    await expect(input.className).toContain("focus-visible:ring-ring-soft");
    await expect(input.className).not.toContain("focus-visible:ring-ring/50");
    await expect(input).toHaveAttribute("data-slot", "input");
  },
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    placeholder: "Valeur invalide",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Valeur invalide");
    await expect(input.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    await expect(input.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
    await expect(input.className).not.toContain(
      "aria-invalid:ring-destructive/20",
    );
    await expect(input).toHaveAttribute("data-slot", "input");
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
