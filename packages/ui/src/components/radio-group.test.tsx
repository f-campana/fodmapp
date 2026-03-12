import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("keeps the selected radio as the single keyboard tab stop", async () => {
    const user = userEvent.setup();

    renderOptions({ defaultValue: "sans-lactose" });

    const selected = screen.getByRole("radio", { name: "Sans lactose" });
    const next = screen.getByRole("radio", { name: "Végétarien" });

    await user.tab();

    expect(selected).toHaveFocus();
    expect(selected).toHaveAttribute("tabindex", "0");
    expect(next).toHaveAttribute("tabindex", "-1");
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

  it("keeps slot markers stable on root and item", async () => {
    const user = userEvent.setup();

    render(
      <RadioGroup
        aria-label="Préférence"
        data-slot="custom-root"
        defaultValue="sans-lactose"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem
            data-slot="custom-item"
            id="option-sans-lactose"
            value="sans-lactose"
          />
          <label htmlFor="option-sans-lactose">Sans lactose</label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="option-vegetarien" value="vegetarien" />
          <label htmlFor="option-vegetarien">Végétarien</label>
        </div>
      </RadioGroup>,
    );

    const root = screen.getByRole("radiogroup", { name: "Préférence" });
    const item = screen.getByRole("radio", { name: "Sans lactose" });
    const indicator = item.querySelector("[data-slot='radio-group-indicator']");

    expect(root).toHaveAttribute("data-slot", "radio-group");
    expect(item).toHaveAttribute("data-slot", "radio-group-item");
    expect(indicator).toHaveAttribute("data-slot", "radio-group-indicator");

    expect(document.querySelector("[data-slot='custom-root']")).toBeNull();
    expect(document.querySelector("[data-slot='custom-item']")).toBeNull();

    await user.click(screen.getByRole("radio", { name: "Végétarien" }));
    expect(screen.getByRole("radio", { name: "Végétarien" })).toHaveAttribute(
      "data-slot",
      "radio-group-item",
    );
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
