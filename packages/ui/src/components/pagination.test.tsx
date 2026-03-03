import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

describe("Pagination", () => {
  it("renders navigation semantics and slot contract", () => {
    render(
      <Pagination>
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
      </Pagination>,
    );

    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).toHaveAttribute("data-slot", "pagination");
    expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
      "data-slot",
      "pagination-link",
    );
    expect(screen.getByRole("link", { name: "Suivant" })).toHaveAttribute(
      "data-slot",
      "pagination-link",
    );
  });

  it("applies active link semantics", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              3
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const active = screen.getByRole("link", { name: "3" });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active.className).toContain("border-outline-border");
  });

  it("supports asChild links", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink asChild>
              <a href="/page/4">4</a>
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const link = screen.getByRole("link", { name: "4" });
    expect(link).toHaveAttribute("href", "/page/4");
    expect(link).toHaveAttribute("data-slot", "pagination-link");
  });

  it("renders ellipsis slot", () => {
    render(<PaginationEllipsis />);
    expect(screen.getByText("…")).toHaveAttribute(
      "data-slot",
      "pagination-ellipsis",
    );
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Pagination>
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
            <PaginationNext />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
