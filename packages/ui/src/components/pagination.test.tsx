import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

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
  it("renders navigation semantics and active-page state", () => {
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
    const active = screen.getByRole("link", { name: "1" });

    expect(nav).toHaveAttribute("data-slot", "pagination");
    expect(screen.getByRole("list")).toHaveAttribute(
      "data-slot",
      "pagination-content",
    );
    expect(active).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
      "data-slot",
      "pagination-link",
    );
    expect(screen.getByRole("link", { name: "Suivant" })).toHaveAttribute(
      "data-slot",
      "pagination-link",
    );
  });

  it("supports disabled previous and next controls without fake navigation", () => {
    const onPreviousClick = vi.fn();

    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled
              href="/page/1"
              onClick={onPreviousClick}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext disabled />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const previous = screen.getByRole("link", { name: "Précédent" });
    const next = screen.getByRole("link", { name: "Suivant" });
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    previous.dispatchEvent(clickEvent);

    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(previous).toHaveAttribute("tabindex", "-1");
    expect(previous).toHaveAttribute("data-disabled", "true");
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).toHaveAttribute("tabindex", "-1");
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(onPreviousClick).not.toHaveBeenCalled();
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

  it("renders ellipsis and focus-visible contract hooks", () => {
    const { rerender } = render(<PaginationEllipsis />);

    expect(
      screen.getByLabelText("Pages intermédiaires masquées"),
    ).toHaveAttribute("data-slot", "pagination-ellipsis");

    rerender(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/3">3</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    expect(screen.getByRole("link", { name: "3" }).className).toContain(
      "focus-visible:ring-2",
    );
  });

  it("forwards refs to the navigation root", () => {
    const ref = createRef<HTMLElement>();

    render(<Pagination ref={ref}>Pages</Pagination>);

    expect(ref.current?.tagName).toBe("NAV");
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
