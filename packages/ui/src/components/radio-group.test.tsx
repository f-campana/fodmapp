import { createRef } from "react";

import { act, fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { RadioGroup, RadioGroupItem } from "./radio-group";

describe("RadioGroup", () => {
  function renderOptions(props?: React.ComponentProps<typeof RadioGroup>) {
    return render(
      <RadioGroup aria-label="Préférence" {...props}>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="option-sans-lactose" value="sans-lactose" />
          <label htmlFor="option-sans-lactose">Sans lactose</label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="option-vegetarien" value="vegetarien" />
          <label htmlFor="option-vegetarien">Végétarien</label>
        </div>
      </RadioGroup>,
    );
  }

  it("renders radiogroup and radio semantics", () => {
    renderOptions();

    expect(
      screen.getByRole("radiogroup", { name: "Préférence" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Sans lactose" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Végétarien" }),
    ).toBeInTheDocument();
  });

  it("supports uncontrolled default value", () => {
    renderOptions({ defaultValue: "sans-lactose" });

    expect(screen.getByRole("radio", { name: "Sans lactose" })).toHaveAttribute(
      "data-state",
      "checked",
    );
    expect(screen.getByRole("radio", { name: "Végétarien" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("supports controlled value", () => {
    const { rerender } = renderOptions({ value: "sans-lactose" });

    expect(screen.getByRole("radio", { name: "Sans lactose" })).toHaveAttribute(
      "data-state",
      "checked",
    );

    rerender(
      <RadioGroup aria-label="Préférence" value="vegetarien">
        <div className="flex items-center gap-2">
          <RadioGroupItem id="option-sans-lactose" value="sans-lactose" />
          <label htmlFor="option-sans-lactose">Sans lactose</label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="option-vegetarien" value="vegetarien" />
          <label htmlFor="option-vegetarien">Végétarien</label>
        </div>
      </RadioGroup>,
    );

    expect(screen.getByRole("radio", { name: "Végétarien" })).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("handles keyboard navigation events while preserving single selection", () => {
    renderOptions({ defaultValue: "sans-lactose" });

    const selected = screen.getByRole("radio", { name: "Sans lactose" });
    const initiallyChecked = screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("data-state") === "checked");

    act(() => {
      selected.focus();
      fireEvent.keyDown(selected, {
        key: "ArrowRight",
        code: "ArrowRight",
      });
    });

    const afterEventChecked = screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("data-state") === "checked");

    expect(initiallyChecked).toHaveLength(1);
    expect(afterEventChecked).toHaveLength(1);
  });

  it("does not select disabled items", () => {
    const onValueChange = vi.fn();

    render(
      <RadioGroup aria-label="Choix" onValueChange={onValueChange}>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="option-a" value="a" />
          <label htmlFor="option-a">Option A</label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="option-b" value="b" disabled />
          <label htmlFor="option-b">Option B</label>
        </div>
      </RadioGroup>,
    );

    screen.getByRole("radio", { name: "Option B" }).click();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders data-slot contract", () => {
    renderOptions({ defaultValue: "sans-lactose" });

    const root = screen.getByRole("radiogroup", { name: "Préférence" });
    const item = screen.getByRole("radio", { name: "Sans lactose" });
    const indicator = item.querySelector("[data-slot='radio-group-indicator']");

    expect(root).toHaveAttribute("data-slot", "radio-group");
    expect(item).toHaveAttribute("data-slot", "radio-group-item");
    expect(indicator).toHaveAttribute("data-slot", "radio-group-indicator");
  });

  it("forwards ref to radio group root", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <RadioGroup ref={ref} aria-label="Référence">
        <RadioGroupItem value="a" id="ref-a" />
        <label htmlFor="ref-a">A</label>
      </RadioGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderOptions({ defaultValue: "sans-lactose" });

    expect(await axe(container)).toHaveNoViolations();
  });
});
