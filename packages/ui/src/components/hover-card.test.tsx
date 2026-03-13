import { createRef } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "./hover-card";

describe("HoverCard", () => {
  async function waitForHoverCardContent(root: ParentNode = document.body) {
    return waitFor(() => {
      const node = root.querySelector("[data-slot='hover-card-content']");
      if (!node) {
        throw new Error("hover card content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps root, trigger, portal, content, and arrow slots stable by default", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <HoverCard defaultOpen>
        <HoverCardTrigger data-slot="custom-trigger">
          Open card
        </HoverCardTrigger>
        <HoverCardContent
          container={portalContainer}
          data-slot="custom-content"
        >
          Card details.
          <HoverCardArrow data-slot="custom-arrow" />
        </HoverCardContent>
      </HoverCard>,
    );

    await waitForHoverCardContent(portalContainer);

    expect(container.querySelector("[data-slot='hover-card']")).toBeTruthy();
    expect(
      screen.getByText("Open card").closest("[data-slot='hover-card-trigger']"),
    ).toHaveAttribute("data-slot", "hover-card-trigger");
    expect(
      portalContainer.querySelector("[data-slot='hover-card-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='hover-card-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='hover-card-arrow']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-content']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-arrow']"),
    ).toBeNull();

    portalContainer.remove();
  });

  it("allows trigger slot override when using asChild", async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Open via child
          </button>
        </HoverCardTrigger>
        <HoverCardContent>Details.</HoverCardContent>
      </HoverCard>,
    );

    await waitForHoverCardContent();

    const trigger = screen.getByRole("button", { name: "Open via child" });

    expect(trigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(
      document.querySelector("[data-slot='hover-card-trigger']"),
    ).toBeNull();
  });

  it("opens on focus and closes when focus moves away", async () => {
    const user = userEvent.setup();
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    render(
      <div>
        <HoverCard closeDelay={0} openDelay={0}>
          <HoverCardTrigger asChild>
            <button type="button">Open hover card</button>
          </HoverCardTrigger>
          <HoverCardContent container={portalContainer}>
            Compact guidance.
            <HoverCardArrow />
          </HoverCardContent>
        </HoverCard>
        <button type="button">Next action</button>
      </div>,
    );

    const trigger = screen.getByRole("button", { name: "Open hover card" });

    await user.tab();
    expect(trigger).toHaveFocus();

    const content = await waitForHoverCardContent(portalContainer);
    const arrow = portalContainer.querySelector(
      "[data-slot='hover-card-arrow']",
    ) as HTMLElement | null;

    expect(trigger.className).toContain("cursor-pointer");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
    expect(content.className).toContain("data-[state=open]:animate-in");
    expect(content.className).toContain(
      "data-[side=right]:slide-in-from-left-2",
    );
    expect(arrow?.getAttribute("class") ?? "").toContain("fill-popover");
    expect(arrow?.getAttribute("class") ?? "").toContain("stroke-border");

    await user.tab();
    expect(screen.getByRole("button", { name: "Next action" })).toHaveFocus();

    await waitFor(() => {
      expect(
        portalContainer.querySelector("[data-slot='hover-card-content']"),
      ).toBeNull();
    });

    portalContainer.remove();
  });

  it("merges className on content", async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>Open</HoverCardTrigger>
        <HoverCardContent className="custom-hover-card-content">
          Content
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    expect((await waitForHoverCardContent()).className).toContain(
      "custom-hover-card-content",
    );
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLAnchorElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger ref={triggerRef}>Reference</HoverCardTrigger>
        <HoverCardContent ref={contentRef}>Content</HoverCardContent>
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
        <HoverCardTrigger>Accessibility</HoverCardTrigger>
        <HoverCardContent>
          Content
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
