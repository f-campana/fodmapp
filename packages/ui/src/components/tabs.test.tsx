import { createRef } from "react";

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

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

  it("renders tab semantics", () => {
    renderTabs();

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Résumé" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Détails" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("switches active tab in uncontrolled mode", () => {
    renderTabs();

    const resume = screen.getByRole("tab", { name: "Résumé" });
    const details = screen.getByRole("tab", { name: "Détails" });

    expect(resume).toHaveAttribute("data-state", "active");
    expect(details).toHaveAttribute("data-state", "inactive");

    act(() => {
      fireEvent.mouseDown(details);
      fireEvent.click(details);
    });

    return waitFor(() => {
      expect(details).toHaveAttribute("data-state", "active");
      expect(resume).toHaveAttribute("data-state", "inactive");
    });
  });

  it("supports keyboard navigation", () => {
    renderTabs();

    const resume = screen.getByRole("tab", { name: "Résumé" });
    const initiallyChecked = screen
      .getAllByRole("tab")
      .filter((tab) => tab.getAttribute("data-state") === "active");

    act(() => {
      resume.focus();
      fireEvent.keyDown(resume, { key: "ArrowRight", code: "ArrowRight" });
    });

    const afterEventChecked = screen
      .getAllByRole("tab")
      .filter((tab) => tab.getAttribute("data-state") === "active");

    expect(initiallyChecked).toHaveLength(1);
    expect(afterEventChecked).toHaveLength(1);
  });

  it("does not activate disabled trigger", () => {
    const onValueChange = vi.fn();

    render(
      <Tabs defaultValue="resume" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="resume">Résumé</TabsTrigger>
          <TabsTrigger value="details" disabled>
            Détails
          </TabsTrigger>
        </TabsList>
        <TabsContent value="resume">Contenu résumé</TabsContent>
        <TabsContent value="details">Contenu détaillé</TabsContent>
      </Tabs>,
    );

    screen.getByRole("tab", { name: "Détails" }).click();

    expect(onValueChange).not.toHaveBeenCalledWith("details");
  });

  it("renders data-slot and state class contracts", () => {
    renderTabs();

    const root = screen.getByRole("tablist").closest("[data-slot='tabs']");
    const list = screen.getByRole("tablist");
    const trigger = screen.getByRole("tab", { name: "Résumé" });
    const panel = screen
      .getByText("Contenu résumé")
      .closest("[data-slot='tabs-content']");

    expect(root).toHaveAttribute("data-slot", "tabs");
    expect(list).toHaveAttribute("data-slot", "tabs-list");
    expect(trigger).toHaveAttribute("data-slot", "tabs-trigger");
    expect(panel).toHaveAttribute("data-slot", "tabs-content");
    expect(trigger.className).toContain("data-[state=active]:bg-background");
    expect(trigger.className).toContain("data-[state=active]:text-foreground");
    expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
  });

  it("merges className on root", () => {
    renderTabs({ className: "mes-onglets" });

    const root = screen.getByRole("tablist").closest("[data-slot='tabs']");
    expect(root?.className ?? "").toContain("mes-onglets");
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
