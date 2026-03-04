import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Checkbox, Label } from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    defaultChecked: {
      description: "Sets initial checked state for uncontrolled usage.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables interaction and applies disabled styling.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    "aria-invalid": {
      description: "Applies semantic invalid styling tokens.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onCheckedChange: {
      description: "Callback invoked when checked state changes.",
    },
    className: {
      description: "Additional classes merged with checkbox classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    defaultChecked: false,
    disabled: false,
    "aria-invalid": false,
    onCheckedChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox
        {...args}
        id="conditions"
        aria-label="J'accepte les conditions"
      />
      <Label htmlFor="conditions">J'accepte les conditions</Label>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", {
      name: "J'accepte les conditions",
    });

    await userEvent.click(checkbox);
    await expect(args.onCheckedChange).toHaveBeenCalled();

    await expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    await expect(checkbox.className).toContain("focus-visible:border-ring");
    await expect(checkbox.className).toContain("focus-visible:ring-ring-soft");
    await expect(checkbox.className).not.toContain(
      "focus-visible:ring-ring/50",
    );
  },
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="newsletter" aria-label="Newsletter" />
      <Label htmlFor="newsletter">Recevoir la newsletter</Label>
    </div>
  ),
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="invalide" aria-label="Invalide" />
      <Label htmlFor="invalide">Option invalide</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Invalide" });

    await expect(checkbox.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    await expect(checkbox.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onCheckedChange: fn(),
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="desactive" aria-label="Désactivé" />
      <Label htmlFor="desactive">Case désactivée</Label>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Désactivé" });

    await expect(checkbox).toBeDisabled();
    checkbox.click();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
