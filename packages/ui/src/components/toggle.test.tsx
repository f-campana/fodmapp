import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Toggle } from "./toggle";

describe("Toggle", () => {
  it("renders button semantics with a stable default slot marker", () => {
    render(
      <Toggle aria-label="Favori" data-slot="custom-toggle">
        Favori
      </Toggle>,
    );

    const toggle = screen.getByRole("button", { name: "Favori" });

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("data-slot", "toggle");
    expect(toggle).not.toHaveAttribute("data-slot", "custom-toggle");
  });

  it("updates pressed state and callback", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();

    render(
      <Toggle aria-label="Filtre" onPressedChange={onPressedChange}>
        Filtre
      </Toggle>,
    );

    const toggle = screen.getByRole("button", { name: "Filtre" });

    await user.click(toggle);

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("data-state", "on");
  });

  it("supports variant and size data attributes with semantic cursor and focus classes", () => {
    render(
      <Toggle aria-label="Option" variant="outline" size="lg" defaultPressed>
        Option
      </Toggle>,
    );

    const toggle = screen.getByRole("button", { name: "Option" });

    expect(toggle).toHaveAttribute("data-variant", "outline");
    expect(toggle).toHaveAttribute("data-size", "lg");
    expect(toggle.className).toContain("border-outline-border");
    expect(toggle.className).toContain("cursor-pointer");
    expect(toggle.className).toContain("disabled:cursor-not-allowed");
    expect(toggle.className).toContain("data-[state=on]:bg-accent");
    expect(toggle.className).toContain(
      "data-[state=on]:text-accent-foreground",
    );
    expect(toggle.className).toContain("focus-visible:ring-ring-soft");
    expect(toggle.className).not.toContain("focus-visible:ring-ring/50");
  });

  it("allows slot override when using asChild", () => {
    render(
      <Toggle asChild aria-label="Format gras">
        <button data-slot="custom-toggle" type="button">
          Format gras
        </button>
      </Toggle>,
    );

    expect(screen.getByRole("button", { name: "Format gras" })).toHaveAttribute(
      "data-slot",
      "custom-toggle",
    );
    expect(document.querySelector("[data-slot='toggle']")).toBeNull();
  });

  it("does not trigger callback when disabled", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();

    render(
      <Toggle aria-label="Desactive" disabled onPressedChange={onPressedChange}>
        Desactive
      </Toggle>,
    );

    const toggle = screen.getByRole("button", { name: "Desactive" });

    await user.click(toggle);

    expect(toggle).toBeDisabled();
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("merges className", () => {
    render(
      <Toggle aria-label="Classe" className="mon-toggle">
        Classe
      </Toggle>,
    );

    expect(screen.getByRole("button", { name: "Classe" }).className).toContain(
      "mon-toggle",
    );
  });

  it("forwards ref to the toggle button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Toggle ref={ref} aria-label="Reference">
        Reference
      </Toggle>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Toggle aria-label="Accessibilite">Texte</Toggle>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
