import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("renders with native label association and placeholder", () => {
    render(
      <>
        <label htmlFor="ingredient-search">Recherche</label>
        <Input id="ingredient-search" placeholder="Rechercher" />
      </>,
    );

    expect(
      screen.getByRole("textbox", { name: "Recherche" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Rechercher")).toBeInTheDocument();
  });

  it("supports native invalid state through aria-invalid", () => {
    render(<Input aria-invalid="true" placeholder="Email" />);
    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    expect(input.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  });

  it("keeps the internal data-slot stable when consumer props collide", () => {
    render(<Input aria-label="Mot-clé" data-slot="custom-input" />);

    expect(screen.getByRole("textbox", { name: "Mot-clé" })).toHaveAttribute(
      "data-slot",
      "input",
    );
  });

  it("applies disabled cursor treatment without removing semantics", () => {
    render(<Input aria-label="Nom" disabled />);

    const input = screen.getByRole("textbox", { name: "Nom" });
    expect(input).toBeDisabled();
    expect(input.className).toContain("disabled:cursor-not-allowed");
  });

  it("forwards ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Recherche" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("exposes data-slot for parent context styling", () => {
    render(<Input aria-label="Mot-clé" />);
    expect(screen.getByRole("textbox", { name: "Mot-clé" })).toHaveAttribute(
      "data-slot",
      "input",
    );
  });

  it("merges consumer className", () => {
    render(<Input aria-label="Email" className="custom-input" />);

    expect(screen.getByRole("textbox", { name: "Email" }).className).toContain(
      "custom-input",
    );
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Input aria-label="Nom" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
