import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders textbox semantics and data-slot", () => {
    render(<Textarea placeholder="Décrire le repas" />);

    const textarea = screen.getByPlaceholderText("Décrire le repas");
    expect(textarea).toHaveAttribute("data-slot", "textarea");
    expect(textarea).toHaveAttribute("placeholder", "Décrire le repas");
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
