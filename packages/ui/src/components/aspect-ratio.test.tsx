import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { AspectRatio } from "./aspect-ratio";

describe("AspectRatio", () => {
  it("renders wrapped content and stable slot hook", () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <img alt="Recipe cover" src="https://example.com/recipe.jpg" />
      </AspectRatio>,
    );

    const image = screen.getByRole("img", { name: "Recipe cover" });
    const root = image.closest("[data-slot='aspect-ratio']");

    expect(image).toBeInTheDocument();
    expect(root).toHaveAttribute("data-slot", "aspect-ratio");
  });

  it("applies the ratio-derived sizing wrapper from the radix primitive", () => {
    render(
      <AspectRatio ratio={1}>
        <img alt="Square thumbnail" src="https://example.com/square.jpg" />
      </AspectRatio>,
    );

    expect(
      screen
        .getByRole("img", { name: "Square thumbnail" })
        .closest("[data-radix-aspect-ratio-wrapper]"),
    ).toHaveStyle({ paddingBottom: "100%" });
  });

  it("merges className", () => {
    render(
      <AspectRatio ratio={1} className="mon-ratio">
        <img alt="Bowl" src="https://example.com/bowl.jpg" />
      </AspectRatio>,
    );

    expect(
      screen
        .getByRole("img", { name: "Bowl" })
        .closest("[data-slot='aspect-ratio']")?.className,
    ).toContain("mon-ratio");
  });

  it("forwards ref to the underlying element", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <AspectRatio ref={ref} ratio={1}>
        <img alt="Plate" src="https://example.com/plate.jpg" />
      </AspectRatio>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <AspectRatio ratio={4 / 3}>
        <img alt="Recipe" src="https://example.com/recipe-card.jpg" />
      </AspectRatio>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
