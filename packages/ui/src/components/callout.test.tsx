import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Callout,
  CalloutDescription,
  CalloutIcon,
  CalloutTitle,
} from "./callout";

describe("Callout", () => {
  it("keeps root and compound slot hooks stable", () => {
    const { container } = render(
      <Callout data-slot="custom-callout" variant="info">
        <CalloutIcon data-slot="custom-icon">i</CalloutIcon>
        <CalloutTitle data-slot="custom-title">Information</CalloutTitle>
        <CalloutDescription data-slot="custom-description">
          Donnee utile pour avancer.
        </CalloutDescription>
      </Callout>,
    );

    expect(
      screen.getByText("Information").closest("[data-slot='callout']"),
    ).toHaveAttribute("data-variant", "info");
    expect(screen.getByText("i")).toHaveAttribute("data-slot", "callout-icon");
    expect(screen.getByText("Information")).toHaveAttribute(
      "data-slot",
      "callout-title",
    );
    expect(screen.getByText("Information").className).toContain("leading-5");
    expect(screen.getByText("Donnee utile pour avancer.")).toHaveAttribute(
      "data-slot",
      "callout-description",
    );
    expect(container.querySelector("[data-slot='custom-callout']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-icon']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-title']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-description']"),
    ).toBeNull();
  });

  it("supports all custom variants", () => {
    const { container } = render(
      <>
        <Callout variant="info">Information</Callout>
        <Callout variant="caution">Prudence</Callout>
        <Callout variant="warning">Avertissement</Callout>
        <Callout variant="danger">Risque</Callout>
        <Callout variant="tip">Astuce</Callout>
      </>,
    );

    expect(screen.getByText("Information")).toBeInTheDocument();
    expect(screen.getByText("Prudence")).toBeInTheDocument();
    expect(screen.getByText("Avertissement")).toBeInTheDocument();
    expect(screen.getByText("Risque")).toBeInTheDocument();
    expect(screen.getByText("Astuce")).toBeInTheDocument();
    expect(container.innerHTML).toContain("bg-info/10");
    expect(container.innerHTML).toContain("bg-warning/10");
    expect(container.innerHTML).toContain("bg-danger/10");
    expect(container.innerHTML).toContain("bg-success/10");
  });

  it("applies caution accent contract", () => {
    render(
      <Callout variant="caution">
        <CalloutIcon>!</CalloutIcon>
        <CalloutTitle>Attention</CalloutTitle>
      </Callout>,
    );

    const root = screen.getByText("Attention").closest("[data-slot='callout']");
    expect(root?.className).toContain("border-warning");
    expect(root?.className).toContain("bg-warning/10");
    expect(root?.className).toContain("text-foreground");
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Callout ref={ref}>Note editoriale</Callout>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("data-slot", "callout");
  });

  it("merges className", () => {
    render(
      <Callout className="ma-callout">
        <CalloutTitle>Note</CalloutTitle>
      </Callout>,
    );

    expect(
      screen.getByText("Note").closest("[data-slot='callout']")?.className,
    ).toContain("ma-callout");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Callout variant="warning">
        <CalloutTitle>Avertissement</CalloutTitle>
        <CalloutDescription>
          Révisez ce paramètre avant validation.
        </CalloutDescription>
      </Callout>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
