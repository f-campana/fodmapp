import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("is decorative by default", () => {
    const { container } = render(<Spinner />);

    const spinner = container.querySelector("[data-slot='spinner']");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("supports size variants", () => {
    const { container } = render(<Spinner size="lg" label="Chargement long" />);
    const spinner = container.querySelector("[data-slot='spinner']");

    expect(spinner).toHaveAttribute("data-size", "lg");
    expect(spinner?.className).toContain("size-6");
  });

  it("merges className", () => {
    const { container } = render(<Spinner className="mon-spinner" />);
    expect(
      container.querySelector("[data-slot='spinner']")?.className,
    ).toContain("mon-spinner");
  });

  it("announces status semantics only when requested", () => {
    render(<Spinner announce label="Chargement" />);

    const status = screen.getByRole("status", { name: "Chargement" });
    expect(status).toHaveAttribute("data-slot", "spinner");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("allows the label and live-region politeness to be customized", () => {
    render(
      <Spinner
        announce
        aria-live="assertive"
        label="Synchronisation en cours"
      />,
    );

    expect(
      screen.getByRole("status", { name: "Synchronisation en cours" }),
    ).toHaveAttribute("aria-live", "assertive");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Spinner />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
