import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { NativeSelect } from "@fodmap/ui";

const meta = {
  title: "Primitives/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      description:
        "Sets the initial selected option value for uncontrolled usage.",
      control: "text",
      table: { defaultValue: { summary: "riz" } },
    },
    disabled: {
      description:
        "Disables native select interactions and applies disabled styles.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    "aria-invalid": {
      description:
        "Marks select as invalid for semantic invalid token styling.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      description: "Additional classes merged with select classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    onChange: {
      description: "Callback invoked when selected option changes.",
    },
    children: {
      description: "Native option elements rendered by the select control.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultValue: "riz",
    disabled: false,
    "aria-invalid": false,
    onChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof NativeSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

function options() {
  return (
    <>
      <option value="riz">Riz</option>
      <option value="avoine">Avoine</option>
      <option value="quinoa">Quinoa</option>
    </>
  );
}

export const Default: Story = {
  render: (args) => (
    <NativeSelect {...args} aria-label="Céréale">
      {options()}
    </NativeSelect>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox", { name: "Céréale" });
    await userEvent.selectOptions(select, "avoine");
    await expect(select).toHaveValue("avoine");
    await expect(select).toHaveAttribute("data-slot", "native-select");
    await expect(select.className).toContain("focus-visible:border-ring");
    await expect(select.className).toContain("focus-visible:ring-ring-soft");
    await expect(select.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
  },
  render: (args) => (
    <NativeSelect {...args} aria-label="Choix invalide">
      {options()}
    </NativeSelect>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox", { name: "Choix invalide" });
    await expect(select.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    await expect(select.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <NativeSelect {...args} aria-label="Désactivé">
      {options()}
    </NativeSelect>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
