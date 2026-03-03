import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import { ButtonGroup } from "./button-group";

describe("ButtonGroup", () => {
  it("renders role='group' and default horizontal orientation", () => {
    render(
      <ButtonGroup>
        <Button>Précédent</Button>
        <Button>Suivant</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
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
  });

  it("merges className", () => {
    render(
      <ButtonGroup className="mon-groupe">
        <Button>Filtrer</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("group").className).toContain("mon-groupe");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <ButtonGroup>
        <Button>Oui</Button>
        <Button>Non</Button>
      </ButtonGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
