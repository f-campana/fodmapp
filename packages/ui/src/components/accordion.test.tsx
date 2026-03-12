import { createRef, useState } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

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

  it("keeps slot markers stable on real elements", () => {
    const { container } = render(
      <Accordion
        collapsible
        data-slot="custom-root"
        defaultValue="item-1"
        type="single"
      >
        <AccordionItem data-slot="custom-item" value="item-1">
          <AccordionTrigger data-slot="custom-trigger">
            Question 1
          </AccordionTrigger>
          <AccordionContent data-slot="custom-content">
            Reponse 1
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const root = container.querySelector("[data-slot='accordion']");
    const item = container.querySelector("[data-slot='accordion-item']");
    const trigger = container.querySelector("[data-slot='accordion-trigger']");
    const content = container.querySelector("[data-slot='accordion-content']");

    expect(root).toBe(container.firstElementChild);
    expect(root).not.toHaveAttribute("hidden");
    expect(item).toBeTruthy();
    expect(trigger).toBeTruthy();
    expect(content).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-root']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-item']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-content']")).toBeNull();
  });

  it("supports single accordion open and close behavior", async () => {
    const user = userEvent.setup();
    renderSingleAccordion();

    const triggerOne = screen.getByRole("button", { name: "Question 1" });
    const triggerTwo = screen.getByRole("button", { name: "Question 2" });

    expect(triggerOne).toHaveAttribute("aria-expanded", "true");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "false");

    await user.click(triggerOne);
    expect(triggerOne).toHaveAttribute("aria-expanded", "false");

    await user.click(triggerTwo);
    expect(triggerTwo).toHaveAttribute("aria-expanded", "true");
    expect(triggerOne).toHaveAttribute("aria-expanded", "false");

    await user.click(triggerTwo);
    expect(triggerTwo).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps one item open when single accordion is not collapsible", async () => {
    const user = userEvent.setup();

    render(
      <Accordion defaultValue="item-1" type="single">
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

    const triggerOne = screen.getByRole("button", { name: "Question 1" });

    await user.click(triggerOne);
    expect(triggerOne).toHaveAttribute("aria-expanded", "true");
  });

  it("supports multiple mode with independent open states", async () => {
    const user = userEvent.setup();

    render(
      <Accordion defaultValue={["item-1"]} type="multiple">
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

    const triggerOne = screen.getByRole("button", { name: "Question 1" });
    const triggerTwo = screen.getByRole("button", { name: "Question 2" });

    expect(triggerOne).toHaveAttribute("aria-expanded", "true");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "false");

    await user.click(triggerTwo);
    expect(triggerOne).toHaveAttribute("aria-expanded", "true");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "true");

    await user.click(triggerOne);
    expect(triggerOne).toHaveAttribute("aria-expanded", "false");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "true");
  });

  it("ignores interactions when accordion root is disabled", async () => {
    const user = userEvent.setup();

    render(
      <Accordion collapsible defaultValue="item-1" disabled type="single">
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

    const triggerOne = screen.getByRole("button", { name: "Question 1" });
    const triggerTwo = screen.getByRole("button", { name: "Question 2" });

    expect(triggerOne).toBeDisabled();
    expect(triggerTwo).toBeDisabled();

    await user.click(triggerTwo);
    expect(triggerOne).toHaveAttribute("aria-expanded", "true");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores interactions when an item is disabled", async () => {
    const user = userEvent.setup();

    render(
      <Accordion collapsible defaultValue="item-1" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Question 1</AccordionTrigger>
          <AccordionContent>Reponse 1</AccordionContent>
        </AccordionItem>
        <AccordionItem disabled value="item-2">
          <AccordionTrigger>Question 2</AccordionTrigger>
          <AccordionContent>Reponse 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const triggerOne = screen.getByRole("button", { name: "Question 1" });
    const triggerTwo = screen.getByRole("button", { name: "Question 2" });

    expect(triggerTwo).toBeDisabled();

    await user.click(triggerTwo);
    expect(triggerOne).toHaveAttribute("aria-expanded", "true");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "false");
  });

  it("supports controlled value and onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function ControlledAccordion() {
      const [value, setValue] = useState("item-1");

      return (
        <>
          <Accordion
            collapsible
            onValueChange={(next) => {
              onValueChange(next);
              setValue(next);
            }}
            type="single"
            value={value}
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>Question 1</AccordionTrigger>
              <AccordionContent>Reponse 1</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Question 2</AccordionTrigger>
              <AccordionContent>Reponse 2</AccordionContent>
            </AccordionItem>
          </Accordion>
          <output data-testid="current-value">{value || "none"}</output>
        </>
      );
    }

    render(<ControlledAccordion />);

    const triggerTwo = screen.getByRole("button", { name: "Question 2" });

    await user.click(triggerTwo);
    expect(onValueChange).toHaveBeenCalledWith("item-2");
    expect(screen.getByTestId("current-value")).toHaveTextContent("item-2");
    expect(triggerTwo).toHaveAttribute("aria-expanded", "true");

    await user.click(triggerTwo);
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(screen.getByTestId("current-value")).toHaveTextContent("none");
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

    fireEvent.keyDown(triggerOne, { key: "End", code: "End" });
    expect(document.activeElement).toBe(triggerTwo);

    fireEvent.keyDown(triggerTwo, { key: "Home", code: "Home" });
    expect(document.activeElement).toBe(triggerOne);
  });

  it("respects rtl keyboard direction in horizontal mode", () => {
    render(
      <Accordion dir="rtl" orientation="horizontal" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Question 1</AccordionTrigger>
          <AccordionContent>Reponse 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Question 2</AccordionTrigger>
          <AccordionContent>Reponse 2</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Question 3</AccordionTrigger>
          <AccordionContent>Reponse 3</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const triggerOne = screen.getByRole("button", { name: "Question 1" });
    const triggerTwo = screen.getByRole("button", { name: "Question 2" });
    const triggerThree = screen.getByRole("button", { name: "Question 3" });

    triggerTwo.focus();

    fireEvent.keyDown(triggerTwo, { key: "ArrowRight", code: "ArrowRight" });
    expect(document.activeElement).toBe(triggerOne);

    fireEvent.keyDown(triggerOne, { key: "ArrowLeft", code: "ArrowLeft" });
    expect(document.activeElement).toBe(triggerTwo);

    fireEvent.keyDown(triggerTwo, { key: "ArrowLeft", code: "ArrowLeft" });
    expect(document.activeElement).toBe(triggerThree);
  });

  it("keeps minimal class contracts", () => {
    const { container } = renderSingleAccordion();

    const trigger = screen.getByRole("button", { name: "Question 1" });
    const content = container.querySelector("[data-slot='accordion-content']");

    expect(trigger.className).toContain("min-h-11");
    expect(trigger.className).toContain("cursor-pointer");
    expect(trigger.className).toContain("focus-visible:ring-ring-soft");
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
