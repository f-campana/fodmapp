import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("renders role='alert' and data-slot", () => {
    render(<Alert>Information importante</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(alert).toHaveAttribute("data-variant", "default");
  });

  it("supports destructive variant", () => {
    render(<Alert variant="destructive">Erreur critique</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-variant", "destructive");
    expect(alert.className).toContain("border-destructive");
    expect(alert.className).toContain("bg-destructive");
    expect(alert.className).toContain("text-destructive-foreground");
  });

  it("renders title and description compound slots", () => {
    render(
      <Alert>
        <AlertTitle>Attention</AlertTitle>
        <AlertDescription>La synchronisation est en pause.</AlertDescription>
      </Alert>,
    );

    expect(screen.getByText("Attention")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
    expect(
      screen.getByText("La synchronisation est en pause."),
    ).toHaveAttribute("data-slot", "alert-description");
  });

  it("forwards ref to root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Référence</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toContain("Référence");
  });

  it("merges className", () => {
    render(<Alert className="mon-style">Contenu</Alert>);
    expect(screen.getByRole("alert").className).toContain("mon-style");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>Aucune action requise.</AlertDescription>
      </Alert>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
