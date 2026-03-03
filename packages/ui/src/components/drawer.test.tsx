import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  addEventListener: vi.fn(),
  addListener: vi.fn(),
  dispatchEvent: vi.fn(),
  matches: false,
  media: query,
  onchange: null,
  removeEventListener: vi.fn(),
  removeListener: vi.fn(),
}));

function DrawerFixture() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button">Ouvrir le tiroir</button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Titre</DrawerTitle>
          <DrawerDescription>Description</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <button type="button">Action</button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function getDrawerTrigger() {
  const trigger = document.querySelector("[data-slot='drawer-trigger']");

  if (!trigger) {
    throw new Error("Drawer trigger not found");
  }

  return trigger as HTMLElement;
}

describe("Drawer", () => {
  it("opens and closes from trigger and Escape", async () => {
    render(<DrawerFixture />);

    const trigger = document.querySelector(
      "[data-slot='drawer-trigger']",
    ) as HTMLElement | null;

    fireEvent.click(trigger as HTMLElement);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toBeTruthy();
    });

    const content = document.querySelector("[data-slot='drawer-content']");

    fireEvent.keyDown(content ?? document.body, {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toHaveAttribute("data-state", "closed");
    });
  });

  it("closes on overlay click and built-in close button", async () => {
    render(<DrawerFixture />);

    fireEvent.click(getDrawerTrigger());

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toBeTruthy();
    });

    const closeButton = screen.getByLabelText("Fermer");

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toHaveAttribute("data-state", "closed");
    });

    fireEvent.click(getDrawerTrigger());

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-overlay']"),
      ).toBeTruthy();
    });

    fireEvent.pointerDown(
      document.querySelector("[data-slot='drawer-overlay']") as Element,
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toHaveAttribute("data-state", "closed");
    });
  });

  it("renders slots and semantic class contracts", async () => {
    const { container } = render(<DrawerFixture />);

    fireEvent.click(getDrawerTrigger());

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toBeTruthy();
    });

    const root = container.querySelector("[data-slot='drawer']");
    const portal = document.querySelector("[data-slot='drawer-portal']");
    const overlay = document.querySelector(
      "[data-slot='drawer-overlay']",
    ) as HTMLElement;
    const content = document.querySelector(
      "[data-slot='drawer-content']",
    ) as HTMLElement;

    expect(root).toBeTruthy();
    expect(portal).toBeTruthy();
    expect(overlay.className).toContain("bg-muted/80");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
    expect(content.className).toContain(
      "data-[vaul-drawer-direction=bottom]:inset-x-0",
    );
    expect(content.className).toContain(
      "data-[vaul-drawer-direction=bottom]:bottom-0",
    );
  });

  it("merges className and supports refs", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    const { container } = render(
      <Drawer defaultOpen>
        <DrawerTrigger asChild ref={triggerRef}>
          <button className="declencheur-personnalise" type="button">
            Ouvrir
          </button>
        </DrawerTrigger>
        <DrawerContent className="contenu-personnalise" ref={contentRef}>
          <DrawerHeader className="entete-personnalisee">
            <DrawerTitle>Titre</DrawerTitle>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector(".declencheur-personnalise")).toBeTruthy();
    expect(document.querySelector(".contenu-personnalise")).toBeTruthy();
    expect(document.querySelector(".entete-personnalisee")).toBeTruthy();

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Parametres</DrawerTitle>
            <DrawerDescription>Modifier les options</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
