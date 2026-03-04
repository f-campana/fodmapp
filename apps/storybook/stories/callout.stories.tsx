import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Callout,
  CalloutDescription,
  CalloutIcon,
  CalloutTitle,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Callout",
  component: Callout,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description:
        "Selects the semantic notice style for persistent guidance blocks.",
      control: { type: "radio" },
      options: ["info", "caution", "warning", "danger", "tip"],
      table: { defaultValue: { summary: "info" } },
    },
    className: {
      description: "Additional classes merged with the callout root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Compound content for icon, title, and description.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    variant: "info",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Callout>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderCallout(
  variant: "info" | "caution" | "warning" | "danger" | "tip",
) {
  return (
    <Callout variant={variant}>
      <CalloutIcon>i</CalloutIcon>
      <CalloutTitle>Conseil nutritionnel</CalloutTitle>
      <CalloutDescription>
        Ajustez les quantités selon votre tolérance personnelle.
      </CalloutDescription>
    </Callout>
  );
}

export const Info: Story = {
  render: () => renderCallout("info"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Conseil nutritionnel")
      .closest("[data-slot='callout']");

    await expect(root).toHaveAttribute("data-variant", "info");
    await expect(root?.className ?? "").toContain("bg-info");
    await expect(root?.className ?? "").toContain("text-info-foreground");
    await expect(canvas.getByText("i")).toHaveAttribute(
      "data-slot",
      "callout-icon",
    );
  },
};

export const Caution: Story = {
  render: () => renderCallout("caution"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Conseil nutritionnel")
      .closest("[data-slot='callout']");

    await expect(root).toHaveAttribute("data-variant", "caution");
    await expect(root?.className ?? "").toContain("border-warning");
    await expect(root?.className ?? "").toContain("bg-background");
  },
};

export const Warning: Story = {
  render: () => renderCallout("warning"),
};

export const Danger: Story = {
  render: () => renderCallout("danger"),
};

export const Tip: Story = {
  render: () => renderCallout("tip"),
};

export const DarkMode: Story = {
  ...Info,
  globals: {
    theme: "dark",
  },
};
