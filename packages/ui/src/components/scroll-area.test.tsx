import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
  function renderScrollArea(props?: Record<string, unknown>) {
    return render(
      <ScrollArea
        className="h-24 w-24"
        {...(props as React.ComponentProps<typeof ScrollArea>)}
      >
        <div className="h-64 w-64">Scrollable ingredients</div>
      </ScrollArea>,
    );
  }

  it("keeps root, viewport, scrollbar, thumb, and corner slots stable", () => {
    const { container } = renderScrollArea({
      "data-slot": "custom-scroll-area",
    });

    const content = screen.getByText("Scrollable ingredients");
    const root = content.closest("[data-slot='scroll-area']");
    const viewport = content.closest("[data-slot='scroll-area-viewport']");
    const scrollbars = container.querySelectorAll(
      "[data-slot='scroll-area-scrollbar']",
    );
    const thumbs = container.querySelectorAll(
      "[data-slot='scroll-area-thumb']",
    );
    const corners = container.querySelectorAll(
      "[data-slot='scroll-area-corner']",
    );

    expect(root).toHaveAttribute("data-slot", "scroll-area");
    expect(viewport).toHaveAttribute("data-slot", "scroll-area-viewport");
    expect(viewport).toHaveAttribute("tabindex", "0");
    expect(scrollbars).toHaveLength(2);
    expect(thumbs).toHaveLength(2);
    expect(corners.length).toBeGreaterThan(0);
    expect(
      container.querySelector("[data-slot='custom-scroll-area']"),
    ).toBeNull();
  });

  it("keeps the viewport keyboard reachable", async () => {
    const user = userEvent.setup();
    renderScrollArea();

    await user.tab();

    expect(
      screen
        .getByText("Scrollable ingredients")
        .closest("[data-slot='scroll-area-viewport']"),
    ).toHaveFocus();
  });

  it("merges className on the root and keeps thumb token classes", () => {
    const { container } = renderScrollArea({
      className: "custom-scroll-area",
    });

    expect(
      screen
        .getByText("Scrollable ingredients")
        .closest("[data-slot='scroll-area']")?.className ?? "",
    ).toContain("custom-scroll-area");
    expect(
      container.querySelector("[data-slot='scroll-area-thumb']")?.className ??
        "",
    ).toContain("bg-border");
  });

  it("forwards refs to the root element", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ScrollArea ref={ref}>
        <div>Reference</div>
      </ScrollArea>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderScrollArea();

    expect(await axe(container)).toHaveNoViolations();
  });
});
