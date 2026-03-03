import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ScoreBar } from "./score-bar";

describe("ScoreBar", () => {
  it("renders progressbar semantics", () => {
    render(<ScoreBar value={0.42} label="Score FODMAP" />);

    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("data-slot", "score-bar");
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "1");
    expect(progress).toHaveAttribute("aria-valuenow", "0.42");
  });

  it("maps thresholds to status classes", () => {
    const { rerender } = render(<ScoreBar value={0.3} />);

    let fill =
      screen
        .getByRole("progressbar")
        .querySelector("[data-slot='score-bar-fill']") ?? undefined;
    expect(fill).toHaveAttribute("data-status", "danger");

    rerender(<ScoreBar value={0.6} />);
    fill =
      screen
        .getByRole("progressbar")
        .querySelector("[data-slot='score-bar-fill']") ?? undefined;
    expect(fill).toHaveAttribute("data-status", "warning");

    rerender(<ScoreBar value={0.9} />);
    fill =
      screen
        .getByRole("progressbar")
        .querySelector("[data-slot='score-bar-fill']") ?? undefined;
    expect(fill).toHaveAttribute("data-status", "success");
  });

  it("clamps values to 0..1", () => {
    const { rerender } = render(<ScoreBar value={-1} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    rerender(<ScoreBar value={2} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  });

  it("merges className", () => {
    render(<ScoreBar value={0.7} className="ma-barre" />);

    expect(screen.getByRole("progressbar").className).toContain("ma-barre");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<ScoreBar value={0.58} label="Qualité" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
