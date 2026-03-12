import { createRef } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
  function renderTabs(props?: React.ComponentProps<typeof Tabs>) {
    return render(
      <Tabs defaultValue="resume" {...props}>
        <TabsList>
          <TabsTrigger value="resume">Résumé</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>
        <TabsContent value="resume">Contenu résumé</TabsContent>
        <TabsContent value="details">Contenu détaillé</TabsContent>
      </Tabs>,
    );
  }

  it("keeps slot markers stable on real elements in default composition", () => {
    const { container } = render(
      <Tabs data-slot="custom-root" defaultValue="resume">
        <TabsList data-slot="custom-list">
          <TabsTrigger data-slot="custom-trigger" value="resume">
            Résumé
          </TabsTrigger>
        </TabsList>
        <TabsContent data-slot="custom-content" value="resume">
          Contenu résumé
        </TabsContent>
      </Tabs>,
    );

    const root = container.querySelector("[data-slot='tabs']");
    const list = container.querySelector("[data-slot='tabs-list']");
    const trigger = screen.getByRole("tab", { name: "Résumé" });
    const content = container.querySelector("[data-slot='tabs-content']");

    expect(root).toBe(container.firstElementChild);
    expect(list).toBeTruthy();
    expect(trigger).toHaveAttribute("data-slot", "tabs-trigger");
    expect(content).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-root']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-list']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-content']")).toBeNull();
  });

  it("allows trigger slot override when using asChild", () => {
    const { container } = render(
      <Tabs defaultValue="resume">
        <TabsList>
          <TabsTrigger asChild value="resume">
            <button data-slot="custom-trigger">Résumé</button>
          </TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>
        <TabsContent value="resume">Contenu résumé</TabsContent>
        <TabsContent value="details">Contenu détaillé</TabsContent>
      </Tabs>,
    );

    const customTrigger = screen.getByRole("tab", { name: "Résumé" });

    expect(customTrigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(container.querySelector("[data-slot='tabs-trigger']")).toBeTruthy();
  });

  it("switches active tabs in uncontrolled mode and keeps semantic linkage", async () => {
    const user = userEvent.setup();
    renderTabs();

    const resume = screen.getByRole("tab", { name: "Résumé" });
    const details = screen.getByRole("tab", { name: "Détails" });

    expect(resume).toHaveAttribute("aria-selected", "true");
    expect(details).toHaveAttribute("aria-selected", "false");

    await user.click(details);

    await waitFor(() => {
      expect(details).toHaveAttribute("aria-selected", "true");
      expect(resume).toHaveAttribute("aria-selected", "false");
    });

    const detailsPanelId = details.getAttribute("aria-controls");
    const detailsPanel = detailsPanelId
      ? document.getElementById(detailsPanelId)
      : null;

    expect(detailsPanel).toHaveAttribute("data-slot", "tabs-content");
    expect(detailsPanel).toHaveAttribute(
      "aria-labelledby",
      details.getAttribute("id") ?? "",
    );
    expect(detailsPanel).toHaveTextContent("Contenu détaillé");
  });

  it("supports keyboard navigation and activates the next tab", async () => {
    const user = userEvent.setup();
    renderTabs();

    const resume = screen.getByRole("tab", { name: "Résumé" });
    const details = screen.getByRole("tab", { name: "Détails" });

    await user.click(resume);
    await user.keyboard("{ArrowRight}");

    await waitFor(() => {
      expect(details).toHaveFocus();
      expect(details).toHaveAttribute("aria-selected", "true");
    });

    const detailsPanelId = details.getAttribute("aria-controls");
    const detailsPanel = detailsPanelId
      ? document.getElementById(detailsPanelId)
      : null;

    expect(detailsPanel).toHaveTextContent("Contenu détaillé");
    expect(detailsPanel).toHaveAttribute(
      "aria-labelledby",
      details.getAttribute("id") ?? "",
    );
  });

  it("does not activate a disabled trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Tabs defaultValue="resume" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="resume">Résumé</TabsTrigger>
          <TabsTrigger disabled value="details">
            Détails
          </TabsTrigger>
        </TabsList>
        <TabsContent value="resume">Contenu résumé</TabsContent>
        <TabsContent value="details">Contenu détaillé</TabsContent>
      </Tabs>,
    );

    const details = screen.getByRole("tab", { name: "Détails" });

    expect(details).toBeDisabled();

    await user.click(details);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(details).toHaveAttribute("aria-selected", "false");
  });

  it("keeps minimal class contracts on trigger and content", () => {
    renderTabs();

    const trigger = screen.getByRole("tab", { name: "Résumé" });
    const panel = screen
      .getByText("Contenu résumé")
      .closest("[data-slot='tabs-content']");

    expect(trigger.className).toContain("data-[state=active]:bg-background");
    expect(trigger.className).toContain("data-[state=active]:text-foreground");
    expect(trigger.className).toContain("cursor-pointer");
    expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    expect(trigger.className).toContain(
      "data-[orientation=vertical]:whitespace-normal",
    );
    expect(panel?.className ?? "").toContain("border-border");
    expect(panel?.className ?? "").toContain("focus-visible:ring-ring-soft");
  });

  it("merges className on root, list, trigger, and content", () => {
    const { container } = render(
      <Tabs className="mes-onglets" defaultValue="resume">
        <TabsList className="ma-liste">
          <TabsTrigger className="mon-trigger" value="resume">
            Résumé
          </TabsTrigger>
        </TabsList>
        <TabsContent className="mon-contenu" value="resume">
          Contenu résumé
        </TabsContent>
      </Tabs>,
    );

    const root = container.querySelector("[data-slot='tabs']");
    const list = container.querySelector("[data-slot='tabs-list']");
    const trigger = container.querySelector("[data-slot='tabs-trigger']");
    const content = container.querySelector("[data-slot='tabs-content']");

    expect(root?.className ?? "").toContain("mes-onglets");
    expect(list?.className ?? "").toContain("ma-liste");
    expect(trigger?.className ?? "").toContain("mon-trigger");
    expect(content?.className ?? "").toContain("mon-contenu");
  });

  it("forwards ref to tabs root", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <Tabs ref={ref} defaultValue="resume">
        <TabsList>
          <TabsTrigger value="resume">Résumé</TabsTrigger>
        </TabsList>
        <TabsContent value="resume">Contenu</TabsContent>
      </Tabs>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderTabs();

    expect(await axe(container)).toHaveNoViolations();
  });
});
