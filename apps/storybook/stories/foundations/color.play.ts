import { expect, userEvent, within } from "storybook/test";

import {
  baseColorGroups,
  requiredSemanticColorPaths,
  semanticByPath,
  semanticColorGroups,
} from "./color.data";
import { isColorTokenValue } from "./token-docs.helpers";

export async function playColorShowcase({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Color Tokens" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Scale Matrix")).toBeInTheDocument();
  await expect(
    canvas.queryByPlaceholderText(/search token path or value/i),
  ).not.toBeInTheDocument();

  const rootStyles = getComputedStyle(document.documentElement);
  await expect(
    rootStyles.getPropertyValue("--color-background").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-foreground").trim(),
  ).not.toBe("");
  await expect(rootStyles.getPropertyValue("--color-primary").trim()).not.toBe(
    "",
  );
  await expect(
    rootStyles.getPropertyValue("--color-ring-accessible").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-border-control").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-ring-soft").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-destructive-hover").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-destructive-subtle").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-destructive-subtle-ring").trim(),
  ).not.toBe("");
  await expect(rootStyles.getPropertyValue("--color-outline").trim()).not.toBe(
    "",
  );
  await expect(
    rootStyles.getPropertyValue("--color-outline-hover").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-outline-border").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-outline-foreground").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-ghost-hover").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-ghost-foreground").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-validation-error-border").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-validation-error-ring").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-validation-error-ring-soft").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-validation-error-text").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-success-subtle").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-danger-subtle").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-surface-inverse").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-foreground-inverse").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-border-subtle").trim(),
  ).not.toBe("");
  await expect(
    rootStyles.getPropertyValue("--color-border-strong").trim(),
  ).not.toBe("");

  for (const path of requiredSemanticColorPaths) {
    const semanticRow = semanticByPath.get(path);
    await expect(
      semanticRow,
      `Missing semantic token row for ${path}`,
    ).toBeDefined();
    await expect(
      semanticRow && isColorTokenValue(semanticRow.light),
      `Expected light semantic value for ${path}`,
    ).toBe(true);
    await expect(
      semanticRow && isColorTokenValue(semanticRow.dark),
      `Expected dark semantic value for ${path}`,
    ).toBe(true);
  }

  const section = canvasElement.querySelector(".fd-tokendocs-section");
  if (!section) {
    throw new Error("Expected at least one token section.");
  }
  await expect(getComputedStyle(section).backgroundImage).not.toBe("none");

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export async function playColorReference({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Color Token Reference" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Base Color References")).toBeInTheDocument();

  const canonicalBaseGroup = baseColorGroups[0];
  const canonicalSemanticGroup = semanticColorGroups[0];

  if (!canonicalBaseGroup || !canonicalSemanticGroup) {
    throw new Error("Expected base and semantic color groups to be present.");
  }

  const initialSection = canvasElement.querySelector(
    `#base-color-grid-${canonicalBaseGroup.id}`,
  );
  const semanticSection = canvasElement.querySelector(
    `#semantic-color-grid-${canonicalSemanticGroup.id}`,
  );
  if (!initialSection || !semanticSection) {
    throw new Error(
      "Expected canonical base and semantic sections to be present.",
    );
  }

  await expect(initialSection).toHaveAttribute("data-expanded", "true");
  await expect(semanticSection).toHaveAttribute("data-expanded", "false");

  const semanticJumpNav = canvas.getByRole("navigation", {
    name: "Semantic color group jump links",
  });
  const openSemanticButton = within(semanticJumpNav).getByRole("button", {
    name: canonicalSemanticGroup.label,
  });
  await userEvent.click(openSemanticButton);

  await expect(semanticSection).toHaveAttribute("data-expanded", "true");
  await expect(initialSection).toHaveAttribute("data-expanded", "false");

  const semanticToggle = semanticSection.querySelector(
    ".fd-tokendocs-groupToggle",
  ) as HTMLButtonElement | null;
  if (!semanticToggle) {
    throw new Error("Expected semantic group toggle to exist.");
  }
  await userEvent.click(semanticToggle);
  await expect(semanticSection).toHaveAttribute("data-expanded", "true");
  await expect(initialSection).toHaveAttribute("data-expanded", "false");

  const baseJumpNav = canvas.getByRole("navigation", {
    name: "Base color group jump links",
  });
  const alternateBaseGroup =
    baseColorGroups.find((group) => group.id !== canonicalBaseGroup.id) ??
    canonicalBaseGroup;
  const alternateBaseSection = canvasElement.querySelector(
    `#base-color-grid-${alternateBaseGroup.id}`,
  );
  if (!alternateBaseSection) {
    throw new Error("Expected alternate base section to be present.");
  }
  const alternateBaseButton = within(baseJumpNav).getByRole("button", {
    name: alternateBaseGroup.label,
  });
  const restoreBaseButton = within(baseJumpNav).getByRole("button", {
    name: canonicalBaseGroup.label,
  });

  await userEvent.click(restoreBaseButton);
  await userEvent.click(alternateBaseButton);
  await expect(alternateBaseSection).toHaveAttribute("data-expanded", "true");

  if (alternateBaseGroup.id !== canonicalBaseGroup.id) {
    await expect(initialSection).toHaveAttribute("data-expanded", "false");
  }

  await userEvent.click(restoreBaseButton);

  await expect(initialSection).toHaveAttribute("data-expanded", "true");
  await expect(semanticSection).toHaveAttribute("data-expanded", "false");

  const canonicalValueCluster = initialSection.querySelector(
    ".fd-tokendocs-row .fd-tokendocs-cellValueCluster",
  );
  const canonicalCopy = canonicalValueCluster?.querySelector(
    ".fd-tokendocs-copy",
  ) as HTMLButtonElement | null;
  if (!canonicalValueCluster || !canonicalCopy) {
    throw new Error(
      "Expected canonical value cluster and copy button to exist.",
    );
  }
  await expect(canonicalCopy).toBeEnabled();

  const canonicalPathCopy = initialSection.querySelector(
    ".fd-tokendocs-cell .fd-tokendocs-copy",
  ) as HTMLButtonElement | null;
  if (!canonicalPathCopy) {
    throw new Error("Expected canonical path copy button to exist.");
  }
  await expect(canonicalPathCopy).toBeEnabled();

  restoreBaseButton.focus();
  let reachedPathCopy = false;
  for (let tabCount = 0; tabCount < 80; tabCount += 1) {
    await userEvent.tab();
    if (document.activeElement === canonicalPathCopy) {
      reachedPathCopy = true;
      break;
    }
  }

  await expect(reachedPathCopy).toBe(true);
  await expect(canonicalPathCopy).toHaveFocus();

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
