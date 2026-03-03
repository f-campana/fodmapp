import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Toggle } from "./toggle";

describe("Toggle", () => {
  it("renders button semantics", () => {
    render(<Toggle aria-label="Favori">Favori</Toggle>);

    expect(screen.getByRole("button", { name: "Favori" })).toBeInTheDocument();
  });

  it("updates pressed state and callback", () => {
    const onPressedChange = vi.fn();

    render(
      <Toggle aria-label="Filtre" onPressedChange={onPressedChange}>
        Filtre
      </Toggle>,
    );

    const toggle = screen.getByRole("button", { name: "Filtre" });
    fireEvent.click(toggle);

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("supports variant and size data attributes", () => {
    render(
      <Toggle aria-label="Option" variant="outline" size="lg" defaultPressed>
        Option
      </Toggle>,
    );

    const toggle = screen.getByRole("button", { name: "Option" });

    expect(toggle).toHaveAttribute("data-slot", "toggle");
    expect(toggle).toHaveAttribute("data-variant", "outline");
    expect(toggle).toHaveAttribute("data-size", "lg");
    expect(toggle.className).toContain("border-outline-border");
    expect(toggle.className).toContain("data-[state=on]:bg-accent");
    expect(toggle.className).toContain(
      "data-[state=on]:text-accent-foreground",
    );
    expect(toggle.className).toContain("focus-visible:ring-ring-soft");
    expect(toggle.className).not.toContain("focus-visible:ring-ring/50");
  });

  it("does not trigger callback when disabled", () => {
    const onPressedChange = vi.fn();

    render(
      <Toggle aria-label="Désactivé" disabled onPressedChange={onPressedChange}>
        Désactivé
      </Toggle>,
    );

    const toggle = screen.getByRole("button", { name: "Désactivé" });
    toggle.click();

    expect(toggle).toBeDisabled();
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("forwards ref to toggle button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Toggle ref={ref} aria-label="Référence">
        Référence
      </Toggle>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Toggle aria-label="Accessibilité">Texte</Toggle>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
