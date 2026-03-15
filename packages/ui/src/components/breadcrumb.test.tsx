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
  it("renders ordered navigation semantics with the current page marked", () => {
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
    expect(screen.getByRole("list")).toHaveAttribute(
      "data-slot",
      "breadcrumb-list",
    );
    expect(screen.getByText("Accueil")).toHaveAttribute(
      "data-slot",
      "breadcrumb-link",
    );
    expect(screen.getByText("Recettes")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("link", { name: "Recettes" }),
    ).not.toBeInTheDocument();
  });

  it("supports a custom landmark label and asChild links", () => {
    render(
      <Breadcrumb aria-label="Chemin de navigation">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="/profil">Profil</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(
      screen.getByRole("navigation", { name: "Chemin de navigation" }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Profil" });
    expect(link).toHaveAttribute("href", "/profil");
    expect(link).toHaveAttribute("data-slot", "breadcrumb-link");
  });

  it("renders separator and collapsed-level hints", () => {
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
    expect(
      screen.getByLabelText("Niveaux intermédiaires masqués"),
    ).toHaveAttribute("data-slot", "breadcrumb-ellipsis");
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
