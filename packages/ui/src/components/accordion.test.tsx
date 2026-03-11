import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

describe("Accordion", () => {
  function renderSingleAccordion() {
    return render(
      <Accordion collapsible defaultValue="item-1" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Question 1</AccordionTrigger>
          <AccordionContent>Reponse 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Question 2</AccordionTrigger>
          <AccordionContent>Reponse 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
  }

  it("renders root and compound slots", () => {
    const { container } = renderSingleAccordion();

    expect(container.querySelector("[data-slot='accordion']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='accordion-item']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='accordion-trigger']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='accordion-content']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='accordion-content-inner']"),
    ).toBeTruthy();
  });

  it("supports single accordion open and close behavior", () => {
    renderSingleAccordion();

    const triggerOne = screen.getByRole("button", { name: "Question 1" });
    const triggerTwo = screen.getByRole("button", { name: "Question 2" });

    expect(triggerOne).toHaveAttribute("aria-expanded", "true");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(triggerOne);
    expect(triggerOne).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(triggerTwo);
    expect(triggerTwo).toHaveAttribute("aria-expanded", "true");
    expect(triggerOne).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(triggerTwo);
    expect(triggerTwo).toHaveAttribute("aria-expanded", "false");
  });

  it("supports keyboard interaction on triggers", () => {
    renderSingleAccordion();

    const triggerOne = screen.getByRole("button", { name: "Question 1" });
    const triggerTwo = screen.getByRole("button", { name: "Question 2" });
    triggerOne.focus();

    fireEvent.keyDown(triggerOne, { key: "ArrowDown", code: "ArrowDown" });
    expect(document.activeElement).toBe(triggerTwo);

    fireEvent.keyDown(triggerTwo, { key: "ArrowUp", code: "ArrowUp" });
    expect(document.activeElement).toBe(triggerOne);
  });

  it("applies semantic class contracts", () => {
    const { container } = renderSingleAccordion();

    const item = container.querySelector("[data-slot='accordion-item']");
    const trigger = screen.getByRole("button", { name: "Question 1" });
    const content = container.querySelector("[data-slot='accordion-content']");
    const contentInner = container.querySelector(
      "[data-slot='accordion-content-inner']",
    );

    expect(item?.className ?? "").toContain("overflow-hidden");
    expect(item?.className ?? "").toContain("border-b");
    expect(item?.className ?? "").toContain("border-border");
    expect(item?.className ?? "").toContain("first-of-type:rounded-t-(--radius)");
    expect(item?.className ?? "").toContain("last:rounded-b-(--radius)");
    expect(item?.className ?? "").toContain("last:border-b-0");
    expect(trigger.className).toContain("cursor-pointer");
    expect(trigger.className).toContain("min-h-11");
    expect(trigger.className).toContain("p-2");
    expect(trigger.className).toContain("text-base");
    expect(trigger.className).toContain("leading-6");
    expect(trigger.className).toContain("hover:bg-accent");
    expect(trigger.className).toContain("hover:text-foreground");
    expect(trigger.className).toContain("data-[state=open]:bg-accent");
    expect(trigger.className).toContain("data-[state=open]:text-foreground");
    expect(trigger.className).toContain("data-[state=open]:font-semibold");
    expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    expect(trigger.className).not.toContain(
      "rounded-[calc(var(--radius)-0.25rem)]",
    );
    expect(trigger.className).not.toContain("focus-visible:border-ring");
    expect(contentInner?.className ?? "").toContain("p-2");
    expect(contentInner?.className ?? "").toContain("text-base");
    expect(contentInner?.className ?? "").toContain("leading-7");
    expect(content?.className ?? "").toContain(
      "data-[state=open]:animate-accordion-down",
    );
    expect(content?.className ?? "").toContain(
      "data-[state=closed]:animate-accordion-up",
    );
  });

  it("merges className on item, trigger, and content", () => {
    const { container } = render(
      <Accordion collapsible type="single">
        <AccordionItem className="item-personnalise" value="item-1">
          <AccordionTrigger className="trigger-personnalise">
            Informations
          </AccordionTrigger>
          <AccordionContent className="content-personnalise">
            Texte
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const item = container.querySelector("[data-slot='accordion-item']");
    const trigger = container.querySelector("[data-slot='accordion-trigger']");
    const content = container.querySelector("[data-slot='accordion-content']");

    expect(item?.className ?? "").toContain("item-personnalise");
    expect(trigger?.className ?? "").toContain("trigger-personnalise");
    expect(content?.className ?? "").toContain("content-personnalise");
  });

  it("forwards refs to root, item, trigger, and content", () => {
    const rootRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <Accordion collapsible ref={rootRef} type="single">
        <AccordionItem ref={itemRef} value="item-1">
          <AccordionTrigger ref={triggerRef}>Reference</AccordionTrigger>
          <AccordionContent ref={contentRef}>Contenu</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderSingleAccordion();

    expect(await axe(container)).toHaveNoViolations();
  });
});
