import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sonner, toast } from "./sonner";

afterEach(() => {
  toast.dismiss();
});

describe("Sonner", () => {
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

  it("renders slot marker and tokenized unstyled notifications", async () => {
    const { container } = render(<Sonner />);

    const marker = container.querySelector("[data-slot='sonner']");

    expect(marker).toBeTruthy();

    toast("Sauvegarde terminee");

    const toaster = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-sonner-toaster]",
      ) as HTMLElement | null;
      if (!node) {
        throw new Error("Sonner host not mounted yet");
      }

      return node;
    });
    const renderedToast = await findToastSurface("Sauvegarde terminee");

    expect(toaster.className).toContain("[font-family:var(--font-body)]");
    expect(renderedToast).toHaveAttribute("data-styled", "false");
    expect(renderedToast).toHaveAttribute("data-rich-colors", "false");
    expect(renderedToast.className).toContain("bg-popover");
    expect(renderedToast.className).toContain("rounded-(--radius)");
  });

  it("shows toast content through exported toast function", async () => {
    render(<Sonner />);

    toast("Sauvegarde terminee");

    await screen.findByText("Sauvegarde terminee");
  });

  it("keeps status toasts on a neutral surface with tokenized icon chips", async () => {
    render(<Sonner />);

    toast.success("Sauvegarde reussie");

    const renderedToast = await findToastSurface("Sauvegarde reussie");

    expect(renderedToast.className).toContain("border-border");
    expect(renderedToast.className).toContain(
      "[&_[data-icon]]:border-success/25",
    );
    expect(renderedToast.className).toContain("[&_[data-icon]]:bg-success/10");
    expect(
      renderedToast.querySelector("[data-slot='sonner-success-icon']"),
    ).toBeTruthy();
  });

  it("applies tokenized classes to action and cancel buttons", async () => {
    const onAction = vi.fn();
    const onCancel = vi.fn();
    const onSecondaryCancel = vi.fn();

    render(<Sonner />);

    toast("Confirmer la suppression", {
      action: { label: "Confirmer", onClick: onAction },
      cancel: { label: "Annuler la suppression", onClick: onCancel },
    });

    const action = await screen.findByRole("button", { name: "Confirmer" });
    const cancel = await screen.findByRole("button", {
      name: "Annuler la suppression",
    });

    expect(action.className).toContain("bg-primary");
    expect(action.className).toContain("col-start-2");
    expect(cancel.className).toContain("border-outline-border");
    expect(cancel.className).toContain("col-start-3");

    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);

    toast("Archiver cette suggestion", {
      cancel: {
        label: "Annuler l'archivage",
        onClick: onSecondaryCancel,
      },
      duration: Number.POSITIVE_INFINITY,
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Annuler l'archivage" }),
    );
    expect(onSecondaryCancel).toHaveBeenCalledTimes(1);
  });

  it("passes through viewport and close-button accessibility labels", async () => {
    render(
      <Sonner
        containerAriaLabel="Notifications produit"
        toastOptions={{ closeButtonAriaLabel: "Fermer la notification" }}
      />,
    );

    toast("Analyse terminee", { duration: Number.POSITIVE_INFINITY });

    const liveRegion = screen.getByLabelText(/Notifications produit/i);
    const closeButton = await screen.findByRole("button", {
      name: "Fermer la notification",
    });

    expect(liveRegion).toBeInTheDocument();
    expect(closeButton.className).toContain("col-start-4");

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Analyse terminee")).toBeNull();
    });
  });

  it("uses a custom centered loading icon instead of Sonner's absolute spinner wrapper", async () => {
    render(<Sonner />);

    toast.loading("Synchronisation en cours");

    const renderedToast = await findToastSurface("Synchronisation en cours");
    const loader = await waitFor(() => {
      const node = renderedToast.querySelector(
        "[data-slot='sonner-loading-icon']",
      );
      if (!node) {
        throw new Error("Loader not mounted yet");
      }

      return node;
    });

    expect(loader.className).toContain("animate-spin");
    expect(renderedToast.querySelector(".sonner-loading-wrapper")).toBeNull();
    expect(renderedToast.className).toContain(
      "grid-cols-[auto_minmax(0,1fr)_auto_auto]",
    );
    expect(renderedToast.className).toContain(
      "data-[type=loading]:[&_[data-content]]:self-center",
    );
  });

  it("merges className", async () => {
    const { container } = render(<Sonner className="sonner-personnalise" />);

    const wrapper = await waitFor(() => {
      const node = container.querySelector(
        "[data-slot='sonner']",
      ) as HTMLElement | null;
      if (!node) {
        throw new Error("Sonner wrapper not mounted yet");
      }
      return node;
    });

    expect(wrapper.className).toContain("sonner-personnalise");
  });

  it("has no obvious a11y violations", async () => {
    render(<Sonner />);

    toast.success("Notification");

    await screen.findByText("Notification");

    const results = await axe(document.body);

    expect(results).toHaveNoViolations();
  });
});
