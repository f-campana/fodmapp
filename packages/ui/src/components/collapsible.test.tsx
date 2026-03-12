import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

describe("Collapsible", () => {
  function renderCollapsible(props?: React.ComponentProps<typeof Collapsible>) {
    return render(
      <Collapsible {...props}>
        <CollapsibleTrigger>Voir les détails</CollapsibleTrigger>
        <CollapsibleContent forceMount>Contenu détaillé</CollapsibleContent>
      </Collapsible>,
    );
  }

  it("keeps slot markers stable on real elements in default composition", () => {
    const { container } = render(
      <Collapsible data-slot="custom-root" defaultOpen>
        <CollapsibleTrigger data-slot="custom-trigger">
          Voir les détails
        </CollapsibleTrigger>
        <CollapsibleContent data-slot="custom-content">
          Contenu détaillé
        </CollapsibleContent>
      </Collapsible>,
    );

    const root = container.querySelector("[data-slot='collapsible']");
    const trigger = screen.getByRole("button", { name: "Voir les détails" });
    const content = container.querySelector("[data-slot='collapsible-content']");

    expect(root).toBe(container.firstElementChild);
    expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
    expect(content).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-root']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-content']")).toBeNull();
  });

  it("allows trigger slot override when using asChild", () => {
    const { container } = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <button data-slot="custom-trigger">Voir les détails</button>
        </CollapsibleTrigger>
        <CollapsibleContent forceMount>Contenu détaillé</CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole("button", { name: "Voir les détails" });

    expect(trigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(container.querySelector("[data-slot='collapsible-content']")).toBeTruthy();
  });

  it("toggles state on trigger click in uncontrolled mode", async () => {
    const user = userEvent.setup();
    renderCollapsible();

    const trigger = screen.getByRole("button", { name: "Voir les détails" });
    const content = screen
      .getByText("Contenu détaillé")
      .closest("[data-slot='collapsible-content']");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("data-state", "closed");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(content).toHaveAttribute("data-state", "open");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("ignores interactions when disabled", async () => {
    const user = userEvent.setup();
    renderCollapsible({ disabled: true });

    const trigger = screen.getByRole("button", { name: "Voir les détails" });
    const content = screen
      .getByText("Contenu détaillé")
      .closest("[data-slot='collapsible-content']");

    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("keeps minimal class contracts on trigger and content", () => {
    renderCollapsible({ defaultOpen: true });

    const trigger = screen.getByRole("button", { name: "Voir les détails" });
    const content = screen
      .getByText("Contenu détaillé")
      .closest("[data-slot='collapsible-content']");

    expect(trigger.className).toContain("cursor-pointer");
    expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    expect(content?.className ?? "").toContain(
      "data-[state=open]:animate-accordion-down",
    );
    expect(content?.className ?? "").toContain(
      "data-[state=closed]:animate-accordion-up",
    );
  });

  it("merges className on root, trigger, and content", () => {
    const { container } = render(
      <Collapsible className="mon-collapsible" defaultOpen>
        <CollapsibleTrigger className="mon-trigger">
          Voir les détails
        </CollapsibleTrigger>
        <CollapsibleContent className="mon-content">
          Contenu détaillé
        </CollapsibleContent>
      </Collapsible>,
    );

    const root = container.querySelector("[data-slot='collapsible']");
    const trigger = container.querySelector("[data-slot='collapsible-trigger']");
    const content = container.querySelector("[data-slot='collapsible-content']");

    expect(root?.className ?? "").toContain("mon-collapsible");
    expect(trigger?.className ?? "").toContain("mon-trigger");
    expect(content?.className ?? "").toContain("mon-content");
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
