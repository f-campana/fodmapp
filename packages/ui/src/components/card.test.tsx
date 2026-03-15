import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders composed card parts with stable slot hooks", () => {
    const { container } = render(
      <Card>
        <CardHeader data-slot="custom-header">
          <CardTitle data-slot="custom-title">Galette salée</CardTitle>
          <CardDescription data-slot="custom-description">
            Version compatible FODMAP.
          </CardDescription>
          <CardAction data-slot="custom-action">12 min</CardAction>
        </CardHeader>
        <CardContent data-slot="custom-content">
          Ingrédients disponibles.
        </CardContent>
        <CardFooter data-slot="custom-footer">Recette</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Galette salée")).toBeInTheDocument();
    expect(screen.getByText("Version compatible FODMAP.")).toBeInTheDocument();
    expect(screen.getByText("12 min")).toBeInTheDocument();
    expect(screen.getByText("Ingrédients disponibles.")).toBeInTheDocument();
    expect(screen.getByText("Recette")).toBeInTheDocument();

    expect(screen.getByText("Galette salée").parentElement).toHaveAttribute(
      "data-slot",
      "card-header",
    );
    expect(screen.getByText("Galette salée")).toHaveAttribute(
      "data-slot",
      "card-title",
    );
    expect(screen.getByText("Version compatible FODMAP.")).toHaveAttribute(
      "data-slot",
      "card-description",
    );
    expect(screen.getByText("12 min")).toHaveAttribute(
      "data-slot",
      "card-action",
    );
    expect(screen.getByText("Ingrédients disponibles.")).toHaveAttribute(
      "data-slot",
      "card-content",
    );
    expect(screen.getByText("Recette")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
    expect(
      screen.getByText("Galette salée").closest("[data-slot='card']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='custom-header']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-title']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-description']"),
    ).toBeNull();
    expect(container.querySelector("[data-slot='custom-action']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-content']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-footer']")).toBeNull();
  });

  it("forwards ref to the card root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Résumé</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Card>
        <CardContent>Contenu</CardContent>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
