import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders with default semantic role", () => {
    render(<Button>Valider</Button>);
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
  });

  it("supports click handlers", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Choisir</Button>);
    screen.getByRole("button", { name: "Choisir" }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports all shadcn variants", () => {
    render(
      <>
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Default" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Secondary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Outline" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Destructive" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ghost" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
  });

  it("supports asChild rendering", () => {
    render(
      <Button asChild>
        <a href="/ingredients">Ingrédients</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "Ingrédients" })).toHaveAttribute(
      "href",
      "/ingredients",
    );
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Button>Sauvegarder</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
