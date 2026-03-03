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
  it("renders group, panel, and handle slots", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50}>A</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>B</ResizablePanel>
      </ResizablePanelGroup>,
    );

    expect(
      container.querySelector("[data-slot='resizable-panel-group']"),
    ).toBeTruthy();
    expect(
      container.querySelectorAll("[data-slot='resizable-panel']"),
    ).toHaveLength(2);
    expect(
      container.querySelector("[data-slot='resizable-handle']"),
    ).toBeTruthy();
  });

  it("renders grip helper when withHandle is true", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize={50}>A</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>B</ResizablePanel>
      </ResizablePanelGroup>,
    );

    expect(
      container.querySelector("[data-slot='resizable-handle-grip']"),
    ).toBeTruthy();
  });

  it("applies orientation and focus semantic classes", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize={50}>A</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>B</ResizablePanel>
      </ResizablePanelGroup>,
    );

    const group = container.querySelector(
      "[data-slot='resizable-panel-group']",
    ) as HTMLElement;
    const handle = container.querySelector(
      "[data-slot='resizable-handle']",
    ) as HTMLElement;

    expect(group.className).toContain("data-[orientation=vertical]:flex-col");
    expect(handle.className).toContain(
      "data-[panel-group-direction=vertical]:w-px",
    );
    expect(handle.className).toContain(
      "data-[panel-group-direction=horizontal]:h-px",
    );
    expect(handle.className).toContain("focus-visible:ring-ring-soft");
  });

  it("merges className and supports elementRef", () => {
    const groupRef = createRef<HTMLDivElement>();
    const panelRef = createRef<HTMLDivElement>();
    const handleRef = createRef<HTMLDivElement>();

    const { container } = render(
      <ResizablePanelGroup
        className="groupe-personnalise"
        elementRef={groupRef}
      >
        <ResizablePanel className="panneau-personnalise" elementRef={panelRef}>
          A
        </ResizablePanel>
        <ResizableHandle
          className="poignee-personnalisee"
          elementRef={handleRef}
        />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>,
    );

    expect(container.querySelector(".groupe-personnalise")).toBeTruthy();
    expect(container.querySelector(".panneau-personnalise")).toBeTruthy();
    expect(container.querySelector(".poignee-personnalisee")).toBeTruthy();

    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(panelRef.current).toBeInstanceOf(HTMLDivElement);
    expect(handleRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50}>A</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>B</ResizablePanel>
      </ResizablePanelGroup>,
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
