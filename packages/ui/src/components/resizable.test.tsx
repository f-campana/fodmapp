import { createRef } from "react";

import { render } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

describe("Resizable", () => {
  function renderResizable(
    props?: React.ComponentProps<typeof ResizablePanelGroup>,
  ) {
    return render(
      <ResizablePanelGroup
        defaultLayout={{ left: 50, right: 50 }}
        orientation="horizontal"
        {...props}
      >
        <ResizablePanel defaultSize={50} id="left">
          A
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} id="right">
          B
        </ResizablePanel>
      </ResizablePanelGroup>,
    );
  }

  it("keeps slot markers stable on real elements", () => {
    const { container } = render(
      <ResizablePanelGroup
        data-slot="custom-group"
        defaultLayout={{ left: 50, right: 50 }}
        orientation="horizontal"
      >
        <ResizablePanel data-slot="custom-panel" defaultSize={50} id="left">
          A
        </ResizablePanel>
        <ResizableHandle data-slot="custom-handle" withHandle />
        <ResizablePanel defaultSize={50} id="right">
          B
        </ResizablePanel>
      </ResizablePanelGroup>,
    );

    const group = container.querySelector("[data-slot='resizable-panel-group']");
    const panels = container.querySelectorAll("[data-slot='resizable-panel']");
    const handle = container.querySelector("[data-slot='resizable-handle']");
    const grip = container.querySelector("[data-slot='resizable-handle-grip']");

    expect(group).toBe(container.firstElementChild);
    expect(panels).toHaveLength(2);
    expect(handle).toBeTruthy();
    expect(grip).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-group']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-panel']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-handle']")).toBeNull();
  });

  it("renders grip helper when withHandle is true", () => {
    const { container } = renderResizable({ orientation: "vertical" });

    expect(
      container.querySelector("[data-slot='resizable-handle-grip']"),
    ).toBeTruthy();
  });

  it("keeps separator semantics and corrected handle class contracts", () => {
    const { container } = renderResizable();

    const group = container.querySelector(
      "[data-slot='resizable-panel-group']",
    ) as HTMLElement;
    const handle = container.querySelector(
      "[data-slot='resizable-handle']",
    ) as HTMLElement;
    const grip = container.querySelector(
      "[data-slot='resizable-handle-grip']",
    ) as HTMLElement;

    expect(group.className).toContain("flex-row");
    expect(handle).toHaveAttribute("role", "separator");
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle.className).toContain("group");
    expect(handle.className).toContain("aria-[orientation=vertical]:cursor-col-resize");
    expect(handle.className).toContain("aria-[orientation=horizontal]:h-px");
    expect(handle.className).toContain("aria-[orientation=vertical]:w-px");
    expect(handle.className).toContain("focus-visible:ring-ring-soft");
    expect(grip.className).toContain("group-aria-[orientation=horizontal]:w-12");
    expect(grip.className).toContain("group-aria-[orientation=vertical]:h-12");
  });

  it("keeps keyboard-focusable separator semantics", () => {
    const { container } = renderResizable();
    const handle = container.querySelector(
      "[data-slot='resizable-handle']",
    ) as HTMLElement;

    handle.focus();

    expect(handle).toHaveFocus();
    expect(handle).toHaveAttribute("aria-valuemin", "0");
    expect(handle).toHaveAttribute("aria-valuemax", "100");
    expect(handle).toHaveAttribute("aria-valuenow", "50");
  });

  it("merges className and supports elementRef", () => {
    const groupRef = createRef<HTMLDivElement>();
    const panelRef = createRef<HTMLDivElement>();
    const handleRef = createRef<HTMLDivElement>();

    const { container } = render(
      <ResizablePanelGroup
        className="groupe-personnalise"
        defaultLayout={{ top: 50, bottom: 50 }}
        elementRef={groupRef}
        orientation="vertical"
      >
        <ResizablePanel
          className="panneau-personnalise"
          defaultSize={50}
          elementRef={panelRef}
          id="top"
        >
          A
        </ResizablePanel>
        <ResizableHandle
          className="poignee-personnalisee"
          elementRef={handleRef}
        />
        <ResizablePanel defaultSize={50} id="bottom">
          B
        </ResizablePanel>
      </ResizablePanelGroup>,
    );

    const group = container.querySelector("[data-slot='resizable-panel-group']");

    expect(group?.className ?? "").toContain("groupe-personnalise");
    expect(group?.className ?? "").toContain("flex-col");
    expect(container.querySelector(".panneau-personnalise")).toBeTruthy();
    expect(container.querySelector(".poignee-personnalisee")).toBeTruthy();

    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(panelRef.current).toBeInstanceOf(HTMLDivElement);
    expect(handleRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderResizable();

    expect(await axe(container)).toHaveNoViolations();
  });
});
