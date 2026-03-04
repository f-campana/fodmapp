import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Alert, AlertDescription, AlertTitle } from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Controls neutral or destructive alert styling.",
      control: { type: "radio" },
      options: ["default", "destructive"],
      table: { defaultValue: { summary: "default" } },
    },
    className: {
      description: "Additional classes merged with root alert classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Content displayed inside the alert container.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    variant: "default",
    children: "Information importante",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveAttribute("data-slot", "alert");
    await expect(alert.className).toContain("border-border");
    await expect(alert.className).toContain("bg-card");
    await expect(alert.className).toContain("text-card-foreground");
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Erreur critique",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveAttribute("data-variant", "destructive");
    await expect(alert.className).toContain("border-destructive");
    await expect(alert.className).toContain("bg-destructive");
    await expect(alert.className).toContain("text-destructive-foreground");
  },
};

export const WithTitleAndDescription: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Attention</AlertTitle>
      <AlertDescription>
        Une vérification manuelle est recommandée avant validation.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Attention")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
    await expect(
      canvas.getByText(
        "Une vérification manuelle est recommandée avant validation.",
      ),
    ).toHaveAttribute("data-slot", "alert-description");
  },
};

export const DarkMode: Story = {
  ...WithTitleAndDescription,
  globals: {
    theme: "dark",
  },
};
