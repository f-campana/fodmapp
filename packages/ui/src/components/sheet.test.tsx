import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

describe("Sheet", () => {
  function renderSheet(props?: React.ComponentProps<typeof Sheet>) {
    return render(
      <Sheet {...props}>
        <SheetTrigger>Ouvrir le panneau</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Parametres rapides</SheetTitle>
            <SheetDescription>
              Ajustez les filtres sans quitter la page.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Fermer le panneau</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
  }

  async function waitForSheetContent() {
    return waitFor(() => {
      const node = document.querySelector("[data-slot='sheet-content']");
      if (!node) {
        throw new Error("sheet content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps slot markers stable on exposed compounds", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <Sheet defaultOpen>
        <SheetTrigger data-slot="custom-trigger">Ouvrir</SheetTrigger>
        <SheetContent container={portalContainer} data-slot="custom-content">
          <SheetHeader data-slot="custom-header">
            <SheetTitle data-slot="custom-title">Titre</SheetTitle>
            <SheetDescription data-slot="custom-description">
              Description
            </SheetDescription>
          </SheetHeader>
          <SheetFooter data-slot="custom-footer">
            <SheetClose data-slot="custom-close">Fermer</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    await waitForSheetContent();

    expect(container.querySelector("[data-slot='sheet']")).toBeTruthy();
    expect(container.querySelector("[data-slot='sheet-trigger']")).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='sheet-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='sheet-overlay']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='sheet-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='sheet-header']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='sheet-title']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='sheet-description']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='sheet-footer']"),
    ).toBeTruthy();

    const closeButtons = portalContainer.querySelectorAll(
      "[data-slot='sheet-close']",
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

  it("opens from keyboard, closes on Escape, and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderSheet();

    const trigger = screen.getByRole("button", { name: "Ouvrir le panneau" });

    trigger.focus();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Enter}");

    const content = await waitForSheetContent();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      expect(content.contains(document.activeElement)).toBe(true);
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(document.querySelector("[data-slot='sheet-content']")).toBeNull();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on overlay click", async () => {
    renderSheet();

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le panneau" }),
    );

    const overlay = await waitFor(() => {
      const node = document.querySelector("[data-slot='sheet-overlay']");
      if (!node) {
        throw new Error("sheet overlay not mounted yet");
      }

      return node as HTMLElement;
    });

    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(document.querySelector("[data-slot='sheet-content']")).toBeNull();
    });
  });

  it("renders the built-in close button with the default French label", async () => {
    renderSheet();

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le panneau" }),
    );

    const close = await screen.findByRole("button", { name: "Fermer" });
    expect(close).toHaveAttribute("data-slot", "sheet-close");
  });

  it("applies semantic class and motion contracts", async () => {
    renderSheet();

    const trigger = screen.getByRole("button", { name: "Ouvrir le panneau" });

    await userEvent.click(trigger);

    const overlay = await waitFor(() => {
      const node = document.querySelector("[data-slot='sheet-overlay']");
      if (!node) {
        throw new Error("sheet overlay not mounted yet");
      }

      return node as HTMLElement;
    });
    const content = document.querySelector(
      "[data-slot='sheet-content']",
    ) as HTMLElement | null;
    const builtInClose = screen.getByRole("button", { name: "Fermer" });
    const actionClose = screen.getByRole("button", {
      name: "Fermer le panneau",
    });

    expect(overlay.className).toContain("bg-muted/80");
    expect(overlay.className).toContain("data-[state=open]:animate-in");

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("grid");
    expect(content?.className ?? "").toContain("auto-rows-max");
    expect(content?.className ?? "").toContain("content-start");
    expect(content?.className ?? "").toContain("w-3/4");
    expect(content?.className ?? "").toContain("sm:max-w-sm");
    expect(content?.className ?? "").toContain(
      "data-[state=open]:slide-in-from-right",
    );
    expect(content?.className ?? "").toContain(
      "data-[state=closed]:slide-out-to-right",
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

  it("allows trigger and close slot override when using asChild", async () => {
    render(
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Ouvrir via enfant
          </button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Titre</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <SheetClose asChild>
            <button data-slot="custom-close" type="button">
              Fermer via enfant
            </button>
          </SheetClose>
        </SheetContent>
      </Sheet>,
    );

    await waitForSheetContent();

    const trigger = screen.getByRole("button", {
      hidden: true,
      name: "Ouvrir via enfant",
    });
    const close = screen.getByRole("button", { name: "Fermer via enfant" });

    expect(trigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(close).toHaveAttribute("data-slot", "custom-close");
    expect(document.querySelector("[data-slot='sheet-content']")).toBeTruthy();
    expect(document.querySelectorAll("[data-slot='sheet-close']")).toHaveLength(
      1,
    );
  });

  it("merges className on content and layout helpers", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent className="panneau-personnalise">
          <SheetHeader className="entete-personnalisee">
            <SheetTitle>Titre</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          <SheetFooter className="pied-personnalise">
            <SheetClose>Fermer</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    expect(
      document.querySelector("[data-slot='sheet-content']")?.className ?? "",
    ).toContain("panneau-personnalise");
    expect(
      document.querySelector("[data-slot='sheet-header']")?.className ?? "",
    ).toContain("entete-personnalisee");
    expect(
      document.querySelector("[data-slot='sheet-footer']")?.className ?? "",
    ).toContain("pied-personnalise");
  });

  it("applies side variant classes", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent side="top">
          <SheetTitle>Titre</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    const content = document.querySelector(
      "[data-slot='sheet-content']",
    ) as HTMLElement | null;

    expect(content).toHaveAttribute("data-side", "top");
    expect(content?.className ?? "").toContain("inset-x-0");
    expect(content?.className ?? "").toContain("top-0");
    expect(content?.className ?? "").toContain(
      "data-[state=open]:slide-in-from-top",
    );
    expect(content?.className ?? "").toContain(
      "data-[state=closed]:slide-out-to-top",
    );
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <Sheet defaultOpen>
        <SheetTrigger ref={triggerRef}>Ouvrir</SheetTrigger>
        <SheetContent ref={contentRef}>
          <SheetTitle>Titre</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderSheet({ defaultOpen: true });

    expect(await axe(container)).toHaveNoViolations();
  });
});
