import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";

describe("Item", () => {
  it("renders root and compound slots", () => {
    render(
      <ItemGroup>
        <Item>
          <ItemMedia>🍎</ItemMedia>
          <ItemContent>
            <ItemHeader>
              <ItemTitle>Pomme verte</ItemTitle>
              <ItemActions>2 portions</ItemActions>
            </ItemHeader>
            <ItemDescription>Faible FODMAP</ItemDescription>
          </ItemContent>
        </Item>
        <ItemSeparator />
      </ItemGroup>,
    );

    expect(screen.getByText("🍎")).toHaveAttribute("data-slot", "item-media");
    expect(
      screen.getByText("Pomme verte").closest("[data-slot='item']"),
    ).toBeTruthy();
    expect(screen.getByText("Pomme verte")).toHaveAttribute(
      "data-slot",
      "item-title",
    );
    expect(screen.getByText("Pomme verte").tagName).toBe("DIV");
    expect(screen.getByText("2 portions")).toHaveAttribute(
      "data-slot",
      "item-actions",
    );
    expect(screen.getByText("Faible FODMAP")).toHaveAttribute(
      "data-slot",
      "item-description",
    );
    expect(
      screen.getByText("Pomme verte").closest("[data-slot='item-group']"),
    ).toBeTruthy();
    expect(screen.getByRole("separator")).toHaveAttribute(
      "data-slot",
      "item-separator",
    );
  });

  it("supports asChild rendering", () => {
    render(
      <Item asChild>
        <a href="/ingredients/pomme">Voir la fiche</a>
      </Item>,
    );

    const link = screen.getByRole("link", { name: "Voir la fiche" });
    expect(link).toHaveAttribute("href", "/ingredients/pomme");
    expect(link).toHaveAttribute("data-slot", "item");
  });

  it("merges className", () => {
    render(<Item className="mon-item">Ligne</Item>);

    expect(
      screen.getByText("Ligne").closest("[data-slot='item']")?.className,
    ).toContain("mon-item");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Item>
        <ItemContent>
          <ItemTitle>Carotte</ItemTitle>
          <ItemDescription>Cuisson vapeur</ItemDescription>
        </ItemContent>
      </Item>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
