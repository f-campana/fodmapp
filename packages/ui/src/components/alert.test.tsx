import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("keeps slot markers stable and defaults to alert semantics", () => {
    const { container } = render(
      <Alert data-slot="custom-alert">
        <svg aria-hidden="true" data-slot="custom-icon" viewBox="0 0 16 16" />
        <AlertTitle data-slot="custom-title">Information importante</AlertTitle>
        <AlertDescription data-slot="custom-description">
          Mise a jour terminee.
        </AlertDescription>
      </Alert>,
    );

    const alert = screen.getByRole("alert");

    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(alert).toHaveAttribute("data-variant", "default");
    expect(alert.className).toContain(
      "[&>svg~[data-slot=alert-description]]:col-start-2",
    );
    expect(alert.className).toContain("bg-info/10");
    expect(alert.className).toContain("text-info-foreground");
    expect(container.querySelector("[data-slot='custom-alert']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-title']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-description']"),
    ).toBeNull();
    expect(screen.getByText("Information importante")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
    expect(screen.getByText("Information importante").className).toContain(
      "leading-5",
    );
    expect(screen.getByText("Mise a jour terminee.")).toHaveAttribute(
      "data-slot",
      "alert-description",
    );
  });

  it("allows an explicit role override when urgency is controlled by the caller", () => {
    render(<Alert role="status">Verification terminee</Alert>);

    expect(screen.getByRole("status")).toHaveAttribute("data-slot", "alert");
  });

  it("supports destructive variant", () => {
    render(<Alert variant="destructive">Erreur critique</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-variant", "destructive");
    expect(alert.className).toContain("border-destructive-subtle-border");
    expect(alert.className).toContain("bg-destructive-subtle");
    expect(alert.className).toContain("text-destructive-subtle-foreground");
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
