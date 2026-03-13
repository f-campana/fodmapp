import { createRef } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

describe("Tooltip", () => {
  async function waitForTooltipContent(root: ParentNode = document.body) {
    return waitFor(() => {
      const node = root.querySelector("[data-slot='tooltip-content']");
      if (!node) {
        throw new Error("tooltip content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps provider, root, trigger, and content slots stable by default", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger data-slot="custom-trigger">Open help</TooltipTrigger>
          <TooltipContent
            container={portalContainer}
            data-slot="custom-content"
          >
            Helpful nutrition detail.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Open help" });
    const content = await waitForTooltipContent(portalContainer);

    expect(
      container.querySelector("[data-slot='tooltip-provider']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='tooltip']")).toBeTruthy();
    expect(trigger).toHaveAttribute("data-slot", "tooltip-trigger");
    expect(content).toHaveAttribute("data-slot", "tooltip-content");
    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-content']"),
    ).toBeNull();

    portalContainer.remove();
  });

  it("allows trigger slot override when using asChild", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button data-slot="custom-trigger" type="button">
              Open via child
            </button>
          </TooltipTrigger>
          <TooltipContent>Contextual advice.</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    await waitForTooltipContent();

    const trigger = screen.getByRole("button", { name: "Open via child" });

    expect(trigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(document.querySelector("[data-slot='tooltip-trigger']")).toBeNull();
  });

  it("opens on keyboard focus, closes on Escape, and keeps focus on the trigger", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip onOpenChange={onOpenChange}>
          <TooltipTrigger>Open tooltip</TooltipTrigger>
          <TooltipContent container={portalContainer}>
            Portion guidance.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Open tooltip" });

    await user.tab();
    expect(trigger).toHaveFocus();

    const content = await waitForTooltipContent(portalContainer);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute("aria-describedby");
    expect(trigger.className).toContain("cursor-pointer");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
    expect(content.className).toContain("data-[state=open]:animate-in");
    expect(content.className).toContain("data-[state=closed]:animate-out");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        portalContainer.querySelector("[data-slot='tooltip-content']"),
      ).toBeNull();
    });
    expect(trigger).toHaveFocus();

    portalContainer.remove();
  });

  it("merges className on content", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open</TooltipTrigger>
          <TooltipContent className="custom-tooltip-content">
            Content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect((await waitForTooltipContent()).className).toContain(
      "custom-tooltip-content",
    );
  });

  it("forwards refs to the trigger element", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger ref={ref}>Reference</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <TooltipProvider delayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger>Accessibility</TooltipTrigger>
          <TooltipContent>Helpful copy.</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
