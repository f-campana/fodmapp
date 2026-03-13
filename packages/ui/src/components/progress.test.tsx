import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Progress } from "./progress";

describe("Progress", () => {
  it("keeps root and indicator slots stable", () => {
    const { container } = render(
      <Progress data-slot="custom-progress" value={60} aria-label="Progress" />,
    );

    const progress = screen.getByRole("progressbar", { name: "Progress" });
    const indicator = progress.querySelector(
      "[data-slot='progress-indicator']",
    );

    expect(progress).toHaveAttribute("data-slot", "progress");
    expect(progress).toHaveAttribute("aria-valuenow", "60");
    expect(indicator).toHaveAttribute("data-slot", "progress-indicator");
    expect(container.querySelector("[data-slot='custom-progress']")).toBeNull();
  });

  it("updates the indicator transform from the current value", () => {
    render(<Progress value={60} aria-label="Charge" />);

    expect(
      screen
        .getByRole("progressbar", { name: "Charge" })
        .querySelector("[data-slot='progress-indicator']"),
    ).toHaveStyle({ transform: "translateX(-40%)" });
  });

  it("clamps out-of-range values", () => {
    const { rerender } = render(<Progress value={-20} aria-label="Level" />);

    expect(screen.getByRole("progressbar", { name: "Level" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    rerender(<Progress value={140} aria-label="Level" />);

    expect(screen.getByRole("progressbar", { name: "Level" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("preserves indeterminate semantics when value is undefined", () => {
    render(<Progress aria-label="Loading" />);

    const progress = screen.getByRole("progressbar", { name: "Loading" });

    expect(progress).not.toHaveAttribute("aria-valuenow");
    expect(
      progress.querySelector("[data-slot='progress-indicator']"),
    ).toHaveStyle({ transform: "translateX(-100%)" });
  });

  it("merges className on the root", () => {
    render(
      <Progress value={10} aria-label="Status" className="custom-progress" />,
    );

    expect(
      screen.getByRole("progressbar", { name: "Status" }).className,
    ).toContain("custom-progress");
  });

  it("forwards refs to the root element", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Progress ref={ref} value={30} aria-label="Reference" />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Progress value={45} aria-label="Loading progress" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
