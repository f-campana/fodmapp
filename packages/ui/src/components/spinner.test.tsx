import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("renders status role, default label, and data-slot", () => {
    render(<Spinner />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-slot", "spinner");
    expect(screen.getByText("Chargement")).toBeInTheDocument();
  });

  it("supports size variants", () => {
    render(<Spinner size="lg" label="Chargement long" />);
    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("data-size", "lg");
    expect(status.className).toContain("size-6");
  });

  it("merges className", () => {
    render(<Spinner className="mon-spinner" />);
    expect(screen.getByRole("status").className).toContain("mon-spinner");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Spinner />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
