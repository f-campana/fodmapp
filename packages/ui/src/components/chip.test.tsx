import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Chip } from "./chip";

describe("Chip", () => {
  it("renders chip root and trigger with data attributes", () => {
    render(<Chip>Sans gluten</Chip>);

    const trigger = screen.getByRole("button", { name: "Sans gluten" });
    const root = trigger.closest("[data-slot='chip']");

    expect(root).toHaveAttribute("data-variant", "default");
    expect(root).toHaveAttribute("data-selected", "false");
    expect(root).toHaveAttribute("data-removable", "false");
    expect(root).toHaveAttribute("role", "group");
    expect(trigger).toHaveAttribute("data-slot", "chip-trigger");
  });

  it("fires onSelect on trigger click", () => {
    const onSelect = vi.fn();

    render(<Chip onSelect={onSelect}>Faible lactose</Chip>);

    screen.getByRole("button", { name: "Faible lactose" }).click();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("fires onRemove without triggering onSelect", () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();

    render(
      <Chip removable onSelect={onSelect} onRemove={onRemove}>
        Faible fructose
      </Chip>,
    );

    screen.getByRole("button", { name: "Supprimer le filtre" }).click();

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("supports disabled state for trigger and remove button", () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();

    render(
      <Chip removable disabled onSelect={onSelect} onRemove={onRemove}>
        Test
      </Chip>,
    );

    const trigger = screen.getByRole("button", { name: "Test" });
    const remove = screen.getByRole("button", { name: "Supprimer le filtre" });

    expect(trigger).toBeDisabled();
    expect(remove).toBeDisabled();

    trigger.click();
    remove.click();

    expect(onSelect).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("merges className", () => {
    render(<Chip className="ma-chip">Végétarien</Chip>);

    expect(
      screen
        .getByRole("button", { name: "Végétarien" })
        .closest("[data-slot='chip']")?.className,
    ).toContain("ma-chip");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Chip removable selected>
        Compatible
      </Chip>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
