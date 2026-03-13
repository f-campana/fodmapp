import { createRef } from "react";

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

describe("Popover", () => {
  function renderPopover(props?: React.ComponentProps<typeof Popover>) {
    return render(
      <Popover {...props}>
        <PopoverTrigger>Voir les details</PopoverTrigger>
        <PopoverContent>
          Informations nutritionnelles detaillees.
          <PopoverArrow />
        </PopoverContent>
      </Popover>,
    );
  }

  async function waitForPopoverContent() {
    return waitFor(() => {
      const node = document.querySelector("[data-slot='popover-content']");
      if (!node) {
        throw new Error("popover content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps slot markers stable on exposed compounds", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <Popover defaultOpen>
        <PopoverAnchor data-slot="custom-anchor">Point d'ancrage</PopoverAnchor>
        <PopoverTrigger data-slot="custom-trigger">Ouvrir</PopoverTrigger>
        <PopoverContent container={portalContainer} data-slot="custom-content">
          Contenu
          <PopoverArrow data-slot="custom-arrow" />
        </PopoverContent>
      </Popover>,
    );

    await waitForPopoverContent();

    expect(container.querySelector("[data-slot='popover']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='popover-anchor']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='popover-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='popover-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='popover-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='popover-arrow']"),
    ).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-anchor']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-content']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-arrow']"),
    ).toBeNull();
  });

  it("opens from keyboard, closes on Escape, and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderPopover();

    const trigger = screen.getByRole("button", { name: "Voir les details" });

    trigger.focus();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Enter}");

    const content = await waitForPopoverContent();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      expect(content.contains(document.activeElement)).toBe(true);
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='popover-content']"),
      ).toBeNull();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on outside interaction", async () => {
    renderPopover();

    await userEvent.click(
      screen.getByRole("button", { name: "Voir les details" }),
    );

    await waitForPopoverContent();

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='popover-content']"),
      ).toBeNull();
    });
  });

  it("renders anchor and semantic content contracts", async () => {
    render(
      <Popover defaultOpen>
        <PopoverAnchor>Point d'ancrage</PopoverAnchor>
        <PopoverTrigger>Ouvrir</PopoverTrigger>
        <PopoverContent>
          Contenu
          <PopoverArrow />
        </PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Ouvrir" });
    const anchor = screen.getByText("Point d'ancrage");
    const content = await waitForPopoverContent();
    const arrow = document.querySelector(
      "[data-slot='popover-arrow']",
    ) as HTMLElement | null;

    expect(trigger).toHaveAttribute("data-slot", "popover-trigger");
    expect(anchor).toHaveAttribute("data-slot", "popover-anchor");
    expect(content).toHaveAttribute("aria-label", "Popover");
    expect(trigger.className).toContain("cursor-pointer");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
    expect(content.className).toContain("data-[state=open]:animate-in");
    expect(content.className).not.toContain("slide-in-from-left-2");
    expect(content.className).not.toContain("slide-in-from-top-2");

    const arrowClassName = arrow?.getAttribute("class") ?? "";
    expect(arrowClassName).toContain("fill-popover");
    expect(arrowClassName).toContain("stroke-border");
  });

  it("allows trigger slot override when using asChild", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Ouvrir via enfant
          </button>
        </PopoverTrigger>
        <PopoverContent>Contenu</PopoverContent>
      </Popover>,
    );

    await waitForPopoverContent();

    const trigger = screen.getByRole("button", { name: "Ouvrir via enfant" });

    expect(trigger).toHaveAttribute("data-slot", "custom-trigger");
    expect(
      document.querySelector("[data-slot='popover-content']"),
    ).toBeTruthy();
  });

  it("merges className on content", () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Ouvrir</PopoverTrigger>
        <PopoverContent className="contenu-popover-personnalise">
          Contenu
          <PopoverArrow />
        </PopoverContent>
      </Popover>,
    );

    expect(
      document.querySelector("[data-slot='popover-content']")?.className ?? "",
    ).toContain("contenu-popover-personnalise");
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <Popover defaultOpen>
        <PopoverTrigger ref={triggerRef}>Ouvrir</PopoverTrigger>
        <PopoverContent ref={contentRef}>Contenu</PopoverContent>
      </Popover>,
    );

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderPopover({ defaultOpen: true });

    await waitForPopoverContent();

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
