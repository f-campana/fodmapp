import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

describe("Collapsible", () => {
  it("renders root and compound slots", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Voir les détails</CollapsibleTrigger>
        <CollapsibleContent>Contenu détaillé</CollapsibleContent>
      </Collapsible>,
    );

    const root = screen
      .getByRole("button", { name: "Voir les détails" })
      .closest("[data-slot='collapsible']");
    const trigger = screen.getByRole("button", { name: "Voir les détails" });
    const content = screen
      .getByText("Contenu détaillé")
      .closest("[data-slot='collapsible-content']");

    expect(root).toHaveAttribute("data-slot", "collapsible");
    expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
    expect(content).toHaveAttribute("data-slot", "collapsible-content");
  });

  it("toggles state on trigger click", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Afficher</CollapsibleTrigger>
        <CollapsibleContent forceMount>Informations</CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole("button", { name: "Afficher" });
    const content = screen
      .getByText("Informations")
      .closest("[data-slot='collapsible-content']");

    expect(content).toHaveAttribute("data-state", "closed");

    fireEvent.click(trigger);

    expect(content).toHaveAttribute("data-state", "open");
  });

  it("uses animation utility classes on content", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Animation</CollapsibleTrigger>
        <CollapsibleContent>Zone animée</CollapsibleContent>
      </Collapsible>,
    );

    const content = screen
      .getByText("Zone animée")
      .closest("[data-slot='collapsible-content']");

    expect(content?.className ?? "").toContain(
      "data-[state=open]:animate-accordion-down",
    );
    expect(content?.className ?? "").toContain(
      "data-[state=closed]:animate-accordion-up",
    );
  });

  it("merges className on root", () => {
    render(
      <Collapsible className="mon-collapsible" defaultOpen>
        <CollapsibleTrigger>Titre</CollapsibleTrigger>
        <CollapsibleContent>Texte</CollapsibleContent>
      </Collapsible>,
    );

    const root = screen
      .getByRole("button", { name: "Titre" })
      .closest("[data-slot='collapsible']");

    expect(root?.className ?? "").toContain("mon-collapsible");
  });

  it("forwards ref to collapsible root", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <Collapsible ref={ref}>
        <CollapsibleTrigger>Référence</CollapsibleTrigger>
        <CollapsibleContent>Contenu</CollapsibleContent>
      </Collapsible>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Accessibilité</CollapsibleTrigger>
        <CollapsibleContent>Texte accessible</CollapsibleContent>
      </Collapsible>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
