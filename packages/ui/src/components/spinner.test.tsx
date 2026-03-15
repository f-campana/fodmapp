import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("renders status semantics with the default accessible label", () => {
    render(<Spinner />);

    const status = screen.getByRole("status", { name: "Chargement" });
    expect(status).toHaveAttribute("data-slot", "spinner");
    expect(status).toHaveAttribute("aria-live", "polite");
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

  it("allows the label and live-region politeness to be customized", () => {
    render(<Spinner aria-live="assertive" label="Synchronisation en cours" />);

    expect(
      screen.getByRole("status", { name: "Synchronisation en cours" }),
    ).toHaveAttribute("aria-live", "assertive");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Spinner />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
