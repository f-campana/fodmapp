import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ScoreBar } from "./score-bar";

describe("ScoreBar", () => {
  it("renders meter semantics with a visible label", () => {
    render(<ScoreBar value={0.42} label="Score FODMAP" />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("data-slot", "score-bar");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "1");
    expect(meter).toHaveAttribute("aria-valuenow", "0.42");
    expect(meter).toHaveAttribute("aria-labelledby");
  });

  it("maps thresholds to status classes", () => {
    const { rerender } = render(<ScoreBar value={0.3} />);

    let fill =
      screen.getByRole("meter").querySelector("[data-slot='score-bar-fill']") ??
      undefined;
    expect(fill).toHaveAttribute("data-status", "danger");

    rerender(<ScoreBar value={0.6} />);
    fill =
      screen.getByRole("meter").querySelector("[data-slot='score-bar-fill']") ??
      undefined;
    expect(fill).toHaveAttribute("data-status", "warning");

    rerender(<ScoreBar value={0.9} />);
    fill =
      screen.getByRole("meter").querySelector("[data-slot='score-bar-fill']") ??
      undefined;
    expect(fill).toHaveAttribute("data-status", "success");
  });

  it("clamps values to 0..1", () => {
    const { rerender } = render(<ScoreBar value={-1} />);

    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");

    rerender(<ScoreBar value={2} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "1");
  });

  it("renders numeric visible labels without dropping them", () => {
    render(<ScoreBar value={0.58} label={0} />);

    const meter = screen.getByRole("meter");
    expect(screen.getByText("0")).toHaveAttribute(
      "data-slot",
      "score-bar-label",
    );
    expect(meter).toHaveAttribute("aria-labelledby");
  });

  it("uses aria-label when no visible label is rendered", () => {
    render(<ScoreBar value={0.51} aria-label="Score de sécurité" />);

    expect(screen.getByRole("meter")).toHaveAttribute(
      "aria-label",
      "Score de sécurité",
    );
  });

  it("merges className", () => {
    render(<ScoreBar value={0.7} className="ma-barre" />);

    expect(screen.getByRole("meter").className).toContain("ma-barre");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<ScoreBar value={0.58} label="Qualité" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
