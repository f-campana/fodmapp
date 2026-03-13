import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Drawer,
  DrawerClose,
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

describe("Drawer", () => {
  function renderDrawer(props?: React.ComponentProps<typeof Drawer>) {
    return render(
      <Drawer {...props}>
        <DrawerTrigger>Ouvrir le tiroir</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Titre</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Annuler</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
  }

  async function waitForDrawerContent() {
    return waitFor(() => {
      const node = document.querySelector("[data-slot='drawer-content']");
      if (!node) {
        throw new Error("drawer content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps slot markers stable on exposed compounds", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <Drawer defaultOpen>
        <DrawerTrigger data-slot="custom-trigger">Ouvrir</DrawerTrigger>
        <DrawerContent container={portalContainer} data-slot="custom-content">
          <DrawerHeader data-slot="custom-header">
            <DrawerTitle data-slot="custom-title">Titre</DrawerTitle>
            <DrawerDescription data-slot="custom-description">
              Description
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter data-slot="custom-footer">
            <DrawerClose data-slot="custom-close">Fermer</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );

    await waitForDrawerContent();

    expect(container.querySelector("[data-slot='drawer']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='drawer-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-overlay']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-header']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-title']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-description']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-footer']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='drawer-handle']"),
    ).toBeTruthy();

    const closeButtons = portalContainer.querySelectorAll(
      "[data-slot='drawer-close']",
    );
    expect(closeButtons).toHaveLength(2);

    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-content']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-header']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-title']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-description']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-footer']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-close']"),
    ).toBeNull();
  });

  it("opens from keyboard, moves focus into the drawer, and closes on Escape", async () => {
    const user = userEvent.setup();

    renderDrawer();

    const trigger = screen.getByRole("button", { name: "Ouvrir le tiroir" });
    const triggerFocusSpy = vi.spyOn(trigger, "focus");

    trigger.focus();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Enter}");

    const content = await waitForDrawerContent();

    await waitFor(() => {
      expect(content).toHaveAttribute("data-state", "open");
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      expect(content.contains(document.activeElement)).toBe(true);
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(content).toHaveAttribute("data-state", "closed");
    });
    const overlay = document.querySelector(
      "[data-slot='drawer-overlay']",
    ) as HTMLElement | null;

    if (overlay) {
      fireEvent.animationEnd(overlay);
    }

    fireEvent.animationEnd(content);

    await waitFor(() => {
      expect(triggerFocusSpy).toHaveBeenCalled();
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    triggerFocusSpy.mockRestore();
  });

  it("restores focus to the trigger that opened the drawer when multiple triggers are present", async () => {
    const user = userEvent.setup();

    render(
      <Drawer>
        <DrawerTrigger>Premier declencheur</DrawerTrigger>
        <DrawerTrigger>Second declencheur</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Titre</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    );

    const firstTrigger = screen.getByRole("button", {
      name: "Premier declencheur",
    });
    const secondTrigger = screen.getByRole("button", {
      name: "Second declencheur",
    });
    const firstTriggerFocusSpy = vi.spyOn(firstTrigger, "focus");
    const secondTriggerFocusSpy = vi.spyOn(secondTrigger, "focus");

    secondTrigger.focus();
    await user.keyboard("{Enter}");

    const content = await waitForDrawerContent();
    await waitFor(() => {
      expect(content).toHaveAttribute("data-state", "open");
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(content).toHaveAttribute("data-state", "closed");
    });

    fireEvent.animationEnd(content);

    await waitFor(() => {
      expect(secondTriggerFocusSpy).toHaveBeenCalled();
    });
    expect(firstTriggerFocusSpy).not.toHaveBeenCalled();

    firstTriggerFocusSpy.mockRestore();
    secondTriggerFocusSpy.mockRestore();
  });

  it("closes from the built-in close button", async () => {
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le tiroir" }));

    const content = await waitForDrawerContent();
    await waitFor(() => {
      expect(content).toHaveAttribute("data-state", "open");
    });

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));

    await waitFor(() => {
      expect(content).toHaveAttribute("data-state", "closed");
    });
  });

  it("closes on overlay interaction", async () => {
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le tiroir" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toHaveAttribute("data-state", "open");
    });

    const overlay = await waitFor(() => {
      const node = document.querySelector("[data-slot='drawer-overlay']");
      if (!node) {
        throw new Error("drawer overlay not mounted yet");
      }

      return node as HTMLElement;
    });

    fireEvent.pointerDown(overlay);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toHaveAttribute("data-state", "closed");
    });
  });

  it("applies semantic class contracts", async () => {
    renderDrawer();

    const trigger = screen.getByRole("button", { name: "Ouvrir le tiroir" });

    await userEvent.click(trigger);

    const overlay = await waitFor(() => {
      const node = document.querySelector("[data-slot='drawer-overlay']");
      if (!node) {
        throw new Error("drawer overlay not mounted yet");
      }

      return node as HTMLElement;
    });
    const content = document.querySelector(
      "[data-slot='drawer-content']",
    ) as HTMLElement | null;
    const builtInClose = screen.getByRole("button", { name: "Fermer" });
    const actionClose = screen.getByRole("button", { name: "Annuler" });

    expect(overlay.className).toContain("bg-muted/80");
    expect(overlay.className).toContain("data-[state=open]:animate-in");
    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain(
      "data-[vaul-drawer-direction=bottom]:inset-x-0",
    );
    expect(content?.className ?? "").toContain(
      "data-[vaul-drawer-direction=bottom]:bottom-0",
    );
    expect(trigger.className).toContain("cursor-pointer");
    expect(builtInClose.className).toContain("cursor-pointer");
    expect(actionClose.className).toContain("cursor-pointer");
    expect(builtInClose.className).toContain("focus-visible:border-ring");
    expect(builtInClose.className).toContain("focus-visible:ring-ring-soft");
    expect(builtInClose.className).not.toContain("focus-visible:ring-ring/50");
    expect(actionClose.className).toContain("focus-visible:border-ring");
    expect(actionClose.className).toContain("focus-visible:ring-ring-soft");
    expect(actionClose.className).not.toContain("focus-visible:ring-ring/50");
  });

  it("allows trigger slot override when using asChild", async () => {
    render(
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Ouvrir via enfant
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Titre</DrawerTitle>
          <DrawerDescription>Description</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );

    await waitForDrawerContent();

    const trigger = screen.getByRole("button", {
      hidden: true,
      name: "Ouvrir via enfant",
    });

    expect(trigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(document.querySelector("[data-slot='drawer-content']")).toBeTruthy();
    expect(document.querySelector("[data-slot='drawer-close']")).toBeTruthy();
  });

  it("merges className and forwards refs", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <Drawer defaultOpen>
        <DrawerTrigger ref={triggerRef}>Ouvrir</DrawerTrigger>
        <DrawerContent className="contenu-personnalise" ref={contentRef}>
          <DrawerHeader className="entete-personnalisee">
            <DrawerTitle>Titre</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="pied-personnalise">
            <DrawerClose>Fermer</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='drawer-content']"),
      ).toBeTruthy();
    });

    expect(
      document.querySelector("[data-slot='drawer-content']")?.className ?? "",
    ).toContain("contenu-personnalise");
    expect(
      document.querySelector("[data-slot='drawer-header']")?.className ?? "",
    ).toContain("entete-personnalisee");
    expect(
      document.querySelector("[data-slot='drawer-footer']")?.className ?? "",
    ).toContain("pied-personnalise");

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

    expect(await axe(container)).toHaveNoViolations();
  });
});
