import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("links label and control", () => {
    render(
      <Field id="email" label="Adresse email">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText("Adresse email")).toHaveAttribute("id", "email");
  });

  it("exposes hint and error through aria-describedby", () => {
    render(
      <Field id="quantity" label="Quantité" hint="En grammes" error="Valeur requise">
        <Input />
      </Field>,
    );

    const input = screen.getByLabelText("Quantité");
    expect(input).toHaveAttribute("aria-describedby", "quantity-hint quantity-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("En grammes")).toHaveAttribute("id", "quantity-hint");
    expect(screen.getByText("Valeur requise")).toHaveAttribute("id", "quantity-error");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Field id="nom" label="Nom complet">
        <Input />
      </Field>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
