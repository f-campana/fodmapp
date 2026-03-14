import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "./input-group";

describe("InputGroup", () => {
  it("keeps the root role and compound slot markers stable", () => {
    const { container } = render(
      <InputGroup data-slot="custom-group" role="presentation">
        <InputGroupText data-slot="custom-text">https://</InputGroupText>
        <InputGroupInput data-slot="custom-input" placeholder="mon-profil" />
        <InputGroupAddon data-slot="custom-addon">.fodmap.app</InputGroupAddon>
      </InputGroup>,
    );

    const group = screen.getByRole("group");

    expect(group).toHaveAttribute("data-slot", "input-group");
    expect(
      container.querySelector("[data-slot='input-group-text']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='input-group-input']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='input-group-addon']"),
    ).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-group']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-text']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-input']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-addon']")).toBeNull();
  });

  it("supports addon and button interaction composition", () => {
    const onClick = vi.fn();

    render(
      <InputGroup>
        <InputGroupAddon>Code</InputGroupAddon>
        <InputGroupInput defaultValue="12345" />
        <InputGroupButton onClick={onClick}>Valider</InputGroupButton>
      </InputGroup>,
    );

    const button = screen.getByRole("button", { name: "Valider" });

    expect(button.className).toContain("cursor-pointer");

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the input flexible while surrounding text truncates first", () => {
    render(
      <InputGroup>
        <InputGroupText>https://</InputGroupText>
        <InputGroupInput placeholder="journal-clinique-tres-detaille" />
        <InputGroupAddon>.centre-de-suivi-fodmap.fr</InputGroupAddon>
      </InputGroup>,
    );

    const group = screen.getByRole("group");
    const input = screen.getByPlaceholderText("journal-clinique-tres-detaille");
    const text = screen.getByText("https://");
    const addon = screen.getByText(".centre-de-suivi-fodmap.fr");

    expect(group.className).toContain("overflow-hidden");
    expect(input.className).toContain("min-w-[5.5rem]");
    expect(input.className).toContain("flex-[1_1_7rem]");
    expect(text.className).toContain("max-w-[45%]");
    expect(text.className).toContain("truncate");
    expect(addon.className).toContain("max-w-[45%]");
    expect(addon.className).toContain("truncate");
  });

  it("applies disabled and invalid contracts", () => {
    render(
      <InputGroup>
        <InputGroupText>OTP</InputGroupText>
        <InputGroupInput aria-invalid disabled placeholder="0000" />
      </InputGroup>,
    );

    const group = screen.getByRole("group");
    const input = screen.getByPlaceholderText("0000");

    expect(group.className).toContain("focus-within:ring-ring-soft");
    expect(group.className).toContain("has-[:disabled]:opacity-50");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toBeDisabled();
    expect(input.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
    expect(input.className).toContain(
      "aria-invalid:ring-validation-error-ring-soft",
    );
  });

  it("merges className on the root and compounds", () => {
    const { container } = render(
      <InputGroup className="group-personnalise">
        <InputGroupAddon className="addon-personnalise">EUR</InputGroupAddon>
        <InputGroupInput className="input-personnalise" />
        <InputGroupButton className="button-personnalise">
          Ajouter
        </InputGroupButton>
      </InputGroup>,
    );

    expect(
      container.querySelector("[data-slot='input-group']")?.className ?? "",
    ).toContain("group-personnalise");
    expect(
      container.querySelector("[data-slot='input-group-addon']")?.className ??
        "",
    ).toContain("addon-personnalise");
    expect(
      container.querySelector("[data-slot='input-group-input']")?.className ??
        "",
    ).toContain("input-personnalise");
    expect(
      container.querySelector("[data-slot='input-group-button']")?.className ??
        "",
    ).toContain("button-personnalise");
  });

  it("forwards refs to the root, input, and button", () => {
    const rootRef = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const buttonRef = createRef<HTMLButtonElement>();

    render(
      <InputGroup ref={rootRef}>
        <InputGroupInput ref={inputRef} />
        <InputGroupButton ref={buttonRef}>Action</InputGroupButton>
      </InputGroup>,
    );

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <InputGroup>
        <InputGroupText>Nom</InputGroupText>
        <InputGroupInput aria-label="Nom d'utilisateur" />
      </InputGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
