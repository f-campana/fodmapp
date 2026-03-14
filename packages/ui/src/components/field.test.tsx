import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("links the label to its wrapped control", () => {
    render(
      <Field id="email" label="Adresse email">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText("Adresse email")).toHaveAttribute(
      "id",
      "email",
    );
  });

  it("merges existing aria-describedby with hint and error semantics", () => {
    render(
      <>
        <p id="quantity-existing">Mesure utilisee dans le plan</p>
        <Field
          id="quantity"
          label="Quantite"
          hint="En grammes"
          error="Valeur requise"
        >
          <Input aria-describedby="quantity-existing" />
        </Field>
      </>,
    );

    const input = screen.getByLabelText("Quantite");

    expect(input).toHaveAttribute(
      "aria-describedby",
      "quantity-existing quantity-hint quantity-error",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("En grammes")).toHaveAttribute(
      "id",
      "quantity-hint",
    );
    expect(screen.getByText("Valeur requise")).toHaveAttribute(
      "id",
      "quantity-error",
    );
  });

  it("shows the required marker without forcing an invalid state", () => {
    render(
      <Field id="nom" label="Nom complet" required hint="Comme sur le dossier">
        <Input />
      </Field>,
    );

    const input = screen.getByLabelText(/Nom complet/);

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby", "nom-hint");
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("uses the form-scale typography contract for label, hint, and error text", () => {
    render(
      <Field
        error="Valeur requise"
        hint="En grammes"
        id="quantity"
        label="Quantite"
      >
        <Input />
      </Field>,
    );

    const label = screen.getByText("Quantite");
    const hint = screen.getByText("En grammes");
    const error = screen.getByText("Valeur requise");

    expect(label.className).toContain("text-sm");
    expect(label.className).not.toContain("tracking-wide");
    expect(hint.className).toContain("text-sm");
    expect(hint.className).not.toContain("text-xs");
    expect(error.className).toContain("text-sm");
    expect(error.className).not.toContain("text-xs");
  });

  it("requires an explicit id on the field or the wrapped control", () => {
    expect(() =>
      render(
        <Field label="Nom complet">
          <Input />
        </Field>,
      ),
    ).toThrow("Field requires either an `id` prop or a child with an `id`.");
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
