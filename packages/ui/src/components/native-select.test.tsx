import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { NativeSelect } from "./native-select";

describe("NativeSelect", () => {
  it("renders combobox role and data-slot", () => {
    render(
      <NativeSelect defaultValue="carotte" aria-label="Légume">
        <option value="carotte">Carotte</option>
        <option value="courgette">Courgette</option>
      </NativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Légume" });
    expect(select).toHaveAttribute("data-slot", "native-select");
    expect(select).toHaveValue("carotte");
  });

  it("fires onChange", () => {
    const onChange = vi.fn();

    render(
      <NativeSelect aria-label="Aliment" onChange={onChange}>
        <option value="riz">Riz</option>
        <option value="avoine">Avoine</option>
      </NativeSelect>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Aliment" }), {
      target: { value: "avoine" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("applies invalid token classes", () => {
    render(
      <NativeSelect aria-invalid aria-label="Choix invalide">
        <option value="x">X</option>
      </NativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Choix invalide" });
    expect(select.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    expect(select.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  });

  it("forwards ref to select element", () => {
    const ref = createRef<HTMLSelectElement>();

    render(
      <NativeSelect ref={ref} aria-label="Référence">
        <option value="a">A</option>
      </NativeSelect>,
    );

    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it("merges className", () => {
    render(
      <NativeSelect className="ma-liste" aria-label="Liste">
        <option value="a">A</option>
      </NativeSelect>,
    );

    expect(screen.getByRole("combobox", { name: "Liste" }).className).toContain(
      "ma-liste",
    );
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <NativeSelect aria-label="Sélection">
        <option value="riz">Riz</option>
      </NativeSelect>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
