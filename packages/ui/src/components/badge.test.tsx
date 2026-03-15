import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders a read-only status badge", () => {
    render(<Badge>Compatible</Badge>);

    const badge = screen.getByText("Compatible");

    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveAttribute("data-variant", "default");
  });

  it("supports all badge variants", () => {
    render(
      <>
        <Badge>Compatible</Badge>
        <Badge variant="secondary">Secondaire</Badge>
        <Badge variant="destructive">Attention</Badge>
        <Badge variant="outline">Contour</Badge>
      </>,
    );

    expect(screen.getByText("Compatible")).toHaveAttribute(
      "data-variant",
      "default",
    );
    expect(screen.getByText("Secondaire")).toBeInTheDocument();
    expect(screen.getByText("Attention")).toHaveAttribute(
      "data-variant",
      "destructive",
    );
    expect(screen.getByText("Contour")).toBeInTheDocument();
  });

  it("merges className", () => {
    render(<Badge className="mon-badge">Lecture seule</Badge>);

    expect(screen.getByText("Lecture seule").className).toContain("mon-badge");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
