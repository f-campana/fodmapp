import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@fodmapp/ui/table";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function TableAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-table-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const swapRows = [
  {
    coverage: "0.84",
    currentFood: "Greek yogurt",
    portion: "125 g",
    reviewDate: "2026-03-12",
    safety: "0.92",
    suggestedSwap: "Unsweetened coconut yogurt",
  },
  {
    coverage: "0.79",
    currentFood: "Garlic oil dressing",
    portion: "1 tbsp",
    reviewDate: "2026-03-10",
    safety: "0.88",
    suggestedSwap: "Chive and lemon dressing",
  },
  {
    coverage: "0.76",
    currentFood: "Wheat crackers",
    portion: "30 g",
    reviewDate: "2026-03-09",
    safety: "0.81",
    suggestedSwap: "Rice crackers",
  },
] as const;

function SwapReviewTable({ compact }: { compact?: boolean }) {
  return (
    <Table className={compact ? "min-w-[44rem]" : undefined}>
      <TableCaption>Reviewed breakfast swap candidates</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Current food</TableHead>
          <TableHead>Suggested swap</TableHead>
          <TableHead>Portion</TableHead>
          <TableHead>Safety score</TableHead>
          <TableHead>Coverage</TableHead>
          <TableHead>Last review</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {swapRows.map((row) => (
          <TableRow key={row.currentFood}>
            <TableCell className="font-medium text-foreground">
              {row.currentFood}
            </TableCell>
            <TableCell>{row.suggestedSwap}</TableCell>
            <TableCell>{row.portion}</TableCell>
            <TableCell>{row.safety}</TableCell>
            <TableCell>{row.coverage}</TableCell>
            <TableCell>{row.reviewDate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>3 active swaps ready for comparison</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

const meta = {
  title: "Primitives/Foundation/Table",
  component: Table,
  parameters: {
    controls: { disable: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-table-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TableAuditFrame maxWidth="3xl" surface>
      <SwapReviewTable />
    </TableAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", {
      name: "Reviewed breakfast swap candidates",
    });

    await expect(table.closest("[data-slot='table']")).toBeTruthy();
    await expect(canvas.getAllByRole("rowgroup")).toHaveLength(3);
    await expect(
      canvas.getByRole("columnheader", { name: "Current food" }),
    ).toHaveAttribute("scope", "col");
    await expect(
      canvas.getByText("3 active swaps ready for comparison"),
    ).toBeInTheDocument();
  },
};

export const ResponsiveStress: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TableAuditFrame maxWidth="sm" surface>
      <SwapReviewTable compact />
    </TableAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.querySelector(
      "[data-slot='table']",
    ) as HTMLDivElement | null;
    const table = canvasElement.querySelector(
      "table",
    ) as HTMLTableElement | null;

    if (!wrapper || !table) {
      throw new Error(
        "Table stress example did not render the expected nodes.",
      );
    }

    const wrapperRect = wrapper.getBoundingClientRect();

    await expect(wrapper.className).toContain("overflow-x-auto");
    await expect(table.className).toContain("min-w-[44rem]");

    if (wrapper.scrollWidth <= wrapper.clientWidth) {
      throw new Error(
        "Responsive stress case did not trigger horizontal overflow.",
      );
    }

    if (wrapperRect.width > 420) {
      throw new Error(
        "Responsive stress harness is wider than the compact target.",
      );
    }
  },
};
