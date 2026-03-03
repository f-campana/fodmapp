import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

describe("Popover", () => {
  function renderPopover(props?: React.ComponentProps<typeof Popover>) {
    return render(
      <Popover {...props}>
        <PopoverTrigger>Voir les details</PopoverTrigger>
        <PopoverContent>
          Informations nutritionnelles detaillees.
          <PopoverArrow />
        </PopoverContent>
      </Popover>,
    );
  }

  it("opens and closes from trigger in uncontrolled mode", async () => {
    renderPopover();

    fireEvent.click(screen.getByRole("button", { name: "Voir les details" }));

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='popover-content']");
      if (!node) {
        throw new Error("popover content not mounted yet");
      }
      return node as HTMLElement;
    });

    expect(content.textContent ?? "").toContain("Informations nutritionnelles");

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='popover-content']"),
      ).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    renderPopover();

    fireEvent.click(screen.getByRole("button", { name: "Voir les details" }));

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='popover-content']");
      if (!node) {
        throw new Error("popover content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='popover-content']"),
      ).toBeNull();
    });
  });

  it("renders anchor and full slot surface", async () => {
    const { container } = render(
      <Popover>
        <PopoverAnchor>Point d'ancrage</PopoverAnchor>
        <PopoverTrigger>Ouvrir</PopoverTrigger>
        <PopoverContent>
          Contenu
          <PopoverArrow />
        </PopoverContent>
      </Popover>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='popover-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='popover']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='popover-trigger']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='popover-anchor']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='popover-portal']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='popover-content']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='popover-arrow']")).toBeTruthy();
  });

  it("applies semantic content and arrow classes", () => {
    renderPopover({ defaultOpen: true });

    const content = document.querySelector(
      "[data-slot='popover-content']",
    ) as HTMLElement | null;
    const arrow = document.querySelector(
      "[data-slot='popover-arrow']",
    ) as HTMLElement | null;

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("data-[state=open]:animate-in");
    expect(content?.className ?? "").toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    const arrowClassName = arrow?.getAttribute("class") ?? "";
    expect(arrowClassName).toContain("fill-popover");
    expect(arrowClassName).toContain("stroke-border");
  });

  it("merges className on content", () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Ouvrir</PopoverTrigger>
        <PopoverContent className="contenu-popover-personnalise">
          Contenu
          <PopoverArrow />
        </PopoverContent>
      </Popover>,
    );

    expect(
      document.querySelector("[data-slot='popover-content']")?.className ?? "",
    ).toContain("contenu-popover-personnalise");
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <Popover defaultOpen>
        <PopoverTrigger ref={triggerRef}>Ouvrir</PopoverTrigger>
        <PopoverContent ref={contentRef}>Contenu</PopoverContent>
      </Popover>,
    );

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderPopover({ defaultOpen: true });

    expect(await axe(container)).toHaveNoViolations();
  });
});
