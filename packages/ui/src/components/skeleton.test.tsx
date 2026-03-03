import { render } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders skeleton contract classes and data-slot", () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
    expect(skeleton?.className).toContain("animate-pulse");
    expect(skeleton?.className).toContain("bg-muted");
  });

  it("merges className", () => {
    const { container } = render(<Skeleton className="ma-classe" />);
    expect(container.firstElementChild?.className).toContain("ma-classe");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<Skeleton className="h-6 w-40" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
