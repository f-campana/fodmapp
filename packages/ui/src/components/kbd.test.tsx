import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Kbd, KbdGroup } from "./kbd";

describe("Kbd", () => {
  it("renders kbd semantic element", () => {
    render(<Kbd>Cmd</Kbd>);
    const key = screen.getByText("Cmd");
    expect(key.tagName).toBe("KBD");
    expect(key).toHaveAttribute("data-slot", "kbd");
  });

  it("renders KbdGroup composition", () => {
    render(
      <KbdGroup>
        <Kbd>Cmd</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );

    const group = screen.getByText("Cmd").closest("[data-slot='kbd-group']");
    expect(group).toBeTruthy();
    expect(group?.className).toContain("inline-flex");
  });

  it("merges className", () => {
    render(<Kbd className="ma-touche">Ctrl</Kbd>);
    expect(screen.getByText("Ctrl").className).toContain("ma-touche");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Kbd>Entrée</Kbd>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
