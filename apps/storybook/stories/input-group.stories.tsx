import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@fodmap/ui";

const meta = {
  title: "Composed/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description: "Additional classes merged with input group root styles.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "InputGroup compound composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    className: undefined,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <InputGroup {...args}>
        <InputGroupText>https://</InputGroupText>
        <InputGroupInput placeholder="mon-profil" />
        <InputGroupAddon>.fodmap.app</InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='input-group']");
    const input = canvas.getByPlaceholderText("mon-profil");

    await expect(root).toHaveAttribute("data-slot", "input-group");
    await expect(input).toHaveAttribute("data-slot", "input-group-input");
    await expect(root?.className ?? "").toContain("border-input");
    await expect(root?.className ?? "").toContain(
      "focus-within:ring-ring-soft",
    );
    await expect(root?.className ?? "").toContain("has-[:disabled]:opacity-50");
    await expect(input.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
  },
};

export const WithTextAddons: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <InputGroup {...args}>
        <InputGroupAddon>Portion</InputGroupAddon>
        <InputGroupInput placeholder="75" />
        <InputGroupText>g</InputGroupText>
      </InputGroup>
    </div>
  ),
};

export const WithButtonAddon: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <InputGroup {...args}>
        <InputGroupInput placeholder="Ajouter un aliment" />
        <InputGroupButton onClick={fn()}>Ajouter</InputGroupButton>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Ajouter" });

    await userEvent.click(button);

    await expect(button).toHaveAttribute("data-slot", "input-group-button");
    await expect(button.className).toContain("focus-visible:ring-ring-soft");
    await expect(button.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const InvalidAndDisabled: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <InputGroup {...args}>
        <InputGroupText className="text-foreground">Code</InputGroupText>
        <InputGroupInput aria-invalid disabled placeholder="0000" />
      </InputGroup>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: false }],
      },
    },
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
