import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "./hover-card";

describe("HoverCard", () => {
  it("opens on hover and closes on pointer leave", async () => {
    render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <button type="button">Profil utilisateur</button>
        </HoverCardTrigger>
        <HoverCardContent>
          Details du profil.
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    const trigger = screen.getByRole("button", { name: "Profil utilisateur" });

    fireEvent.pointerEnter(trigger);
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseMove(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='hover-card-content']"),
      ).toBeTruthy();
    });

    fireEvent.pointerLeave(trigger);
    fireEvent.mouseLeave(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='hover-card-content']"),
      ).toBeNull();
    });
  });

  it("opens on focus and closes on blur", async () => {
    render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <button type="button">Aide contexte</button>
        </HoverCardTrigger>
        <HoverCardContent>
          Informations contextuelles.
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    const trigger = screen.getByRole("button", { name: "Aide contexte" });

    fireEvent.focus(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='hover-card-content']"),
      ).toBeTruthy();
    });

    fireEvent.blur(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='hover-card-content']"),
      ).toBeNull();
    });
  });

  it("renders full slot surface", async () => {
    const { container } = render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <button type="button">Voir fiche</button>
        </HoverCardTrigger>
        <HoverCardContent>
          Fiche nutritionnelle.
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    const trigger = screen.getByRole("button", { name: "Voir fiche" });
    fireEvent.pointerEnter(trigger);
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseMove(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='hover-card-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='hover-card']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='hover-card-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='hover-card-portal']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='hover-card-content']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='hover-card-arrow']"),
    ).toBeTruthy();
  });

  it("applies semantic content and arrow classes", () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <button type="button">Profil</button>
        </HoverCardTrigger>
        <HoverCardContent>
          Contenu
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    const content = document.querySelector(
      "[data-slot='hover-card-content']",
    ) as HTMLElement | null;
    const arrow = document.querySelector(
      "[data-slot='hover-card-arrow']",
    ) as HTMLElement | null;

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("data-[state=open]:animate-in");
    expect(content?.className ?? "").toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    const arrowClassName = arrow?.getAttribute("class") ?? "";
    expect(arrowClassName).toContain("fill-popover");
    expect(arrowClassName).toContain("stroke-border");
  });

  it("merges className on content", () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <button type="button">Profil</button>
        </HoverCardTrigger>
        <HoverCardContent className="contenu-survol-personnalise">
          Texte
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    expect(
      document.querySelector("[data-slot='hover-card-content']")?.className ??
        "",
    ).toContain("contenu-survol-personnalise");
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLAnchorElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger ref={triggerRef}>Ouvrir</HoverCardTrigger>
        <HoverCardContent ref={contentRef}>Contenu</HoverCardContent>
      </HoverCard>,
    );

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <button type="button">Accessibilite</button>
        </HoverCardTrigger>
        <HoverCardContent>
          Contenu
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
