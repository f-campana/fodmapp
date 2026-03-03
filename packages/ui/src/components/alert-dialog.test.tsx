import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

  it("opens from trigger and closes via cancel and action", async () => {
    renderAlertDialog();

    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer la substitution" }),
    );

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='alert-dialog-content']");
      if (!node) {
        throw new Error("alert dialog content not mounted yet");
      }
      return node as HTMLElement;
    });

    expect(content.textContent ?? "").toContain(
      "Cette action est irreversible.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='alert-dialog-content']"),
      ).toBeNull();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer la substitution" }),
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='alert-dialog-content']"),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='alert-dialog-content']"),
      ).toBeNull();
    });
  });

  it("renders all expected slots", async () => {
    const { container } = renderAlertDialog();

    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer la substitution" }),
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='alert-dialog-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='alert-dialog']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='alert-dialog-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-portal']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-overlay']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-header']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-footer']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-title']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-description']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-cancel']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='alert-dialog-action']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts", () => {
    renderAlertDialog({ defaultOpen: true });

    const overlay = document.querySelector(
      "[data-slot='alert-dialog-overlay']",
    ) as HTMLElement | null;
    const content = document.querySelector(
      "[data-slot='alert-dialog-content']",
    ) as HTMLElement | null;
    const cancel = document.querySelector(
      "[data-slot='alert-dialog-cancel']",
    ) as HTMLElement | null;
    const action = document.querySelector(
      "[data-slot='alert-dialog-action']",
    ) as HTMLElement | null;

    expect(overlay?.className ?? "").toContain("bg-muted/80");
    expect(overlay?.className ?? "").toContain("data-[state=open]:animate-in");
    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("data-[state=open]:zoom-in-95");

    expect(cancel?.className ?? "").toContain("focus-visible:border-ring");
    expect(cancel?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(cancel?.className ?? "").not.toContain("focus-visible:ring-ring/50");

    expect(action?.className ?? "").toContain("focus-visible:border-ring");
    expect(action?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(action?.className ?? "").not.toContain("focus-visible:ring-ring/50");
  });

  it("supports trigger asChild", () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button">Declencher la boite</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Titre</AlertDialogTitle>
          <AlertDialogDescription>Description</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction>Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const trigger = screen.getByRole("button", { name: "Declencher la boite" });
    expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
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
    const { container } = renderAlertDialog({ defaultOpen: true });

    expect(await axe(container)).toHaveNoViolations();
  });
});
