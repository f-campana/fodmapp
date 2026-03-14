import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";

import { Sonner, toast } from "./sonner";
import { Toast } from "./toast";

afterEach(() => {
  toast.dismiss();
});

describe("Toast helper", () => {
  async function findToastSurface(text: string) {
    return waitFor(() => {
      const toastSurface = screen
        .getByText(text)
        .closest("[data-sonner-toast]") as HTMLElement | null;

      if (!toastSurface) {
        throw new Error("Toast surface not mounted yet");
      }

      return toastSurface;
    });
  }

  it("requires a mounted Sonner host to render notifications", async () => {
    render(<div />);

    Toast.show("Aucun hote monte");

    await waitFor(() => {
      expect(screen.queryByText("Aucun hote monte")).toBeNull();
    });
  });

  it("shows content through Toast.show", async () => {
    render(<Sonner />);

    Toast.show("Notification enregistree");

    await screen.findByText("Notification enregistree");

    const renderedToast = await findToastSurface("Notification enregistree");

    expect(renderedToast).toHaveAttribute("data-styled", "false");
    expect(renderedToast.className).toContain("bg-popover");
  });

  it("supports success, info, warning, error, and loading helpers with type accents", async () => {
    render(<Sonner />);

    Toast.success("Succes");
    Toast.info("Information");
    Toast.warning("Attention");
    Toast.error("Erreur");
    Toast.loading("Chargement");

    expect((await findToastSurface("Succes")).className).toContain(
      "border-success",
    );
    expect((await findToastSurface("Information")).className).toContain(
      "border-info",
    );
    expect((await findToastSurface("Attention")).className).toContain(
      "border-warning",
    );
    expect((await findToastSurface("Erreur")).className).toContain(
      "border-danger",
    );
    expect((await findToastSurface("Chargement")).className).toContain(
      "[&_[data-icon]]:text-muted-foreground",
    );
  });

  it("supports action callbacks through Toast.show options", async () => {
    const onAction = vi.fn();

    render(<Sonner />);

    Toast.show("Alternative ajoutee au diner", {
      action: {
        label: "Voir le plan",
        onClick: onAction,
      },
      duration: Number.POSITIVE_INFINITY,
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Voir le plan" }),
    );

    expect(
      screen.getByRole("button", { name: "Voir le plan" }).className,
    ).toContain("bg-primary");
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("supports promise flow", async () => {
    render(<Sonner />);

    Toast.promise(
      new globalThis.Promise<string>((resolve) => {
        setTimeout(() => resolve("Termine"), 10);
      }),
      {
        loading: "Traitement en cours",
        success: (message) => String(message),
        error: "Echec du traitement",
      },
    );

    await screen.findByText("Traitement en cours");
    await screen.findByText("Termine");
  });

  it("dismisses toast by id", async () => {
    render(<Sonner />);

    const toastId = Toast.show("A fermer", {
      duration: Number.POSITIVE_INFINITY,
    });

    await screen.findByText("A fermer");

    Toast.dismiss(toastId);

    await waitFor(() => {
      expect(screen.queryByText("A fermer")).toBeNull();
    });
  });

  it("keeps existing toast export behavior", async () => {
    render(<Sonner />);

    toast("Compatibilite maintenue");

    await screen.findByText("Compatibilite maintenue");
  });

  it("has no obvious a11y violations", async () => {
    render(<Sonner />);

    Toast.show("Notification a11y");

    await screen.findByText("Notification a11y");

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
  });
});
