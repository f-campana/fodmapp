import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description: "Additional classes merged with the table element.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description:
        "Native table sections and rows rendered inside the wrapper.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Repas type de la semaine</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Jour</TableHead>
          <TableHead>Plat</TableHead>
          <TableHead>Portion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Lundi</TableCell>
          <TableCell>Riz basmati</TableCell>
          <TableCell>150 g</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Mardi</TableCell>
          <TableCell>Quinoa</TableCell>
          <TableCell>120 g</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table");
    const wrapper = table.closest("[data-slot='table']");

    await expect(wrapper).toBeTruthy();
    await expect(canvas.getByText("Jour")).toHaveAttribute(
      "data-slot",
      "table-head",
    );
    await expect(canvas.getByText("Lundi")).toHaveAttribute(
      "data-slot",
      "table-cell",
    );
    await expect(canvas.getByText("Repas type de la semaine")).toHaveAttribute(
      "data-slot",
      "table-caption",
    );
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
