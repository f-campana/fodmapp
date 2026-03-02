import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  // -------------------------------------------------------------------------
  // Semantic role and defaults
  // -------------------------------------------------------------------------

  it("renders with default semantic role", () => {
    render(<Button>Valider</Button>);
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
  });

  it("defaults to type='button' to prevent implicit form submission", () => {
    render(<Button>Envoyer</Button>);
    expect(screen.getByRole("button", { name: "Envoyer" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("allows type override to 'submit' when explicitly set", () => {
    render(<Button type="submit">Soumettre</Button>);
    expect(screen.getByRole("button", { name: "Soumettre" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  // -------------------------------------------------------------------------
  // Data attributes
  // -------------------------------------------------------------------------

  it("renders data-slot='button' for parent-context selectors", () => {
    render(<Button>Confirmer</Button>);
    expect(screen.getByRole("button", { name: "Confirmer" })).toHaveAttribute(
      "data-slot",
      "button",
    );
  });

  it("exposes data-variant and data-size for styling hooks", () => {
    render(
      <Button variant="outline" size="sm">
        Détails
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Détails" });
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveAttribute("data-size", "sm");
  });

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------

  it("supports click handlers", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Choisir</Button>);
    screen.getByRole("button", { name: "Choisir" }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Indisponible
      </Button>,
    );
    screen.getByRole("button", { name: "Indisponible" }).click();
    expect(onClick).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Variants
  // -------------------------------------------------------------------------

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

  it("uses token-based hover on primary, not opacity hack", () => {
    render(<Button variant="default">Appliquer</Button>);
    const classes = screen.getByRole("button", { name: "Appliquer" }).className;
    expect(classes).toContain("hover:bg-primary-hover");
    expect(classes).not.toContain("hover:bg-primary/80");
    expect(classes).not.toContain("hover:bg-primary/90");
  });

  it("uses token-based hover on secondary, not opacity hack", () => {
    render(<Button variant="secondary">Comparer</Button>);
    const classes = screen.getByRole("button", { name: "Comparer" }).className;
    expect(classes).toContain("hover:bg-secondary-hover");
    expect(classes).not.toContain("hover:bg-secondary/80");
  });

  it("uses two-layer focus: border-ring + ring-ring-soft", () => {
    render(<Button>Focaliser</Button>);
    const classes = screen.getByRole("button", { name: "Focaliser" }).className;
    expect(classes).toContain("focus-visible:border-ring");
    expect(classes).toContain("focus-visible:ring-ring-soft");
    expect(classes).not.toContain("focus-visible:ring-ring/50");
  });

  it("renders destructive as subtle tinted variant", () => {
    render(<Button variant="destructive">Supprimer</Button>);
    const classes = screen.getByRole("button", { name: "Supprimer" }).className;
    // New subtle pattern: tinted bg + destructive text
    expect(classes).toContain("text-destructive");
    expect(classes).toContain("bg-destructive/10");
    // NOT solid red background
    expect(classes).not.toContain("text-destructive-foreground");
  });

  // -------------------------------------------------------------------------
  // Sizes (including new xs, icon-xs, icon-sm, icon-lg)
  // -------------------------------------------------------------------------

  it("supports all size variants", () => {
    render(
      <>
        <Button size="xs">Très petit</Button>
        <Button size="sm">Petit</Button>
        <Button size="default">Standard</Button>
        <Button size="lg">Grand</Button>
        <Button size="icon" aria-label="Icône">
          ✕
        </Button>
        <Button size="icon-xs" aria-label="Icône très petite">
          ✕
        </Button>
        <Button size="icon-sm" aria-label="Icône petite">
          ✕
        </Button>
        <Button size="icon-lg" aria-label="Icône grande">
          ✕
        </Button>
      </>,
    );

    expect(
      screen.getByRole("button", { name: "Très petit" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Petit" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Standard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grand" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Icône" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Icône très petite" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Icône petite" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Icône grande" }),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Ref forwarding (React 19 — ref as regular prop)
  // -------------------------------------------------------------------------

  it("forwards ref to the underlying button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Référence</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Référence");
  });

  // -------------------------------------------------------------------------
  // className merging
  // -------------------------------------------------------------------------

  it("merges consumer className with variant classes", () => {
    render(
      <Button className="my-custom-class" variant="default">
        Personnalisé
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Personnalisé" });
    expect(button.className).toContain("my-custom-class");
    expect(button.className).toContain("bg-primary");
  });

  // -------------------------------------------------------------------------
  // asChild / polymorphic rendering
  // -------------------------------------------------------------------------

  it("supports asChild rendering as anchor", () => {
    render(
      <Button asChild>
        <a href="/ingredients">Ingrédients</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ingrédients" });
    expect(link).toHaveAttribute("href", "/ingredients");
    expect(link).not.toHaveAttribute("type");
  });

  it("sets data-slot on asChild element", () => {
    render(
      <Button asChild>
        <a href="/substituts">Substituts</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Substituts" })).toHaveAttribute(
      "data-slot",
      "button",
    );
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Button>Sauvegarder</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
