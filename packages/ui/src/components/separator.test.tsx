import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Separator } from "./separator";

describe("Separator", () => {
  it("renders separator role when non-decorative", () => {
    render(<Separator decorative={false} orientation="horizontal" />);

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("data-slot", "separator");
    expect(separator.className).toContain("bg-border");
  });

  it("supports vertical orientation", () => {
    render(<Separator decorative={false} orientation="vertical" />);

    const separator = screen.getByRole("separator");

    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator.className).toContain("w-px");
  });

  it("merges className", () => {
    render(<Separator decorative={false} className="mon-separateur" />);

    expect(screen.getByRole("separator").className).toContain("mon-separateur");
  });

  it("supports decorative mode", () => {
    render(<Separator decorative />);

    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("forwards ref to separator element", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Separator ref={ref} decorative={false} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Separator decorative={false} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
