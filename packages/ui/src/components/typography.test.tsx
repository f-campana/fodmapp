import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Typography } from "./typography";

describe("Typography", () => {
  it("renders default paragraph variant", () => {
    render(<Typography>Texte courant</Typography>);

    const paragraph = screen.getByText("Texte courant");
    expect(paragraph.tagName).toBe("P");
    expect(paragraph).toHaveAttribute("data-slot", "typography");
    expect(paragraph).toHaveAttribute("data-variant", "p");
  });

  it("supports all variants with expected element mapping", () => {
    render(
      <>
        <Typography variant="h1">Titre 1</Typography>
        <Typography variant="h2">Titre 2</Typography>
        <Typography variant="h3">Titre 3</Typography>
        <Typography variant="h4">Titre 4</Typography>
        <Typography variant="blockquote">Citation</Typography>
        <Typography variant="code">const x = 1;</Typography>
        <Typography variant="lead">Texte principal</Typography>
        <Typography variant="muted">Texte discret</Typography>
      </>,
    );

    expect(screen.getByText("Titre 1").tagName).toBe("H1");
    expect(screen.getByText("Titre 2").tagName).toBe("H2");
    expect(screen.getByText("Titre 3").tagName).toBe("H3");
    expect(screen.getByText("Titre 4").tagName).toBe("H4");
    expect(screen.getByText("Citation").tagName).toBe("BLOCKQUOTE");
    expect(screen.getByText("const x = 1;").tagName).toBe("CODE");
    expect(screen.getByText("Texte principal").tagName).toBe("P");
    expect(screen.getByText("Texte discret").tagName).toBe("P");
  });

  it("supports asChild rendering", () => {
    render(
      <Typography asChild variant="h4">
        <a href="/recettes">Voir recettes</a>
      </Typography>,
    );

    const link = screen.getByRole("link", { name: "Voir recettes" });
    expect(link).toHaveAttribute("href", "/recettes");
    expect(link).toHaveAttribute("data-slot", "typography");
    expect(link).toHaveAttribute("data-variant", "h4");
  });

  it("merges className", () => {
    render(
      <Typography className="mon-texte" variant="lead">
        Accentuation
      </Typography>,
    );

    const text = screen.getByText("Accentuation");
    expect(text.className).toContain("mon-texte");
    expect(text.className).toContain("text-xl");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Typography>Titre accessible</Typography>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
