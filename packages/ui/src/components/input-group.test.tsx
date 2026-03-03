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
  it("renders root and compound slots", () => {
    const { container } = render(
      <InputGroup>
        <InputGroupText>https://</InputGroupText>
        <InputGroupInput placeholder="mon-profil" />
        <InputGroupAddon>.fodmap.app</InputGroupAddon>
      </InputGroup>,
    );

    expect(screen.getByRole("group")).toHaveAttribute(
      "data-slot",
      "input-group",
    );
    expect(
      container.querySelector("[data-slot='input-group-text']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='input-group-input']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='input-group-addon']"),
    ).toBeTruthy();
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

    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(onClick).toHaveBeenCalledTimes(1);
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

  it("merges className on root and compounds", () => {
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

  it("forwards refs to root, input, and button", () => {
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
