import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Typography } from "@fodmap/ui";

const meta = {
  title: "Primitives/Typography",
  component: Typography,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Selects semantic text style and default rendered element.",
      control: { type: "radio" },
      options: [
        "h1",
        "h2",
        "h3",
        "h4",
        "p",
        "blockquote",
        "code",
        "lead",
        "muted",
      ],
      table: { defaultValue: { summary: "p" } },
    },
    asChild: {
      description: "Delegates rendering to a child element via Radix Slot.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      description:
        "Text or inline content rendered by the typography component.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      description: "Additional classes merged with variant typography classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    variant: "p",
    asChild: false,
    children: "Texte de démonstration",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Paragraph: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByText("Texte de démonstration");
    await expect(text.tagName).toBe("P");
    await expect(text).toHaveAttribute("data-slot", "typography");
    await expect(text).toHaveAttribute("data-variant", "p");
    await expect(text.className).toContain("text-base");
  },
};

export const HeadingOne: Story = {
  args: {
    variant: "h1",
    children: "Titre principal",
  },
};

export const HeadingTwo: Story = {
  args: {
    variant: "h2",
    children: "Sous-titre majeur",
  },
};

export const HeadingThree: Story = {
  args: {
    variant: "h3",
    children: "Sous-titre",
  },
};

export const HeadingFour: Story = {
  args: {
    variant: "h4",
    children: "Section",
  },
};

export const Blockquote: Story = {
  args: {
    variant: "blockquote",
    children: "La rigueur transforme la qualité en habitude.",
  },
};

export const Code: Story = {
  args: {
    variant: "code",
    children: "pnpm --filter @fodmap/ui test",
  },
};

export const Lead: Story = {
  args: {
    variant: "lead",
    children: "Introduction synthétique pour orienter la lecture.",
  },
};

export const Muted: Story = {
  args: {
    variant: "muted",
    children: "Information secondaire en soutien du contenu principal.",
  },
};

export const AsChildLink: Story = {
  args: {
    asChild: true,
    variant: "h4",
    children: undefined,
  },
  render: (args) => (
    <Typography {...args} asChild>
      <a href="/guides">Consulter le guide</a>
    </Typography>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Consulter le guide" });
    await expect(link).toHaveAttribute("href", "/guides");
    await expect(link).toHaveAttribute("data-slot", "typography");
    await expect(link).toHaveAttribute("data-variant", "h4");
  },
};

export const DarkMode: Story = {
  args: {
    variant: "h2",
    children: "Lecture en mode sombre",
  },
  globals: {
    theme: "dark",
  },
};
