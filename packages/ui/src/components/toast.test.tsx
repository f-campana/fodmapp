import { render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";

import { Sonner, toast } from "./sonner";
import { Toast } from "./toast";

afterEach(() => {
  toast.dismiss();
});

describe("Toast helper", () => {
  it("shows content through Toast.show", async () => {
    render(<Sonner />);

    Toast.show("Notification enregistree");

    await screen.findByText("Notification enregistree");
  });

  it("supports success, info, warning, error, and loading helpers", async () => {
    render(<Sonner />);

    Toast.success("Succes");
    Toast.info("Information");
    Toast.warning("Attention");
    Toast.error("Erreur");
    Toast.loading("Chargement");

    await screen.findByText("Succes");
    await screen.findByText("Information");
    await screen.findByText("Attention");
    await screen.findByText("Erreur");
    await screen.findByText("Chargement");
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
    const { container } = render(<Sonner />);

    Toast.show("Notification a11y");

    await screen.findByText("Notification a11y");

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
