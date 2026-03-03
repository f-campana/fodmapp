import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

  it("opens and closes from trigger in uncontrolled mode", async () => {
    renderSheet();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le panneau" }));

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='sheet-content']");
      if (!node) {
        throw new Error("sheet content not mounted yet");
      }
      return node as HTMLElement;
    });

    expect(content.textContent ?? "").toContain("Ajustez les filtres");

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));

    await waitFor(() => {
      expect(document.querySelector("[data-slot='sheet-content']")).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    renderSheet();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le panneau" }));

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='sheet-content']");
      if (!node) {
        throw new Error("sheet content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(document.querySelector("[data-slot='sheet-content']")).toBeNull();
    });
  });

  it("closes on overlay click", async () => {
    renderSheet();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le panneau" }));

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

  it("renders built-in close button with French label", async () => {
    renderSheet();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le panneau" }));

    const close = await screen.findByRole("button", { name: "Fermer" });
    expect(close).toHaveAttribute("data-slot", "sheet-close");
  });

  it("renders all expected slots", async () => {
    const { container } = renderSheet();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le panneau" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='sheet-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='sheet']")).toBeTruthy();
    expect(container.querySelector("[data-slot='sheet-trigger']")).toBeTruthy();
    expect(document.querySelector("[data-slot='sheet-portal']")).toBeTruthy();
    expect(document.querySelector("[data-slot='sheet-overlay']")).toBeTruthy();
    expect(document.querySelector("[data-slot='sheet-content']")).toBeTruthy();
    expect(document.querySelector("[data-slot='sheet-header']")).toBeTruthy();
    expect(document.querySelector("[data-slot='sheet-footer']")).toBeTruthy();
    expect(document.querySelector("[data-slot='sheet-title']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='sheet-description']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='sheet-close']")).toBeTruthy();
  });

  it("applies semantic class and motion contracts", () => {
    renderSheet({ defaultOpen: true });

    const overlay = document.querySelector(
      "[data-slot='sheet-overlay']",
    ) as HTMLElement | null;
    const content = document.querySelector(
      "[data-slot='sheet-content']",
    ) as HTMLElement | null;
    const close = document.querySelector(
      "[data-slot='sheet-close'][aria-label='Fermer']",
    ) as HTMLElement | null;

    expect(overlay?.className ?? "").toContain("bg-muted/80");
    expect(overlay?.className ?? "").toContain("data-[state=open]:animate-in");

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("w-3/4");
    expect(content?.className ?? "").toContain("sm:max-w-sm");
    expect(content?.className ?? "").toContain(
      "data-[state=open]:slide-in-from-right",
    );
    expect(content?.className ?? "").toContain(
      "data-[state=closed]:slide-out-to-right",
    );

    expect(close?.className ?? "").toContain("focus-visible:border-ring");
    expect(close?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(close?.className ?? "").not.toContain("focus-visible:ring-ring/50");
  });

  it("supports trigger asChild", () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <button type="button">Ouvrir via enfant</button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Titre</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    const trigger = screen.getByRole("button", { name: "Ouvrir via enfant" });
    expect(trigger).toHaveAttribute("data-slot", "sheet-trigger");
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
