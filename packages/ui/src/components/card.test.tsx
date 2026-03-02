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
  it("renders composed card parts", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Galette salée</CardTitle>
          <CardDescription>Version compatible FODMAP.</CardDescription>
          <CardAction>12 min</CardAction>
        </CardHeader>
        <CardContent>Ingrédients disponibles.</CardContent>
        <CardFooter>Recette</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Galette salée")).toBeInTheDocument();
    expect(screen.getByText("Version compatible FODMAP.")).toBeInTheDocument();
    expect(screen.getByText("12 min")).toBeInTheDocument();
    expect(screen.getByText("Ingrédients disponibles.")).toBeInTheDocument();
    expect(screen.getByText("Recette")).toBeInTheDocument();
  });

  it("forwards ref to the card root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Résumé</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("exposes data-slot attributes for card compounds", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Titre</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Corps</CardContent>
        <CardFooter>Pied</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Titre").parentElement).toHaveAttribute(
      "data-slot",
      "card-header",
    );
    expect(screen.getByText("Titre")).toHaveAttribute(
      "data-slot",
      "card-title",
    );
    expect(screen.getByText("Description")).toHaveAttribute(
      "data-slot",
      "card-description",
    );
    expect(screen.getByText("Action")).toHaveAttribute(
      "data-slot",
      "card-action",
    );
    expect(screen.getByText("Corps")).toHaveAttribute(
      "data-slot",
      "card-content",
    );
    expect(screen.getByText("Pied")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
    expect(
      screen.getByText("Titre").closest("[data-slot='card']"),
    ).toBeTruthy();
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
