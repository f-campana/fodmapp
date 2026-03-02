import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("renders and supports placeholder", () => {
    render(<Input placeholder="Rechercher" />);
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

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Input aria-label="Nom" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
