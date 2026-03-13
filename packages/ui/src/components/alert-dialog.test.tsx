import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

describe("AlertDialog", () => {
  function renderAlertDialog(props?: React.ComponentProps<typeof AlertDialog>) {
    return render(
      <AlertDialog {...props}>
        <AlertDialogTrigger>Supprimer la substitution</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
  }

  async function waitForAlertDialogContent(searchRoot: ParentNode = document) {
    return waitFor(() => {
      const node = searchRoot.querySelector(
        "[data-slot='alert-dialog-content']",
      );
      if (!node) {
        throw new Error("alert dialog content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps slot markers stable on exposed compounds", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger data-slot="custom-trigger">
          Ouvrir
        </AlertDialogTrigger>
        <AlertDialogContent
          container={portalContainer}
          data-slot="custom-content"
        >
          <AlertDialogHeader data-slot="custom-header">
            <AlertDialogTitle data-slot="custom-title">Titre</AlertDialogTitle>
            <AlertDialogDescription data-slot="custom-description">
              Description
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-slot="custom-footer">
            <AlertDialogCancel data-slot="custom-cancel">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction data-slot="custom-action">
              Valider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await waitForAlertDialogContent(portalContainer);

    expect(container.querySelector("[data-slot='alert-dialog']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='alert-dialog-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-overlay']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-header']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-title']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-description']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-footer']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-cancel']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='alert-dialog-action']"),
    ).toBeTruthy();

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
      portalContainer.querySelector("[data-slot='custom-cancel']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-action']"),
    ).toBeNull();
  });

  it("opens from keyboard, traps focus, closes on Escape, and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderAlertDialog();

    const trigger = screen.getByRole("button", {
      name: "Supprimer la substitution",
    });

    trigger.focus();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Enter}");

    const content = await waitForAlertDialogContent();
    const cancel = screen.getByRole("button", { name: "Annuler" });
    const action = screen.getByRole("button", { name: "Supprimer" });

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      expect(cancel).toHaveFocus();
      expect(content.contains(document.activeElement)).toBe(true);
    });

    await user.tab();
    expect(action).toHaveFocus();

    await user.tab();
    expect(cancel).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='alert-dialog-content']"),
      ).toBeNull();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("does not close on overlay click", async () => {
    renderAlertDialog();

    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer la substitution" }),
    );

    const overlay = await waitFor(() => {
      const node = document.querySelector("[data-slot='alert-dialog-overlay']");
      if (!node) {
        throw new Error("alert dialog overlay not mounted yet");
      }

      return node as HTMLElement;
    });

    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);

    expect(
      document.querySelector("[data-slot='alert-dialog-content']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts", () => {
    renderAlertDialog({ defaultOpen: true });

    const trigger = document.querySelector(
      "[data-slot='alert-dialog-trigger']",
    ) as HTMLElement | null;
    const overlay = document.querySelector(
      "[data-slot='alert-dialog-overlay']",
    ) as HTMLElement | null;
    const content = document.querySelector(
      "[data-slot='alert-dialog-content']",
    ) as HTMLElement | null;
    const cancel = screen.getByRole("button", { name: "Annuler" });
    const action = screen.getByRole("button", { name: "Supprimer" });

    expect(trigger?.className ?? "").toContain("cursor-pointer");

    expect(overlay?.className ?? "").toContain("bg-muted/80");
    expect(overlay?.className ?? "").toContain("data-[state=open]:animate-in");

    expect(content?.className ?? "").toContain("border-border");
    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("data-[state=open]:zoom-in-95");

    expect(cancel.className).toContain("border-outline-border");
    expect(cancel.className).toContain("focus-visible:border-ring");
    expect(cancel.className).toContain("focus-visible:ring-ring-soft");
    expect(cancel.className).not.toContain("focus-visible:ring-ring/50");

    expect(action.className).toContain("bg-primary");
    expect(action.className).toContain("focus-visible:border-ring");
    expect(action.className).toContain("focus-visible:ring-ring-soft");
    expect(action.className).not.toContain("focus-visible:ring-ring/50");
  });

  it("allows trigger, cancel, and action slot override when using asChild", async () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Ouvrir via enfant
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Titre</AlertDialogTitle>
          <AlertDialogDescription>Description</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button data-slot="custom-cancel" type="button">
                Annuler via enfant
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button data-slot="custom-action" type="button">
                Valider via enfant
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await waitForAlertDialogContent();

    expect(
      screen.getByRole("button", { hidden: true, name: "Ouvrir via enfant" }),
    ).toHaveAttribute("data-slot", "custom-trigger");
    expect(
      screen.getByRole("button", { name: "Annuler via enfant" }),
    ).toHaveAttribute("data-slot", "custom-cancel");
    expect(
      screen.getByRole("button", { name: "Valider via enfant" }),
    ).toHaveAttribute("data-slot", "custom-action");

    expect(
      document.querySelector("[data-slot='alert-dialog-trigger']"),
    ).toBeNull();
    expect(
      document.querySelector("[data-slot='alert-dialog-cancel']"),
    ).toBeNull();
    expect(
      document.querySelector("[data-slot='alert-dialog-action']"),
    ).toBeNull();
  });

  it("merges className on content and layout helpers", () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent className="contenu-personnalise">
          <AlertDialogHeader className="entete-personnalisee">
            <AlertDialogTitle>Titre</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pied-personnalise">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction>Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(
      document.querySelector("[data-slot='alert-dialog-content']")?.className ??
        "",
    ).toContain("contenu-personnalise");
    expect(
      document.querySelector("[data-slot='alert-dialog-header']")?.className ??
        "",
    ).toContain("entete-personnalisee");
    expect(
      document.querySelector("[data-slot='alert-dialog-footer']")?.className ??
        "",
    ).toContain("pied-personnalise");
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger ref={triggerRef}>Ouvrir</AlertDialogTrigger>
        <AlertDialogContent ref={contentRef}>
          <AlertDialogTitle>Titre</AlertDialogTitle>
          <AlertDialogDescription>Description</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction>Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    renderAlertDialog({ defaultOpen: true });

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
