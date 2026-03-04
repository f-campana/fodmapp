import { expect, userEvent, within } from "storybook/test";

import {
  requiredSemanticTypographyPaths,
  semanticTypographyByPath,
} from "./typography.data";

export async function playTypographyShowcase({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Typography Tokens" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Type Waterfall")).toBeInTheDocument();
  await expect(
    canvas.queryByPlaceholderText(/search token path or value/i),
  ).not.toBeInTheDocument();

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export async function playTypographyReference({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Typography Token Reference" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Typography Primitives")).toBeInTheDocument();
  await expect(
    canvas.getByText("Semantic Typography References"),
  ).toBeInTheDocument();

  const familiesSection = canvasElement.querySelector(
    "#typography-grid-families",
  );
  const sizesSection = canvasElement.querySelector("#typography-grid-sizes");
  if (!familiesSection || !sizesSection) {
    throw new Error("Expected typography sections to exist.");
  }

  await expect(familiesSection).toHaveAttribute("data-expanded", "true");
  await expect(sizesSection).toHaveAttribute("data-expanded", "false");

  const sizesToggle = sizesSection.querySelector(".fd-tokendocs-groupToggle");
  if (!sizesToggle) {
    throw new Error("Expected sizes toggle to exist.");
  }

  await userEvent.click(sizesToggle);
  await expect(sizesSection).toHaveAttribute("data-expanded", "true");
  await expect(familiesSection).toHaveAttribute("data-expanded", "false");

  await userEvent.click(sizesToggle);
  await expect(sizesSection).toHaveAttribute("data-expanded", "true");
  await expect(familiesSection).toHaveAttribute("data-expanded", "false");

  const familiesToggle = familiesSection.querySelector(
    ".fd-tokendocs-groupToggle",
  );
  if (!familiesToggle) {
    throw new Error("Expected families toggle to exist.");
  }
  await userEvent.click(familiesToggle);
  await expect(familiesSection).toHaveAttribute("data-expanded", "true");
  await expect(sizesSection).toHaveAttribute("data-expanded", "false");

  for (const path of requiredSemanticTypographyPaths) {
    const row = semanticTypographyByPath.get(path);
    await expect(
      row,
      `Missing semantic typography token row for ${path}`,
    ).toBeDefined();
    await expect(
      row !== undefined && row.light.trim().length > 0,
      `Expected light semantic typography value for ${path}`,
    ).toBe(true);
    await expect(
      row !== undefined && row.dark.trim().length > 0,
      `Expected dark semantic typography value for ${path}`,
    ).toBe(true);
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
