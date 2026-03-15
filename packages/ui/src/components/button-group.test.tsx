import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import { ButtonGroup } from "./button-group";

describe("ButtonGroup", () => {
  it("renders role='group' and default horizontal orientation", () => {
    render(
      <ButtonGroup aria-label="Pagination">
        <Button>Précédent</Button>
        <Button>Suivant</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Pagination" });
    expect(group).toHaveAttribute("data-slot", "button-group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
  });

  it("keeps internal data hooks stable when consumer props collide", () => {
    render(
      <ButtonGroup
        aria-label="Actions"
        data-orientation="custom-orientation"
        data-slot="custom-slot"
      >
        <Button>Modifier</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Actions" });
    expect(group).toHaveAttribute("data-slot", "button-group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
  });

  it("supports vertical orientation", () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>Monter</Button>
        <Button>Descendre</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group.className).toContain("flex-col");
  });

  it("applies child-button grouping classes", () => {
    render(
      <ButtonGroup>
        <Button>A</Button>
        <Button>B</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    expect(group.className).toContain("[&>[data-slot=button]]:rounded-none");
    expect(group.className).toContain("[&>[data-slot=button]]:-ms-px");
    expect(group.className).toContain(
      "[&>[data-slot=button]:first-child]:rounded-s-(--radius)",
    );
    expect(group.className).toContain(
      "[&>[data-slot=button]:last-child]:rounded-e-(--radius)",
    );
  });

  it("applies vertical seam and edge classes", () => {
    render(
      <ButtonGroup aria-label="Étapes" orientation="vertical">
        <Button>Préparer</Button>
        <Button>Vérifier</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Étapes" });
    expect(group.className).toContain("[&>[data-slot=button]]:-mt-px");
    expect(group.className).toContain(
      "[&>[data-slot=button]:first-child]:rounded-t-(--radius)",
    );
    expect(group.className).toContain(
      "[&>[data-slot=button]:last-child]:rounded-b-(--radius)",
    );
  });

  it("merges className", () => {
    render(
      <ButtonGroup className="mon-groupe">
        <Button>Filtrer</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("group").className).toContain("mon-groupe");
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ButtonGroup ref={ref}>
        <Button>Filtrer</Button>
      </ButtonGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <ButtonGroup aria-label="Confirmation">
        <Button>Oui</Button>
        <Button>Non</Button>
      </ButtonGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
