import { createRef } from "react";

import { act, fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

describe("ToggleGroup", () => {
  it("supports single selection mode", () => {
    render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Préférences">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionA = screen.getByLabelText("Option A");
    const optionB = screen.getByLabelText("Option B");

    expect(optionA).toHaveAttribute("data-state", "on");
    expect(optionB).toHaveAttribute("data-state", "off");

    fireEvent.click(optionB);

    expect(optionB).toHaveAttribute("data-state", "on");
    expect(optionA).toHaveAttribute("data-state", "off");
  });

  it("supports multiple selection mode", () => {
    render(
      <ToggleGroup type="multiple" defaultValue={["a"]} aria-label="Filtres">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionA = screen.getByLabelText("Option A");
    const optionB = screen.getByLabelText("Option B");

    fireEvent.click(optionB);

    expect(optionA).toHaveAttribute("data-state", "on");
    expect(optionB).toHaveAttribute("data-state", "on");
  });

  it("handles keyboard navigation without breaking selection", () => {
    render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Navigation">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionA = screen.getByLabelText("Option A");
    const initiallyChecked = Array.from(
      document.querySelectorAll("[data-slot='toggle-group-item']"),
    ).filter((node) => node.getAttribute("data-state") === "on");

    act(() => {
      optionA.focus();
      fireEvent.keyDown(optionA, { key: "ArrowRight", code: "ArrowRight" });
    });

    const afterEventChecked = Array.from(
      document.querySelectorAll("[data-slot='toggle-group-item']"),
    ).filter((node) => node.getAttribute("data-state") === "on");

    expect(initiallyChecked).toHaveLength(1);
    expect(afterEventChecked).toHaveLength(1);
  });

  it("does not activate disabled items", () => {
    const onValueChange = vi.fn();

    render(
      <ToggleGroup
        type="single"
        onValueChange={onValueChange}
        aria-label="Choix"
      >
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B" disabled>
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionB = screen.getByLabelText("Option B");
    optionB.click();

    expect(optionB).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalledWith("b");
  });

  it("renders slot and orientation data attributes", () => {
    render(
      <ToggleGroup
        type="single"
        orientation="vertical"
        aria-label="Orientation"
      >
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const item = screen.getByLabelText("Option A");
    const root = item.closest("[data-slot='toggle-group']");

    expect(root).toHaveAttribute("data-slot", "toggle-group");
    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(item).toHaveAttribute("data-slot", "toggle-group-item");
  });

  it("merges className on root", () => {
    render(
      <ToggleGroup type="single" className="mon-groupe" aria-label="Classe">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const root = screen
      .getByLabelText("Option A")
      .closest("[data-slot='toggle-group']");

    expect(root?.className ?? "").toContain("mon-groupe");
  });

  it("forwards ref to group root", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ToggleGroup ref={ref} type="single" aria-label="Référence">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Accessibilité">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
