import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Stepper,
  StepperDescription,
  StepperLabel,
  StepperSeparator,
  StepperStep,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      description:
        "Controls horizontal or vertical layout of the step sequence.",
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    className: {
      description: "Additional classes merged with the stepper root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "StepperStep and StepperSeparator compound composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    orientation: "horizontal",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

function baseStepper(orientation: "horizontal" | "vertical") {
  return (
    <Stepper orientation={orientation}>
      <StepperStep status="completed" step="1">
        <StepperLabel>Sélection</StepperLabel>
        <StepperDescription>Ingrédients choisis</StepperDescription>
      </StepperStep>
      <StepperSeparator orientation={orientation} />
      <StepperStep status="current" step="2">
        <StepperLabel>Préparation</StepperLabel>
        <StepperDescription>Recette en cours</StepperDescription>
      </StepperStep>
      <StepperSeparator orientation={orientation} />
      <StepperStep status="upcoming" step="3">
        <StepperLabel>Validation</StepperLabel>
        <StepperDescription>Dernière vérification</StepperDescription>
      </StepperStep>
    </Stepper>
  );
}

export const Horizontal: Story = {
  render: (args) => baseStepper(args.orientation ?? "horizontal"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByText("Sélection").closest("[data-slot='stepper']");
    await expect(root).toHaveAttribute("data-orientation", "horizontal");

    const marker = canvas
      .getByText("1")
      .closest("[data-slot='stepper-marker']");
    await expect(marker?.className ?? "").toContain("bg-success");

    const step = canvas
      .getByText("Préparation")
      .closest("[data-slot='stepper-step']");
    await expect(step).toHaveAttribute("data-status", "current");
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => baseStepper(args.orientation ?? "vertical"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Validation")
      .closest("[data-slot='stepper']");
    await expect(root).toHaveAttribute("data-orientation", "vertical");
  },
};

export const Statuses: Story = {
  render: () => (
    <Stepper orientation="horizontal">
      <StepperStep status="completed" step="✓">
        <StepperLabel>Terminée</StepperLabel>
      </StepperStep>
      <StepperSeparator orientation="horizontal" />
      <StepperStep status="current" step="2">
        <StepperLabel>Actuelle</StepperLabel>
      </StepperStep>
      <StepperSeparator orientation="horizontal" />
      <StepperStep status="skipped" step="–">
        <StepperLabel>Ignorée</StepperLabel>
      </StepperStep>
    </Stepper>
  ),
};

export const DarkMode: Story = {
  ...Horizontal,
  globals: {
    theme: "dark",
  },
};
