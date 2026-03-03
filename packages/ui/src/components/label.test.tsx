import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Label } from "./label";

describe("Label", () => {
  it("associates label with form control", () => {
    render(
      <div>
        <Label htmlFor="email">Adresse e-mail</Label>
        <input id="email" type="email" />
      </div>,
    );

    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "id",
      "email",
    );
  });

  it("renders data-slot and merges className", () => {
    render(
      <Label htmlFor="nom" className="mon-label">
        Nom
      </Label>,
    );

    const label = screen.getByText("Nom");
    expect(label).toHaveAttribute("data-slot", "label");
    expect(label.className).toContain("mon-label");
  });

  it("forwards ref to label element", () => {
    const ref = createRef<HTMLLabelElement>();

    render(
      <Label ref={ref} htmlFor="ville">
        Ville
      </Label>,
    );

    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <div>
        <Label htmlFor="code">Code postal</Label>
        <input id="code" type="text" />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
