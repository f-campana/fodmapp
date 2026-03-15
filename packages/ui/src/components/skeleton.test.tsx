import { render } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders a decorative skeleton contract by default", () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton?.className).toContain("animate-pulse");
    expect(skeleton?.className).toContain("bg-muted");
  });

  it("merges className", () => {
    const { container } = render(<Skeleton className="ma-classe" />);
    expect(container.firstElementChild?.className).toContain("ma-classe");
  });

  it("allows aria-hidden to be overridden when needed", () => {
    const { container } = render(<Skeleton aria-hidden={false} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "false");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Skeleton className="h-6 w-40" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
