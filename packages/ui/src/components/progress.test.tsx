import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Progress } from "./progress";

describe("Progress", () => {
  it("renders progressbar semantics", () => {
    render(<Progress value={60} aria-label="Progression" />);

    const progress = screen.getByRole("progressbar", { name: "Progression" });
    expect(progress).toHaveAttribute("data-slot", "progress");
    expect(progress).toHaveAttribute("aria-valuenow", "60");
  });

  it("updates indicator transform from value", () => {
    render(<Progress value={60} aria-label="Charge" />);

    const indicator =
      screen
        .getByRole("progressbar", { name: "Charge" })
        .querySelector("[data-slot='progress-indicator']") ?? undefined;

    expect(indicator).toHaveAttribute("data-slot", "progress-indicator");
    expect(indicator).toHaveStyle({ transform: "translateX(-40%)" });
  });

  it("clamps out-of-range values", () => {
    const { rerender } = render(<Progress value={-20} aria-label="Niveau" />);

    expect(screen.getByRole("progressbar", { name: "Niveau" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    rerender(<Progress value={140} aria-label="Niveau" />);

    expect(screen.getByRole("progressbar", { name: "Niveau" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("merges className", () => {
    render(
      <Progress value={10} aria-label="État" className="ma-progression" />,
    );

    expect(
      screen.getByRole("progressbar", { name: "État" }).className,
    ).toContain("ma-progression");
  });

  it("forwards ref to progress root", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Progress ref={ref} value={30} aria-label="Ref" />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Progress value={45} aria-label="Chargement" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
