import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Stepper,
  StepperDescription,
  StepperLabel,
  StepperSeparator,
  StepperStep,
} from "./stepper";

describe("Stepper", () => {
  it("renders current, completed, and descriptive step content", () => {
    render(
      <Stepper orientation="horizontal">
        <StepperStep status="completed" step="1">
          <StepperLabel>Panier</StepperLabel>
          <StepperDescription>Ingrédients ajoutés</StepperDescription>
        </StepperStep>
        <StepperSeparator orientation="horizontal" />
        <StepperStep status="current" step="2">
          <StepperLabel>Recette</StepperLabel>
          <StepperDescription>Préparation en cours</StepperDescription>
        </StepperStep>
      </Stepper>,
    );

    const root = screen.getByText("Panier").closest("[data-slot='stepper']");
    expect(root).toHaveAttribute("data-orientation", "horizontal");

    const marker = screen
      .getByText("1")
      .closest("[data-slot='stepper-marker']");
    expect(marker).toBeTruthy();

    const step = screen
      .getByText("Recette")
      .closest("[data-slot='stepper-step']");
    expect(step).toHaveAttribute("data-status", "current");
    expect(step).toHaveAttribute("aria-current", "step");
    expect(step).toHaveAttribute("aria-describedby");

    expect(
      screen
        .getByText("Ingrédients ajoutés")
        .closest("[data-slot='stepper-description']"),
    ).toBeTruthy();
    expect(screen.getByText("Étape terminée")).toHaveAttribute(
      "data-slot",
      "stepper-status",
    );
    expect(screen.getByText("Étape en cours")).toHaveAttribute(
      "data-slot",
      "stepper-status",
    );
  });

  it("supports vertical orientation", () => {
    render(
      <Stepper orientation="vertical">
        <StepperStep status="upcoming" step="3">
          <StepperLabel>Paiement</StepperLabel>
        </StepperStep>
      </Stepper>,
    );

    const root = screen.getByText("Paiement").closest("[data-slot='stepper']");
    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(root?.className).toContain("flex-col");
  });

  it("merges className on the root", () => {
    render(
      <Stepper className="mon-stepper">
        <StepperStep step="1">
          <StepperLabel>Étape</StepperLabel>
        </StepperStep>
      </Stepper>,
    );

    expect(
      screen.getByText("Étape").closest("[data-slot='stepper']")?.className,
    ).toContain("mon-stepper");
  });

  it("renders separator with presentation semantics", () => {
    render(
      <Stepper>
        <StepperStep step="1">
          <StepperLabel>Début</StepperLabel>
        </StepperStep>
        <StepperSeparator />
        <StepperStep step="2">
          <StepperLabel>Fin</StepperLabel>
        </StepperStep>
      </Stepper>,
    );

    const separator = screen
      .getByText("Début")
      .closest("[data-slot='stepper']")
      ?.querySelector("[data-slot='stepper-separator']");

    expect(separator).toHaveAttribute("role", "presentation");
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });

  it("does not mark non-current steps as current", () => {
    render(
      <Stepper>
        <StepperStep status="completed" step="1">
          <StepperLabel>Préparation</StepperLabel>
        </StepperStep>
        <StepperSeparator />
        <StepperStep status="upcoming" step="2">
          <StepperLabel>Activation</StepperLabel>
        </StepperStep>
      </Stepper>,
    );

    expect(
      screen.getByText("Préparation").closest("[data-slot='stepper-step']"),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByText("Activation").closest("[data-slot='stepper-step']"),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Étape à venir")).toHaveAttribute(
      "data-slot",
      "stepper-status",
    );
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Stepper>
        <StepperStep status="completed" step="1">
          <StepperLabel>Sélection</StepperLabel>
          <StepperDescription>Étape validée</StepperDescription>
        </StepperStep>
      </Stepper>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
