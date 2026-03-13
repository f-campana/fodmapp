import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  async function waitForDialogContent() {
    return waitFor(() => {
      const node = document.querySelector("[data-slot='dialog-content']");
      if (!node) {
        throw new Error("dialog content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps slot markers stable on exposed compounds", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <Dialog defaultOpen>
        <DialogTrigger data-slot="custom-trigger">Ouvrir</DialogTrigger>
        <DialogContent container={portalContainer} data-slot="custom-content">
          <DialogHeader data-slot="custom-header">
            <DialogTitle data-slot="custom-title">Titre</DialogTitle>
            <DialogDescription data-slot="custom-description">
              Description
            </DialogDescription>
          </DialogHeader>
          <DialogBody data-slot="custom-body">Corps</DialogBody>
          <DialogFooter data-slot="custom-footer">
            <DialogClose data-slot="custom-close">Fermer</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    await waitForDialogContent();

    expect(container.querySelector("[data-slot='dialog']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='dialog-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dialog-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dialog-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dialog-header']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dialog-title']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dialog-description']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dialog-body']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dialog-footer']"),
    ).toBeTruthy();

    const closeButtons = portalContainer.querySelectorAll(
      "[data-slot='dialog-close']",
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
      portalContainer.querySelector("[data-slot='custom-body']"),
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
    renderDialog();

    const trigger = screen.getByRole("button", { name: "Ouvrir le dialogue" });

    trigger.focus();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Enter}");

    const content = await waitForDialogContent();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      expect(content.contains(document.activeElement)).toBe(true);
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on overlay click", async () => {
    renderDialog();

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le dialogue" }),
    );

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

  it("renders the built-in close button with the default French label", async () => {
    renderDialog();

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le dialogue" }),
    );

    const close = await screen.findByRole("button", { name: "Fermer" });
    expect(close).toHaveAttribute("data-slot", "dialog-close");
  });

  it("applies semantic class contracts", async () => {
    renderDialog();

    const trigger = screen.getByRole("button", { name: "Ouvrir le dialogue" });

    await userEvent.click(trigger);

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
    const builtInClose = screen.getByRole("button", { name: "Fermer" });
    const actionClose = screen.getByRole("button", { name: "Annuler" });

    expect(overlay.className).toContain("bg-muted/80");
    expect(overlay.className).toContain("data-[state=open]:animate-in");
    expect(overlay.className).toContain("data-[state=closed]:animate-out");

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("border-border");
    expect(content?.className ?? "").toContain("data-[state=open]:fade-in-0");
    expect(content?.className ?? "").toContain("data-[state=open]:zoom-in-95");

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
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Ouvrir via enfant
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Titre</DialogTitle>
          <DialogDescription>Description</DialogDescription>
          <DialogClose asChild>
            <button data-slot="custom-close" type="button">
              Fermer via enfant
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>,
    );

    await waitForDialogContent();

    const trigger = screen.getByRole("button", {
      hidden: true,
      name: "Ouvrir via enfant",
    });
    const close = screen.getByRole("button", { name: "Fermer via enfant" });

    expect(trigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(close).toHaveAttribute("data-slot", "custom-close");
    expect(document.querySelector("[data-slot='dialog-content']")).toBeTruthy();
    expect(
      document.querySelectorAll("[data-slot='dialog-close']"),
    ).toHaveLength(1);
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
