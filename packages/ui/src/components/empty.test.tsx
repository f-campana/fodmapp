import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "./empty";

describe("Empty", () => {
  it("keeps root and compound slot hooks stable", () => {
    const { container } = render(
      <Empty data-slot="custom-empty">
        <EmptyIcon data-slot="custom-icon">◌</EmptyIcon>
        <EmptyTitle data-slot="custom-title">Aucun résultat</EmptyTitle>
        <EmptyDescription data-slot="custom-description">
          Essayez un autre filtre.
        </EmptyDescription>
        <EmptyActions data-slot="custom-actions">
          <Button>Réinitialiser</Button>
        </EmptyActions>
      </Empty>,
    );

    expect(
      screen.getByText("Aucun résultat").closest("[data-slot='empty']"),
    ).toBeTruthy();
    expect(screen.getByText("◌")).toHaveAttribute("data-slot", "empty-icon");
    expect(screen.getByText("Aucun résultat")).toHaveAttribute(
      "data-slot",
      "empty-title",
    );
    expect(screen.getByText("Essayez un autre filtre.")).toHaveAttribute(
      "data-slot",
      "empty-description",
    );
    expect(
      screen.getByText("Réinitialiser").closest("[data-slot='empty-actions']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='custom-empty']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-icon']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-title']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-description']"),
    ).toBeNull();
    expect(container.querySelector("[data-slot='custom-actions']")).toBeNull();
  });

  it("forwards ref to root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Empty ref={ref}>Contenu vide</Empty>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("data-slot", "empty");
  });

  it("merges className", () => {
    render(<Empty className="ma-zone">Aucun élément</Empty>);

    expect(
      screen.getByText("Aucun élément").closest("[data-slot='empty']")
        ?.className,
    ).toContain("ma-zone");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Empty>
        <EmptyTitle>Rien à afficher</EmptyTitle>
        <EmptyDescription>Ajoutez une nouvelle entrée.</EmptyDescription>
      </Empty>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
