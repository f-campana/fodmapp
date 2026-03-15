import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Dot } from "./dot";

describe("Dot", () => {
  it("renders default unknown variant with its accessible label", () => {
    render(<Dot />);

    const dot = screen.getByText("FODMAP inconnu").closest("[data-slot='dot']");

    expect(dot).toHaveAttribute("data-variant", "unknown");
    expect(dot?.className).toContain("bg-muted");
  });

  it("supports all FODMAP variants", () => {
    render(
      <>
        <Dot variant="none" />
        <Dot variant="low" />
        <Dot variant="moderate" />
        <Dot variant="high" />
        <Dot variant="unknown" />
      </>,
    );

    expect(screen.getByText("Aucun FODMAP")).toBeInTheDocument();
    expect(screen.getByText("Faible FODMAP")).toBeInTheDocument();
    expect(screen.getByText("FODMAP modéré")).toBeInTheDocument();
    expect(screen.getByText("FODMAP élevé")).toBeInTheDocument();
    expect(screen.getByText("FODMAP inconnu")).toBeInTheDocument();
  });

  it("supports custom accessible label", () => {
    render(<Dot variant="low" label="Compatible" />);

    expect(screen.getByText("Compatible")).toBeInTheDocument();
    expect(
      screen.getByText("Compatible").closest("[data-slot='dot']"),
    ).toHaveAttribute("data-variant", "low");
  });

  it("merges className", () => {
    render(<Dot className="mon-dot" />);

    const dot = screen.getByText("FODMAP inconnu").closest("[data-slot='dot']");
    expect(dot?.className).toContain("mon-dot");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Dot variant="moderate" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
