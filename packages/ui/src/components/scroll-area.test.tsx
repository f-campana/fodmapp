import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
  it("renders root and viewport slots", () => {
    render(
      <ScrollArea className="h-24 w-24">
        <div className="h-64">Liste ingrédients</div>
      </ScrollArea>,
    );

    const content = screen.getByText("Liste ingrédients");
    const root = content.closest("[data-slot='scroll-area']");
    const viewport = content.closest("[data-slot='scroll-area-viewport']");

    expect(root).toHaveAttribute("data-slot", "scroll-area");
    expect(viewport).toHaveAttribute("data-slot", "scroll-area-viewport");
    expect(viewport).toHaveAttribute("tabindex", "0");
  });

  it("renders both scrollbar orientations and thumb slots", () => {
    const { container } = render(
      <ScrollArea className="h-24 w-24">
        <div className="h-64 w-64">Contenu défilant</div>
      </ScrollArea>,
    );

    const vertical = container.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='vertical']",
    );
    const horizontal = container.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='horizontal']",
    );
    const thumbs = container.querySelectorAll(
      "[data-slot='scroll-area-thumb']",
    );
    const corner = container.querySelector("[data-slot='scroll-area-corner']");

    expect(vertical).toBeTruthy();
    expect(horizontal).toBeTruthy();
    expect(thumbs).toHaveLength(2);
    expect(corner).toHaveAttribute("data-slot", "scroll-area-corner");
  });

  it("uses semantic thumb color token", () => {
    const { container } = render(
      <ScrollArea className="h-24 w-24">
        <div className="h-64">Thumb</div>
      </ScrollArea>,
    );

    const thumb = container.querySelector("[data-slot='scroll-area-thumb']");

    expect(thumb?.className ?? "").toContain("bg-border");
  });

  it("merges className on root", () => {
    render(
      <ScrollArea className="ma-zone">
        <div>Texte</div>
      </ScrollArea>,
    );

    const root = screen.getByText("Texte").closest("[data-slot='scroll-area']");
    expect(root?.className ?? "").toContain("ma-zone");
  });

  it("forwards ref to root element", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ScrollArea ref={ref}>
        <div>Référence</div>
      </ScrollArea>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <ScrollArea className="h-24 w-24">
        <div className="h-64">Accessibilité</div>
      </ScrollArea>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
