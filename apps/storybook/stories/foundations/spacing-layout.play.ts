import { expect, userEvent, within } from "storybook/test";

import {
  requiredSemanticSpacingPaths,
  semanticSpacingByPath,
} from "./spacing-layout.data";

export async function playSpacingLayoutShowcase({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Spacing & Layout Tokens" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Vertical Stack Rhythm")).toBeInTheDocument();
  await expect(canvas.getByText("Card Lattice Gutter")).toBeInTheDocument();
  await expect(
    canvas.queryByPlaceholderText(/search token path or value/i),
  ).not.toBeInTheDocument();

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export async function playSpacingLayoutReference({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Spacing & Layout Token Reference" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Spacing References")).toBeInTheDocument();
  await expect(
    canvas.getByText("Semantic Layout References"),
  ).toBeInTheDocument();

  const valueHeaders = canvas.getAllByRole("columnheader", { name: "Value" });
  await expect(valueHeaders.length).toBeGreaterThan(0);
  await expect(getComputedStyle(valueHeaders[0]).textAlign).toBe("right");

  const spacingSection = canvasElement.querySelector("#spacing-grid-spacing");
  if (!spacingSection) {
    throw new Error("Expected spacing section to exist.");
  }
  const spacingPaths = Array.from(
    spacingSection.querySelectorAll(
      ".fd-tokendocs-desktop .fd-tokendocs-row .fd-tokendocs-path",
    ),
  )
    .map((node) => node.textContent?.trim() ?? "")
    .filter(Boolean);
  await expect(spacingPaths.slice(0, 4)).toEqual([
    "base.space.0",
    "base.space.0_5",
    "base.space.1",
    "base.space.1_5",
  ]);

  const radiusSection = canvasElement.querySelector("#layout-grid-radius");
  const borderWidthSection = canvasElement.querySelector(
    "#layout-grid-border-width",
  );
  if (!radiusSection || !borderWidthSection) {
    throw new Error("Expected layout sections to exist.");
  }

  await expect(radiusSection).toHaveAttribute("data-expanded", "false");
  await expect(borderWidthSection).toHaveAttribute("data-expanded", "false");

  const borderWidthToggle = borderWidthSection.querySelector(
    ".fd-tokendocs-groupToggle",
  ) as HTMLButtonElement | null;
  if (!borderWidthToggle) {
    throw new Error("Expected border-width toggle to exist.");
  }

  await userEvent.click(borderWidthToggle);
  await expect(borderWidthSection).toHaveAttribute("data-expanded", "true");
  await expect(spacingSection).toHaveAttribute("data-expanded", "false");

  const borderWidthCopy = borderWidthSection.querySelector(
    ".fd-tokendocs-copy",
  ) as HTMLButtonElement | null;
  if (!borderWidthCopy) {
    throw new Error("Expected border-width copy button to exist.");
  }
  await expect(borderWidthCopy).toBeEnabled();

  await userEvent.click(borderWidthToggle);
  await expect(borderWidthSection).toHaveAttribute("data-expanded", "true");
  await expect(borderWidthCopy).toBeEnabled();

  const spacingToggle = spacingSection.querySelector(
    ".fd-tokendocs-groupToggle",
  ) as HTMLButtonElement | null;
  if (!spacingToggle) {
    throw new Error("Expected spacing toggle to exist.");
  }
  await userEvent.click(spacingToggle);
  await expect(spacingSection).toHaveAttribute("data-expanded", "true");
  await expect(borderWidthSection).toHaveAttribute("data-expanded", "false");

  for (const path of requiredSemanticSpacingPaths) {
    const row = semanticSpacingByPath.get(path);
    await expect(
      row,
      `Missing semantic spacing/layout token row for ${path}`,
    ).toBeDefined();
    await expect(
      row !== undefined && row.light.trim().length > 0,
      `Expected light semantic spacing/layout value for ${path}`,
    ).toBe(true);
    await expect(
      row !== undefined && row.dark.trim().length > 0,
      `Expected dark semantic spacing/layout value for ${path}`,
    ).toBe(true);
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
