import { expect, userEvent, within } from "storybook/test";

import {
  durationLaneRows,
  easingLaneRows,
  requiredSemanticMotionPaths,
  semanticMotionByPath,
} from "./motion-effects.data";

export async function playMotionEffectsShowcase({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Motion & Effects Tokens" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Motion Lanes")).toBeInTheDocument();
  await expect(
    canvas.queryByPlaceholderText(/search token path or value/i),
  ).not.toBeInTheDocument();

  const laneGroups = canvasElement.querySelectorAll(
    ".fd-tokendocs-motionLanes",
  );
  await expect(laneGroups.length).toBeGreaterThanOrEqual(2);

  const durationLanes = laneGroups[0];
  const easingLanes = laneGroups[1];

  await expect(
    durationLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-baseline")
      .length,
  ).toBe(0);
  await expect(
    durationLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-token")
      .length,
  ).toBe(durationLaneRows.length);
  await expect(
    durationLanes.querySelectorAll(
      ".fd-tokendocs-motionLaneBall.is-token.is-static",
    ).length,
  ).toBe(1);

  await expect(
    easingLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-baseline")
      .length,
  ).toBe(easingLaneRows.length);
  await expect(
    easingLanes.querySelectorAll(".fd-tokendocs-motionRailRow.is-token").length,
  ).toBe(easingLaneRows.length);

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export async function playMotionEffectsReference({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const canvas = within(canvasElement);
  await expect(
    canvas.getByRole("heading", { name: "Motion & Effects Token Reference" }),
  ).toBeInTheDocument();
  await expect(canvas.getByText("Motion References")).toBeInTheDocument();
  await expect(
    canvas.getByText("Semantic Motion References"),
  ).toBeInTheDocument();

  const durationsSection = canvasElement.querySelector(
    "#motion-grid-durations",
  );
  const easingSection = canvasElement.querySelector("#motion-grid-easing");
  const shadowSection = canvasElement.querySelector("#shadow-grid-shadow");
  if (!durationsSection || !easingSection || !shadowSection) {
    throw new Error("Expected motion sections to exist.");
  }

  await expect(durationsSection).toHaveAttribute("data-expanded", "true");
  await expect(easingSection).toHaveAttribute("data-expanded", "false");
  await expect(shadowSection).toHaveAttribute("data-expanded", "false");

  const easingToggle = easingSection.querySelector(".fd-tokendocs-groupToggle");
  if (!easingToggle) {
    throw new Error("Expected easing toggle to exist.");
  }

  await userEvent.click(easingToggle);
  await expect(easingSection).toHaveAttribute("data-expanded", "true");
  await expect(durationsSection).toHaveAttribute("data-expanded", "false");
  await expect(shadowSection).toHaveAttribute("data-expanded", "false");

  await userEvent.click(easingToggle);
  await expect(easingSection).toHaveAttribute("data-expanded", "true");
  await expect(durationsSection).toHaveAttribute("data-expanded", "false");

  const shadowToggle = shadowSection.querySelector(".fd-tokendocs-groupToggle");
  if (!shadowToggle) {
    throw new Error("Expected shadow toggle to exist.");
  }
  await userEvent.click(shadowToggle);
  await expect(shadowSection).toHaveAttribute("data-expanded", "true");
  await expect(easingSection).toHaveAttribute("data-expanded", "false");
  await expect(durationsSection).toHaveAttribute("data-expanded", "false");

  const durationsToggle = durationsSection.querySelector(
    ".fd-tokendocs-groupToggle",
  );
  if (!durationsToggle) {
    throw new Error("Expected durations toggle to exist.");
  }
  await userEvent.click(durationsToggle);
  await expect(durationsSection).toHaveAttribute("data-expanded", "true");
  await expect(easingSection).toHaveAttribute("data-expanded", "false");
  await expect(shadowSection).toHaveAttribute("data-expanded", "false");

  for (const path of requiredSemanticMotionPaths) {
    const row = semanticMotionByPath.get(path);
    await expect(
      row,
      `Missing semantic motion token row for ${path}`,
    ).toBeDefined();
    await expect(
      row !== undefined && row.light.trim().length > 0,
      `Expected light semantic motion value for ${path}`,
    ).toBe(true);
    await expect(
      row !== undefined && row.dark.trim().length > 0,
      `Expected dark semantic motion value for ${path}`,
    ).toBe(true);
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
