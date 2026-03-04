import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Avatar, AvatarFallback, AvatarImage } from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description: "Additional classes merged with avatar root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "AvatarImage and AvatarFallback compound composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    className: "size-12",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Fallback: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>FC</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fallback = canvas.getByText("FC");
    const root = fallback.closest("[data-slot='avatar']");

    await expect(root).toHaveAttribute("data-slot", "avatar");
    await expect(fallback).toHaveAttribute("data-slot", "avatar-fallback");
    await expect(fallback.className).toContain("bg-muted");
    await expect(fallback.className).toContain("text-muted-foreground");
  },
};

export const WithImage: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage
        alt="Photo de profil"
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
      />
      <AvatarFallback>PF</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = await canvas.findByRole("img", { name: "Photo de profil" });

    await expect(image).toHaveAttribute("data-slot", "avatar-image");
  },
};

export const DarkMode: Story = {
  ...Fallback,
  globals: {
    theme: "dark",
  },
};
