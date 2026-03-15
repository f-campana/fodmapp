import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders textbox semantics with native label association", () => {
    render(
      <>
        <label htmlFor="meal-notes">Notes</label>
        <Textarea id="meal-notes" placeholder="Décrire le repas" />
      </>,
    );

    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea).toHaveAttribute("data-slot", "textarea");
    expect(textarea).toHaveAttribute("placeholder", "Décrire le repas");
  });

  it("keeps the internal data-slot stable when consumer props collide", () => {
    render(<Textarea aria-label="Commentaire" data-slot="custom-textarea" />);

    expect(
      screen.getByRole("textbox", { name: "Commentaire" }),
    ).toHaveAttribute("data-slot", "textarea");
  });

  it("supports value changes", () => {
    const onChange = vi.fn();

    render(<Textarea aria-label="Note" onChange={onChange} />);
    const textarea = screen.getByRole("textbox", { name: "Note" });

    fireEvent.change(textarea, { target: { value: "Sans oignon" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue("Sans oignon");
  });

  it("applies invalid token classes", () => {
    render(<Textarea aria-invalid aria-label="Champ invalide" />);

    const textarea = screen.getByRole("textbox", { name: "Champ invalide" });
    expect(textarea.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    expect(textarea.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  });

  it("supports disabled multiline editing state", () => {
    render(<Textarea aria-label="Résumé" disabled rows={5} />);

    const textarea = screen.getByRole("textbox", { name: "Résumé" });
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("rows", "5");
    expect(textarea.className).toContain("disabled:cursor-not-allowed");
  });

  it("forwards ref to textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Référence" />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("merges className", () => {
    render(<Textarea className="ma-zone" aria-label="Zone" />);

    expect(screen.getByRole("textbox", { name: "Zone" }).className).toContain(
      "ma-zone",
    );
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Textarea aria-label="Commentaire" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
