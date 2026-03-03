import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./slider";

describe("Slider", () => {
  it("renders slider semantics", () => {
    render(<Slider defaultValue={[40]} aria-label="Niveau FODMAP" />);

    expect(
      screen.getByRole("slider", { name: "Niveau FODMAP" }),
    ).toBeInTheDocument();
  });

  it("invokes onValueChange during keyboard interaction", () => {
    const onValueChange = vi.fn();

    render(
      <Slider
        defaultValue={[20]}
        aria-label="Portion"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole("slider", { name: "Portion" }), {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    expect(onValueChange).toHaveBeenCalled();
  });

  it("renders data-slot contract and focus class tokens", () => {
    render(<Slider defaultValue={[50]} aria-label="Intensité" />);

    const thumb = screen.getByRole("slider", { name: "Intensité" });
    const root = thumb.closest("[data-slot='slider']");
    const track = root?.querySelector("[data-slot='slider-track']");
    const range = root?.querySelector("[data-slot='slider-range']");

    expect(root).toHaveAttribute("data-slot", "slider");
    expect(track).toHaveAttribute("data-slot", "slider-track");
    expect(range).toHaveAttribute("data-slot", "slider-range");
    expect(thumb).toHaveAttribute("data-slot", "slider-thumb");
    expect(thumb.className).toContain("focus-visible:border-ring");
    expect(thumb.className).toContain("focus-visible:ring-ring-soft");
    expect(thumb.className).not.toContain("focus-visible:ring-ring/50");
  });

  it("merges className", () => {
    render(
      <Slider defaultValue={[10]} aria-label="Valeur" className="mon-slider" />,
    );

    const root = screen
      .getByRole("slider", { name: "Valeur" })
      .closest("[data-slot='slider']");

    expect(root?.className ?? "").toContain("mon-slider");
  });

  it("forwards ref to slider root", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Slider ref={ref} defaultValue={[30]} aria-label="Référence" />);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Slider defaultValue={[55]} aria-label="Accessibilité" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
