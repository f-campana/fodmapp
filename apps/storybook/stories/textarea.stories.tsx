import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Textarea } from "@fodmap/ui";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      description: "Placeholder displayed while the textarea is empty.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    rows: {
      description: "Initial number of visible text rows.",
      control: { type: "number", min: 2, max: 12, step: 1 },
      table: { defaultValue: { summary: "3" } },
    },
    disabled: {
      description: "Disables editing and applies disabled style semantics.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    "aria-invalid": {
      description:
        "Marks textarea invalid for semantic validation token styles.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      description: "Additional classes merged with textarea classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    onChange: {
      description: "Callback invoked when textarea value changes.",
    },
  },
  args: {
    placeholder: "Ajouter un commentaire",
    rows: 3,
    disabled: false,
    "aria-invalid": false,
    onChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Textarea {...args} aria-label="Commentaire" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Commentaire" });

    await userEvent.type(textarea, "Sans ail ni oignon.");
    await expect(textarea).toHaveValue("Sans ail ni oignon.");
    await expect(textarea).toHaveAttribute("data-slot", "textarea");
    await expect(textarea.className).toContain("focus-visible:border-ring");
    await expect(textarea.className).toContain("focus-visible:ring-ring-soft");
    await expect(textarea.className).not.toContain(
      "focus-visible:ring-ring/50",
    );
  },
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
  },
  render: (args) => <Textarea {...args} aria-label="Champ invalide" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Champ invalide" });

    await expect(textarea.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    await expect(textarea.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <Textarea {...args} aria-label="Désactivé" />,
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
