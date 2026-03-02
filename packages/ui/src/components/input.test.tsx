import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("renders and supports placeholder", () => {
    render(<Input aria-label="Recherche" placeholder="Rechercher" />);
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

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Input aria-label="Nom" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
