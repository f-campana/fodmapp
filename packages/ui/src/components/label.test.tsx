import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Label } from "./label";

describe("Label", () => {
  it("associates label clicks with the related form control", async () => {
    const user = userEvent.setup();

    render(
      <div className="flex items-center gap-2">
        <input id="daily-reminders" type="checkbox" />
        <Label htmlFor="daily-reminders">Daily reminders</Label>
      </div>,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Daily reminders" });

    await user.click(screen.getByText("Daily reminders"));

    expect(checkbox).toBeChecked();
  });

  it("renders data-slot, keeps the disabled-peer contract, and merges className", () => {
    render(
      <Label htmlFor="nom" className="mon-label">
        Name
      </Label>,
    );

    const label = screen.getByText("Name");
    expect(label).toHaveAttribute("data-slot", "label");
    expect(label.className).toContain("peer-disabled:cursor-not-allowed");
    expect(label.className).toContain("peer-disabled:opacity-50");
    expect(label.className).toContain("mon-label");
  });

  it("forwards ref to label element", () => {
    const ref = createRef<HTMLLabelElement>();

    render(
      <Label ref={ref} htmlFor="city">
        City
      </Label>,
    );

    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <div>
        <Label htmlFor="postal-code">Postal code</Label>
        <input id="postal-code" type="text" />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
