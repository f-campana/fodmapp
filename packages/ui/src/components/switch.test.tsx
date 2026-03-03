import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./switch";

describe("Switch", () => {
  it("renders switch role", () => {
    render(<Switch aria-label="Mode sombre" />);

    expect(
      screen.getByRole("switch", { name: "Mode sombre" }),
    ).toBeInTheDocument();
  });

  it("fires onCheckedChange on click", () => {
    const onCheckedChange = vi.fn();

    render(
      <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Notifications" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not fire onCheckedChange when disabled", () => {
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Indisponible"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    screen.getByRole("switch", { name: "Indisponible" }).click();

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("renders data-slot and thumb slot", () => {
    render(<Switch aria-label="Basculer" />);

    const root = screen.getByRole("switch", { name: "Basculer" });
    const thumb = root.querySelector("[data-slot='switch-thumb']") ?? undefined;

    expect(root).toHaveAttribute("data-slot", "switch");
    expect(thumb).toHaveAttribute("data-slot", "switch-thumb");
  });

  it("uses semantic focus and invalid classes", () => {
    render(<Switch aria-label="Erreur" aria-invalid="true" />);

    const root = screen.getByRole("switch", { name: "Erreur" });
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

  it("forwards ref to underlying button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Switch ref={ref} aria-label="Référence" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Switch aria-label="Accessibilité" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
