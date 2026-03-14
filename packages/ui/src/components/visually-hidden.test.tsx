import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { VisuallyHidden } from "./visually-hidden";

describe("VisuallyHidden", () => {
  it("renders assistive text that still names an icon-only control", () => {
    render(
      <button type="button">
        <span aria-hidden="true">|||</span>
        <VisuallyHidden>Open navigation</VisuallyHidden>
      </button>,
    );

    const button = screen.getByRole("button", { name: "Open navigation" });
    const hidden = screen.getByText("Open navigation");

    expect(button).toBeInTheDocument();
    expect(hidden).toBeInTheDocument();
    expect(hidden).toHaveAttribute("data-slot", "visually-hidden");
    expect(hidden.className).toContain("sr-only");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<VisuallyHidden>Loading</VisuallyHidden>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
