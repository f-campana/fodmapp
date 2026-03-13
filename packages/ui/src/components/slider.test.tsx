import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./slider";

describe("Slider", () => {
  it("renders single-thumb slider semantics and value attributes", () => {
    render(<Slider defaultValue={[40]} aria-label="Niveau FODMAP" />);

    const thumb = screen.getByRole("slider", { name: "Niveau FODMAP" });

    expect(thumb).toBeInTheDocument();
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "100");
    expect(thumb).toHaveAttribute("aria-valuenow", "40");
    expect(thumb).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("supports visible labeling through aria-labelledby", () => {
    render(
      <div>
        <p id="threshold-label">Tolerance threshold</p>
        <Slider defaultValue={[35]} aria-labelledby="threshold-label" />
      </div>,
    );

    const thumb = screen.getByRole("slider", { name: "Tolerance threshold" });

    expect(thumb).toHaveAttribute("aria-labelledby", "threshold-label");
    expect(thumb).toHaveAttribute("aria-valuenow", "35");
  });

  it("keeps the root slot stable and updates value from keyboard input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Slider
        defaultValue={[20]}
        aria-label="Portion"
        data-slot="custom-slider"
        onValueChange={onValueChange}
      />,
    );

    const thumb = screen.getByRole("slider", { name: "Portion" });
    const root = thumb.closest("[data-slot='slider']");

    expect(root).toHaveAttribute("data-slot", "slider");
    expect(root).not.toHaveAttribute("data-slot", "custom-slider");
    expect(root?.querySelector("[data-slot='slider-track']")).toBeTruthy();
    expect(root?.querySelector("[data-slot='slider-range']")).toBeTruthy();
    expect(thumb).toHaveAttribute("data-slot", "slider-thumb");

    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith([21]);
    expect(thumb).toHaveAttribute("aria-valuenow", "21");

    await user.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith([20]);
    expect(thumb).toHaveAttribute("aria-valuenow", "20");
  });

  it("does not change value when disabled and exposes disabled data state", () => {
    const onValueChange = vi.fn();

    render(
      <Slider
        defaultValue={[30]}
        aria-label="Indisponible"
        disabled
        onValueChange={onValueChange}
      />,
    );

    const thumb = screen.getByRole("slider", { name: "Indisponible" });

    expect(thumb).toHaveAttribute("data-disabled");
    expect(thumb.className).toContain("data-[disabled]:opacity-50");
    expect(thumb.className).toContain("data-[disabled]:cursor-not-allowed");

    fireEvent.keyDown(thumb, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(thumb).toHaveAttribute("aria-valuenow", "30");
  });

  it("uses semantic focus class tokens", () => {
    render(<Slider defaultValue={[50]} aria-label="Intensite" />);

    const thumb = screen.getByRole("slider", { name: "Intensite" });

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

    render(<Slider ref={ref} defaultValue={[30]} aria-label="Reference" />);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Slider defaultValue={[55]} aria-label="Accessibilite" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
