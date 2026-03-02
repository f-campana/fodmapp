import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { VisuallyHidden } from "./visually-hidden";

describe("VisuallyHidden", () => {
  it("renders hidden text for screen readers", () => {
    render(<VisuallyHidden>Texte caché</VisuallyHidden>);

    const hidden = screen.getByText("Texte caché");
    expect(hidden).toBeInTheDocument();
    expect(hidden).toHaveAttribute("data-slot", "visually-hidden");
    expect(hidden.className).toContain("sr-only");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<VisuallyHidden>Chargement</VisuallyHidden>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
