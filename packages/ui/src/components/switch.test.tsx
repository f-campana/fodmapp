import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./switch";

describe("Switch", () => {
  it("uses the linked label as its accessible name and toggles from label click", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <label htmlFor="notifications">Notifications</label>
        <Switch id="notifications" />
      </div>,
    );

    const control = screen.getByRole("switch", { name: "Notifications" });

    expect(control).toHaveAttribute("aria-checked", "false");

    await user.click(screen.getByText("Notifications"));

    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("fires onCheckedChange on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );

    await user.click(screen.getByRole("switch", { name: "Notifications" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not fire onCheckedChange when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Indisponible"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    const control = screen.getByRole("switch", { name: "Indisponible" });

    expect(control).toBeDisabled();

    await user.click(control);

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("keeps the root slot stable and renders the thumb slot", () => {
    render(<Switch aria-label="Basculer" data-slot="custom-switch" />);

    const root = screen.getByRole("switch", { name: "Basculer" });
    const thumb = root.querySelector("[data-slot='switch-thumb']");

    expect(root).toHaveAttribute("data-slot", "switch");
    expect(root).not.toHaveAttribute("data-slot", "custom-switch");
    expect(thumb).toHaveAttribute("data-slot", "switch-thumb");
  });

  it("uses semantic focus, invalid, and cursor classes", () => {
    render(<Switch aria-label="Erreur" aria-invalid="true" />);

    const root = screen.getByRole("switch", { name: "Erreur" });

    expect(root.className).toContain("cursor-pointer");
    expect(root.className).toContain("disabled:cursor-not-allowed");
    expect(root.className).toContain("focus-visible:border-ring");
    expect(root.className).toContain("focus-visible:ring-ring-soft");
    expect(root.className).not.toContain("focus-visible:ring-ring/50");
    expect(root.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    expect(root.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  });

  it("merges className", () => {
    render(<Switch aria-label="Classe" className="mon-switch" />);

    expect(screen.getByRole("switch", { name: "Classe" }).className).toContain(
      "mon-switch",
    );
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Switch ref={ref} aria-label="Reference" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Switch aria-label="Accessibilite" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
