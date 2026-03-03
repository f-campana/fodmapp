import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

describe("Table", () => {
  it("renders table semantics and slot contract", () => {
    render(
      <Table>
        <TableCaption>Valeurs nutritionnelles</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Aliment</TableHead>
            <TableHead>Portion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Riz</TableCell>
            <TableCell>150 g</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("table").closest("[data-slot='table']"),
    ).toBeTruthy();
    expect(screen.getByText("Valeurs nutritionnelles")).toHaveAttribute(
      "data-slot",
      "table-caption",
    );
    expect(screen.getByText("Aliment")).toHaveAttribute(
      "data-slot",
      "table-head",
    );
    expect(screen.getByText("Riz")).toHaveAttribute("data-slot", "table-cell");
  });

  it("merges className on table element", () => {
    render(<Table className="ma-table" />);
    expect(screen.getByRole("table").className).toContain("ma-table");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Poivron</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
