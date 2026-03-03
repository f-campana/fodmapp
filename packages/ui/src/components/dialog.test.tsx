import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

describe("Dialog", () => {
  function renderDialog(props?: React.ComponentProps<typeof Dialog>) {
    return render(
      <Dialog {...props}>
        <DialogTrigger>Ouvrir le dialogue</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la substitution</DialogTitle>
            <DialogDescription>
              Cette action mettra a jour votre liste de courses.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>Verifier les ingredients avant validation.</DialogBody>
          <DialogFooter>
            <DialogClose>Annuler</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
  }

  it("opens and closes from trigger in uncontrolled mode", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='dialog-content']");
      if (!node) {
        throw new Error("dialog content not mounted yet");
      }
      return node as HTMLElement;
    });

    expect(content.textContent ?? "").toContain("Verifier les ingredients");

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='dialog-content']");
      if (!node) {
        throw new Error("dialog content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    });
  });

  it("closes on overlay click", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));

    const overlay = await waitFor(() => {
      const node = document.querySelector("[data-slot='dialog-overlay']");
      if (!node) {
        throw new Error("dialog overlay not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    });
  });

  it("renders built-in close button with French label", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));

    const close = await screen.findByRole("button", { name: "Fermer" });
    expect(close).toHaveAttribute("data-slot", "dialog-close");
  });

  it("renders all expected slot markers", async () => {
    const { container } = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dialog-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='dialog']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='dialog-trigger']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-portal']")).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-overlay']")).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-content']")).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-header']")).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-body']")).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-footer']")).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-title']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dialog-description']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-close']")).toBeTruthy();
  });

  it("applies semantic class contracts", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));

    const overlay = await waitFor(() => {
      const node = document.querySelector("[data-slot='dialog-overlay']");
      if (!node) {
        throw new Error("dialog overlay not mounted yet");
      }
      return node as HTMLElement;
    });

    const content = document.querySelector(
      "[data-slot='dialog-content']",
    ) as HTMLElement | null;
    const close = document.querySelector(
      "[data-slot='dialog-close']",
    ) as HTMLElement | null;

    expect(overlay.className).toContain("bg-muted/80");
    expect(overlay.className).toContain("data-[state=open]:animate-in");
    expect(overlay.className).toContain("data-[state=closed]:animate-out");

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("border-border");
    expect(content?.className ?? "").toContain("data-[state=open]:fade-in-0");
    expect(content?.className ?? "").toContain("data-[state=open]:zoom-in-95");

    expect(close?.className ?? "").toContain("focus-visible:border-ring");
    expect(close?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(close?.className ?? "").not.toContain("focus-visible:ring-ring/50");
  });

  it("supports trigger asChild", () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button type="button">Ouvrir via enfant</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Titre</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "Ouvrir via enfant" });
    expect(trigger).toHaveAttribute("data-slot", "dialog-trigger");
  });

  it("merges className on content and layout helpers", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="dialogue-personnalise">
          <DialogHeader className="entete-personnalisee">
            <DialogTitle>Titre</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogBody className="corps-personnalise">Corps</DialogBody>
          <DialogFooter className="pied-personnalise">
            <DialogClose>Fermer</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(
      document.querySelector("[data-slot='dialog-content']")?.className ?? "",
    ).toContain("dialogue-personnalise");
    expect(
      document.querySelector("[data-slot='dialog-header']")?.className ?? "",
    ).toContain("entete-personnalisee");
    expect(
      document.querySelector("[data-slot='dialog-body']")?.className ?? "",
    ).toContain("corps-personnalise");
    expect(
      document.querySelector("[data-slot='dialog-footer']")?.className ?? "",
    ).toContain("pied-personnalise");
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <Dialog defaultOpen>
        <DialogTrigger ref={triggerRef}>Ouvrir</DialogTrigger>
        <DialogContent ref={contentRef}>
          <DialogTitle>Titre</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderDialog({ defaultOpen: true });

    expect(await axe(container)).toHaveNoViolations();
  });
});
