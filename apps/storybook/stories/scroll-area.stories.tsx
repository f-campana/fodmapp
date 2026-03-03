import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { ScrollArea } from "@fodmap/ui";

const meta = {
  title: "Primitives/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description: "Additional classes merged with scroll area root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Scrollable content rendered inside the viewport.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

function listItems() {
  return Array.from({ length: 20 }, (_, index) => (
    <div
      className="rounded-(--radius-sm) border border-border bg-card px-3 py-2 text-sm"
      key={index}
    >
      Option {index + 1}
    </div>
  ));
}

export const Default: Story = {
  render: (args) => (
    <ScrollArea
      {...args}
      className="h-56 w-72 rounded-(--radius) border border-border bg-background p-3"
    >
      <div className="space-y-2">{listItems()}</div>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvas.getByText("Option 1");
    const root = item.closest("[data-slot='scroll-area']");
    const viewport = item.closest("[data-slot='scroll-area-viewport']");

    await expect(root).toHaveAttribute("data-slot", "scroll-area");
    await expect(viewport).toHaveAttribute("data-slot", "scroll-area-viewport");

    const scrollbar = root?.querySelector(
      "[data-slot='scroll-area-scrollbar']",
    );
    const thumb = root?.querySelector("[data-slot='scroll-area-thumb']");

    await expect(scrollbar).toHaveAttribute(
      "data-slot",
      "scroll-area-scrollbar",
    );
    await expect(thumb).toHaveAttribute("data-slot", "scroll-area-thumb");
    await expect(thumb?.className ?? "").toContain("bg-border");
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
