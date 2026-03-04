import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description:
        "Additional classes merged with the pagination navigation root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Pagination content, links, and controls composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Pagination {...args}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Pagination" });
    const active = canvas.getByRole("link", { name: "1" });

    await expect(nav).toHaveAttribute("data-slot", "pagination");
    await expect(active).toHaveAttribute("aria-current", "page");
    await expect(active.className).toContain("border-outline-border");
    await expect(
      canvas.getByRole("link", { name: "Précédent" }),
    ).toHaveAttribute("data-slot", "pagination-link");
  },
};

export const WithEllipsis: Story = {
  render: (args) => (
    <Pagination {...args}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">10</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("…")).toHaveAttribute(
      "data-slot",
      "pagination-ellipsis",
    );
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
