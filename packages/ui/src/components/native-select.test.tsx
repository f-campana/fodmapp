import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { NativeSelect } from "./native-select";

describe("NativeSelect", () => {
  it("renders with native label association and data-slot", () => {
    render(
      <>
        <label htmlFor="vegetable-select">Légume</label>
        <NativeSelect defaultValue="carotte" id="vegetable-select">
          <option value="carotte">Carotte</option>
          <option value="courgette">Courgette</option>
        </NativeSelect>
      </>,
    );

    const select = screen.getByRole("combobox", { name: "Légume" });
    expect(select).toHaveAttribute("data-slot", "native-select");
    expect(select).toHaveValue("carotte");
  });

  it("keeps the internal data-slot stable when consumer props collide", () => {
    render(
      <NativeSelect aria-label="Choix" data-slot="custom-select">
        <option value="a">A</option>
      </NativeSelect>,
    );

    expect(screen.getByRole("combobox", { name: "Choix" })).toHaveAttribute(
      "data-slot",
      "native-select",
    );
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

  it("uses mobile-readable text sizing by default", () => {
    render(
      <NativeSelect aria-label="Céréale">
        <option value="riz">Riz</option>
      </NativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Céréale" });
    expect(select.className).toContain("text-base");
    expect(select.className).toContain("md:text-sm");
  });

  it("reserves trailing padding for the browser-owned indicator", () => {
    render(
      <NativeSelect aria-label="Grain">
        <option value="riz">Riz</option>
      </NativeSelect>,
    );

    expect(screen.getByRole("combobox", { name: "Grain" }).className).toContain(
      "pr-9",
    );
  });

  it("applies disabled cursor treatment", () => {
    render(
      <NativeSelect aria-label="Désactivé" disabled>
        <option value="riz">Riz</option>
      </NativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Désactivé" });
    expect(select).toBeDisabled();
    expect(select.className).toContain("disabled:cursor-not-allowed");
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
