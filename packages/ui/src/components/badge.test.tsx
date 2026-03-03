import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders badge label", () => {
    render(<Badge>Compatible</Badge>);
    const badge = screen.getByText("Compatible");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("supports destructive variant", () => {
    render(<Badge variant="destructive">Attention</Badge>);
    expect(screen.getByText("Attention")).toBeInTheDocument();
  });

  it("supports secondary and outline variants", () => {
    render(
      <>
        <Badge variant="secondary">Secondaire</Badge>
        <Badge variant="outline">Contour</Badge>
      </>,
    );
    expect(screen.getByText("Secondaire")).toBeInTheDocument();
    expect(screen.getByText("Contour")).toBeInTheDocument();
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
