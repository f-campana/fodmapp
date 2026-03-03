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
  it("renders root and compounds with data-slot", () => {
    render(
      <Callout variant="info">
        <CalloutIcon>i</CalloutIcon>
        <CalloutTitle>Information</CalloutTitle>
        <CalloutDescription>Donnée utile pour avancer.</CalloutDescription>
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
    expect(screen.getByText("Donnée utile pour avancer.")).toHaveAttribute(
      "data-slot",
      "callout-description",
    );
  });

  it("supports all custom variants", () => {
    render(
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
    expect(root?.className).toContain("bg-background");
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
