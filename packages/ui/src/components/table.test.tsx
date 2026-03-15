import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

describe("Table", () => {
  it("renders semantic sections with a stable wrapper slot hook", () => {
    const { container } = render(
      <Table className="ma-table" data-slot="custom-table">
        <TableCaption data-slot="custom-caption">
          Valeurs nutritionnelles par portion
        </TableCaption>
        <TableHeader data-slot="custom-header">
          <TableRow data-slot="custom-head-row">
            <TableHead data-slot="custom-food-head">Aliment</TableHead>
            <TableHead data-slot="custom-portion-head">Portion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-slot="custom-body">
          <TableRow data-slot="custom-body-row">
            <TableCell data-slot="custom-food-cell">Riz</TableCell>
            <TableCell data-slot="custom-portion-cell">150 g</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-slot="custom-footer">
          <TableRow data-slot="custom-footer-row">
            <TableCell colSpan={2}>2 lignes vérifiées</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    const table = screen.getByRole("table", {
      name: "Valeurs nutritionnelles par portion",
    });
    const wrapper = table.closest("[data-slot='table']");

    expect(table).toBeInTheDocument();
    expect(table.className).toContain("ma-table");
    expect(table).toHaveClass("min-w-full");
    expect(wrapper).toBeTruthy();
    expect(wrapper?.className ?? "").toContain("overflow-x-auto");
    expect(wrapper).toHaveAttribute("tabindex", "0");
    expect(screen.getAllByRole("rowgroup")).toHaveLength(3);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(
      screen.getByRole("columnheader", { name: "Aliment" }),
    ).toHaveAttribute("scope", "col");
    expect(screen.getByRole("cell", { name: "Riz" })).toHaveAttribute(
      "data-slot",
      "table-cell",
    );
    expect(screen.getByText("2 lignes vérifiées")).toHaveTextContent(
      "2 lignes vérifiées",
    );
    expect(
      screen.getByText("Valeurs nutritionnelles par portion"),
    ).toHaveAttribute("data-slot", "table-caption");
    expect(table).toHaveAttribute("data-slot", "custom-table");
    expect(container.querySelector("[data-slot='custom-caption']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-header']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-head-row']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-food-head']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-portion-head']"),
    ).toBeNull();
    expect(container.querySelector("[data-slot='custom-body']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-body-row']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-food-cell']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-portion-cell']"),
    ).toBeNull();
    expect(container.querySelector("[data-slot='custom-footer']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-footer-row']"),
    ).toBeNull();
  });

  it("forwards refs to the underlying table element", () => {
    const ref = createRef<HTMLTableElement>();

    render(<Table ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLTableElement);
    expect(ref.current?.closest("[data-slot='table']")).toBeTruthy();
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
