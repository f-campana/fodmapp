import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Calendar } from "./calendar";

const defaultMonth = new Date(2026, 2, 1);

function getDayButton(container: HTMLElement, dayNumber: number) {
  const button = Array.from(
    container.querySelectorAll("[role='gridcell'] button"),
  ).find((candidate) => candidate.textContent?.trim() === String(dayNumber));

  if (!button) {
    throw new Error(`No day button found for day ${dayNumber}.`);
  }

  return button as HTMLButtonElement;
}

describe("Calendar", () => {
  it("keeps the root slot stable and uses bounded month navigation by default", () => {
    const { container } = render(
      <Calendar
        data-slot="custom-calendar"
        defaultMonth={defaultMonth}
        mode="single"
        selected={new Date(2026, 2, 12)}
        showOutsideDays={false}
      />,
    );

    const root = container.querySelector("[data-slot='calendar']");
    const nav = container.querySelector("nav");
    const dayButton = getDayButton(container, 12);
    const selectedCell = dayButton.closest("[role='gridcell']");
    const previousButton = screen.getByLabelText(/previous month/i);
    const nextButton = screen.getByLabelText(/next month/i);

    expect(root).toHaveAttribute("data-slot", "calendar");
    expect(root).toHaveAttribute("data-nav-layout", "after");
    expect(container.querySelector("[data-slot='custom-calendar']")).toBeNull();
    expect(root?.className ?? "").toContain("border-border");
    expect(nav?.className ?? "").toContain("absolute");
    expect(nav?.contains(previousButton)).toBe(true);
    expect(nav?.contains(nextButton)).toBe(true);
    expect(dayButton.className).not.toContain("aria-selected:bg-primary");
    expect(selectedCell?.className ?? "").toContain(
      "aria-selected:[&>button]:bg-primary",
    );
    expect(selectedCell?.className ?? "").toContain(
      "aria-selected:[&>button]:text-primary-foreground",
    );
  });

  it("supports single and range selection callbacks", async () => {
    const user = userEvent.setup();
    const onSelectSingle = vi.fn();
    const onSelectRange = vi.fn();

    const { container, rerender } = render(
      <Calendar
        defaultMonth={defaultMonth}
        mode="single"
        onSelect={onSelectSingle}
        showOutsideDays={false}
      />,
    );

    await user.click(getDayButton(container, 12));

    expect(onSelectSingle.mock.calls[0]?.[0]).toBeInstanceOf(Date);

    rerender(
      <Calendar
        defaultMonth={defaultMonth}
        mode="range"
        onSelect={onSelectRange}
        showOutsideDays={false}
      />,
    );

    await user.click(getDayButton(container, 12));
    await user.click(getDayButton(container, 18));

    expect(onSelectRange.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date),
      }),
    );
  });

  it("moves focus with arrow keys across the day grid", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Calendar
        defaultMonth={defaultMonth}
        mode="single"
        showOutsideDays={false}
      />,
    );

    const day12 = getDayButton(container, 12);
    const day13 = getDayButton(container, 13);

    day12.focus();
    expect(day12).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    await waitFor(() => {
      expect(day13).toHaveFocus();
    });
  });

  it("navigates to next and previous month", async () => {
    const user = userEvent.setup();

    render(
      <Calendar
        defaultMonth={defaultMonth}
        mode="single"
        showOutsideDays={false}
      />,
    );

    const nextButton = screen.getByLabelText(/next month/i);
    const previousButton = screen.getByLabelText(/previous month/i);

    await user.click(nextButton);
    expect(screen.getByText("April 2026")).toBeInTheDocument();

    await user.click(previousButton);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it("merges className", () => {
    const { container } = render(
      <Calendar className="calendrier-personnalise" mode="single" />,
    );

    expect(container.querySelector(".calendrier-personnalise")).toBeTruthy();
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Calendar
        defaultMonth={defaultMonth}
        mode="single"
        showOutsideDays={false}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
