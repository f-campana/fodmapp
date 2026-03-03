import { render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sonner, toast } from "./sonner";

afterEach(() => {
  toast.dismiss();
});

describe("Sonner", () => {
  it("renders slot marker and semantic toaster classes", () => {
    const { container } = render(<Sonner />);

    const marker = container.querySelector("[data-slot='sonner']");

    expect(marker).toBeTruthy();
    expect(marker?.className ?? "").toContain(
      "[&_[data-sonner-toast]]:bg-popover",
    );
    expect(marker?.className ?? "").toContain(
      "[&_[data-sonner-toast]]:text-popover-foreground",
    );
    expect(marker?.className ?? "").toContain(
      "[&_[data-sonner-toast]]:border-border",
    );
  });

  it("shows toast content through exported toast function", async () => {
    render(<Sonner />);

    toast("Sauvegarde terminee");

    await screen.findByText("Sauvegarde terminee");
  });

  it("applies semantic classes to action and cancel buttons", async () => {
    const onAction = vi.fn();
    const onCancel = vi.fn();

    render(<Sonner />);

    toast("Confirmer la suppression", {
      action: { label: "Confirmer", onClick: onAction },
      cancel: { label: "Annuler", onClick: onCancel },
    });

    const action = await screen.findByRole("button", { name: "Confirmer" });
    const cancel = await screen.findByRole("button", { name: "Annuler" });

    expect(action.className).toContain("bg-primary");
    expect(cancel.className).toContain("border-border");
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
    const { container } = render(<Sonner />);

    toast("Notification");

    await screen.findByText("Notification");

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
