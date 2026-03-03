import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

describe("Tooltip", () => {
  it("renders tooltip open on focus and closes on Escape", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Aide</button>
          </TooltipTrigger>
          <TooltipContent>Détail nutritionnel</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Aide" });
    fireEvent.focus(trigger);

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='tooltip-content']");
      if (!node) {
        throw new Error("tooltip content not mounted yet");
      }
      return node as HTMLElement;
    });

    expect(content.textContent ?? "").toContain("Détail nutritionnel");

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='tooltip-content']"),
      ).toBeNull();
    });
  });

  it("applies semantic overlay token classes", () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button type="button">Infos</button>
          </TooltipTrigger>
          <TooltipContent>Conseil</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const content = document.querySelector(
      "[data-slot='tooltip-content']",
    ) as HTMLElement | null;

    expect(content).toBeTruthy();
    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("data-[state=open]:animate-in");
    expect(content?.className ?? "").toContain(
      "data-[state=closed]:animate-out",
    );
  });

  it("renders provider, root, and trigger slots", () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Déclencheur</button>
          </TooltipTrigger>
          <TooltipContent>Texte</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(
      container.querySelector("[data-slot='tooltip-provider']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='tooltip']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='tooltip-trigger']"),
    ).toBeTruthy();
  });

  it("calls onOpenChange when visibility changes", async () => {
    const onOpenChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip onOpenChange={onOpenChange}>
          <TooltipTrigger asChild>
            <button type="button">État</button>
          </TooltipTrigger>
          <TooltipContent>Description</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    fireEvent.focus(screen.getByRole("button", { name: "État" }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it("forwards ref to trigger element", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger ref={ref}>Référence</TooltipTrigger>
          <TooltipContent>Contenu</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button type="button">Accessibilité</button>
          </TooltipTrigger>
          <TooltipContent>Texte</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
