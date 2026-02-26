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

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Card>
        <CardContent>Contenu</CardContent>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
