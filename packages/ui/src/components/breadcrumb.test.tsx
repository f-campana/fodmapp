import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

describe("Breadcrumb", () => {
  it("renders navigation semantics with default label", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Recettes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    const nav = screen.getByRole("navigation", { name: "Fil d'Ariane" });
    expect(nav).toHaveAttribute("data-slot", "breadcrumb");
    expect(screen.getByText("Accueil")).toHaveAttribute(
      "data-slot",
      "breadcrumb-link",
    );
    expect(screen.getByText("Recettes")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("supports asChild links", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="/profil">Profil</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    const link = screen.getByRole("link", { name: "Profil" });
    expect(link).toHaveAttribute("href", "/profil");
    expect(link).toHaveAttribute("data-slot", "breadcrumb-link");
  });

  it("renders separator and ellipsis presentation slots", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByText("/")).toHaveAttribute(
      "data-slot",
      "breadcrumb-separator",
    );
    expect(screen.getByText("Plus")).toBeInTheDocument();
  });

  it("forwards ref to nav element", () => {
    const ref = createRef<HTMLElement>();
    render(<Breadcrumb ref={ref}>Contenu</Breadcrumb>);
    expect(ref.current?.tagName).toBe("NAV");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Détails</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
