import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Label, Switch } from "@fodmap/ui";

const meta = {
  title: "Primitives/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    defaultChecked: {
      description: "Sets initial checked state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables interaction and applies disabled styles.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    "aria-invalid": {
      description: "Applies semantic invalid styling tokens.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onCheckedChange: {
      description: "Callback invoked when switch state changes.",
    },
    className: {
      description: "Additional classes merged with switch classes.",
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
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="notifications" aria-label="Notifications" />
      <Label htmlFor="notifications">Notifications</Label>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Notifications" });

    await userEvent.click(control);
    await expect(args.onCheckedChange).toHaveBeenCalled();

    await expect(control).toHaveAttribute("data-slot", "switch");
    await expect(
      control.querySelector("[data-slot='switch-thumb']"),
    ).toBeTruthy();
    await expect(control.className).toContain("focus-visible:border-ring");
    await expect(control.className).toContain("focus-visible:ring-ring-soft");
    await expect(control.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="suivi" aria-label="Suivi" />
      <Label htmlFor="suivi">Suivi activé</Label>
    </div>
  ),
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="erreur" aria-label="Erreur" />
      <Label htmlFor="erreur">État invalide</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Erreur" });

    await expect(control.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    await expect(control.className).toContain(
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
      <Switch {...args} id="desactive" aria-label="Désactivé" />
      <Label htmlFor="desactive">Interrupteur désactivé</Label>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Désactivé" });

    await expect(control).toBeDisabled();
    control.click();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
