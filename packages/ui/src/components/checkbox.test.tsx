import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders checkbox role", () => {
    render(<Checkbox aria-label="Accepter" />);

    expect(
      screen.getByRole("checkbox", { name: "Accepter" }),
    ).toBeInTheDocument();
  });

  it("fires onCheckedChange on click", () => {
    const onCheckedChange = vi.fn();

    render(
      <Checkbox aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Notifications" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not fire onCheckedChange when disabled", () => {
    const onCheckedChange = vi.fn();

    render(
      <Checkbox
        aria-label="Indisponible"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    screen.getByRole("checkbox", { name: "Indisponible" }).click();

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("renders slot and semantic class contracts", () => {
    render(<Checkbox aria-label="Conditions" aria-invalid="true" />);

    const checkbox = screen.getByRole("checkbox", { name: "Conditions" });
    expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    expect(checkbox.className).toContain("focus-visible:border-ring");
    expect(checkbox.className).toContain("focus-visible:ring-ring-soft");
    expect(checkbox.className).not.toContain("focus-visible:ring-ring/50");
    expect(checkbox.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    expect(checkbox.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  });

  it("renders indicator slot when checked", () => {
    render(<Checkbox aria-label="Option" defaultChecked />);

    const indicator =
      screen
        .getByRole("checkbox", { name: "Option" })
        .querySelector("[data-slot='checkbox-indicator']") ?? undefined;

    expect(indicator).toHaveAttribute("data-slot", "checkbox-indicator");
  });

  it("forwards ref to underlying button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Checkbox ref={ref} aria-label="Ref" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Checkbox aria-label="Accessibilité" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
