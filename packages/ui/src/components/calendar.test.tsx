import { fireEvent, render, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { Calendar } from "./calendar";

describe("Calendar", () => {
  it("renders root slot and semantic classes", () => {
    const { container } = render(
      <Calendar defaultMonth={new Date(2026, 2, 1)} mode="single" />,
    );

    const root = container.querySelector("[data-slot='calendar']");
    const dayButton = container.querySelector("[role='gridcell'] button");

    expect(root).toBeTruthy();
    expect(root?.className ?? "").toContain("border-border");
    expect(dayButton?.className ?? "").toContain("aria-selected:bg-primary");
    expect(dayButton?.className ?? "").toContain(
      "aria-selected:text-primary-foreground",
    );
  });

  it("supports single and range selection callbacks", async () => {
    const onSelectSingle = vi.fn();
    const onSelectRange = vi.fn();

    const { container, rerender } = render(
      <Calendar
        defaultMonth={new Date(2026, 2, 1)}
        mode="single"
        onSelect={onSelectSingle}
      />,
    );

    const singleDayButtons = container.querySelectorAll(
      "[role='gridcell'] button",
    );

    fireEvent.click(singleDayButtons[2] as Element);

    expect(onSelectSingle).toHaveBeenCalled();

    rerender(
      <Calendar
        defaultMonth={new Date(2026, 2, 1)}
        mode="range"
        onSelect={onSelectRange}
      />,
    );

    await waitFor(() => {
      const rangeDayButtons = container.querySelectorAll(
        "[role='gridcell'] button",
      );
      if (rangeDayButtons.length < 2) {
        throw new Error("Range day buttons not mounted");
      }

      fireEvent.click(rangeDayButtons[3] as Element);
      fireEvent.click(rangeDayButtons[8] as Element);
    });

    expect(onSelectRange).toHaveBeenCalled();
  });

  it("navigates to next and previous month", () => {
    const { getByLabelText } = render(
      <Calendar defaultMonth={new Date(2026, 2, 1)} mode="single" />,
    );

    const nextButton = getByLabelText(/next month/i);
    const previousButton = getByLabelText(/previous month/i);

    fireEvent.click(nextButton);
    fireEvent.click(previousButton);

    expect(nextButton).toBeInTheDocument();
    expect(previousButton).toBeInTheDocument();
  });

  it("merges className", () => {
    const { container } = render(
      <Calendar className="calendrier-personnalise" mode="single" />,
    );

    expect(container.querySelector(".calendrier-personnalise")).toBeTruthy();
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Calendar defaultMonth={new Date(2026, 2, 1)} mode="single" />,
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
