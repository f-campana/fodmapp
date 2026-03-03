import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { AspectRatio } from "./aspect-ratio";

describe("AspectRatio", () => {
  it("renders wrapped content and data-slot", () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <img alt="Repas équilibré" src="https://example.com/repas.jpg" />
      </AspectRatio>,
    );

    const image = screen.getByRole("img", { name: "Repas équilibré" });
    expect(image).toBeInTheDocument();
    expect(image.closest("[data-slot='aspect-ratio']")).toHaveAttribute(
      "data-slot",
      "aspect-ratio",
    );
  });

  it("merges className", () => {
    render(
      <AspectRatio ratio={1} className="mon-ratio">
        <img alt="Bol" src="https://example.com/bol.jpg" />
      </AspectRatio>,
    );

    expect(
      screen
        .getByRole("img", { name: "Bol" })
        .closest("[data-slot='aspect-ratio']")?.className,
    ).toContain("mon-ratio");
  });

  it("forwards ref to the underlying element", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <AspectRatio ref={ref} ratio={1}>
        <img alt="Assiette" src="https://example.com/assiette.jpg" />
      </AspectRatio>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <AspectRatio ratio={4 / 3}>
        <img alt="Recette" src="https://example.com/recette.jpg" />
      </AspectRatio>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
