import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "./date-picker";

window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();

function getFirstAvailableDayButton() {
  const dayButtons = Array.from(
    document.querySelectorAll(
      "[data-slot='date-picker-calendar'] [role='gridcell'] button",
    ),
  ) as HTMLButtonElement[];

  const firstEnabledButton = dayButtons.find((button) => !button.disabled);

  if (!firstEnabledButton) {
    throw new Error("No available day button found");
  }

  return firstEnabledButton;
}

describe("DatePicker", () => {
  function renderDatePicker(props?: React.ComponentProps<typeof DatePicker>) {
    return render(
      <DatePicker
        calendarProps={{ defaultMonth: new Date(2026, 2, 1) }}
        placeholder="Choisir une date"
        triggerAriaLabel="Date de consultation"
        {...props}
      />,
    );
  }

  it("renders root and composed slots", async () => {
    const { container } = renderDatePicker({ defaultOpen: true });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='date-picker']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='date-picker-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='date-picker-content']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='date-picker-calendar']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='date-picker-icon']"),
    ).toBeTruthy();
  });

  it("opens and closes with trigger, Escape, and outside click", async () => {
    renderDatePicker();

    const trigger = screen.getByRole("button", {
      name: "Date de consultation",
    });

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    const content = document.querySelector(
      "[data-slot='date-picker-content']",
    ) as HTMLElement | null;

    fireEvent.keyDown(content ?? document.body, {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeNull();
    });

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeNull();
    });
  });

  it("updates uncontrolled value and closes on date selection", async () => {
    const onValueChange = vi.fn();

    renderDatePicker({ onValueChange });

    fireEvent.click(
      screen.getByRole("button", { name: "Date de consultation" }),
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    fireEvent.click(getFirstAvailableDayButton());

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toBeInstanceOf(Date);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeNull();
    });
  });

  it("supports controlled value updates via callback", async () => {
    function ControlledExample() {
      const [value, setValue] = useState<Date | undefined>();

      return (
        <>
          <span
            data-value={value ? value.toISOString().slice(0, 10) : "empty"}
          />
          <DatePicker
            calendarProps={{ defaultMonth: new Date(2026, 2, 1) }}
            onValueChange={setValue}
            triggerAriaLabel="Date controlee"
            value={value}
          />
        </>
      );
    }

    const { container } = render(<ControlledExample />);

    fireEvent.click(screen.getByRole("button", { name: "Date controlee" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    fireEvent.click(getFirstAvailableDayButton());

    await waitFor(() => {
      expect(container.querySelector("[data-value]")).not.toHaveAttribute(
        "data-value",
        "empty",
      );
    });
  });

  it("keeps value unchanged when selecting the same date and still closes", async () => {
    const onValueChange = vi.fn();
    const selectedDate = new Date(2026, 2, 12);

    renderDatePicker({
      calendarProps: { defaultMonth: new Date(2026, 2, 1) },
      onValueChange,
      value: selectedDate,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Date de consultation" }),
    );

    const selectedButton = await waitFor(() => {
      const node = document.querySelector(
        "[data-slot='date-picker-calendar'] [role='gridcell'][aria-selected='true'] button",
      );

      if (!node) {
        throw new Error("Selected date button not mounted yet");
      }

      return node as HTMLElement;
    });

    fireEvent.click(selectedButton);

    expect(onValueChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeNull();
    });
  });

  it("applies semantic class contracts", async () => {
    const { container } = renderDatePicker();

    const trigger = container.querySelector(
      "[data-slot='date-picker-trigger']",
    ) as HTMLElement | null;

    expect(trigger?.className ?? "").toContain("border-input");
    expect(trigger?.className ?? "").toContain("bg-background");
    expect(trigger?.className ?? "").toContain(
      "data-[empty=true]:text-muted-foreground",
    );
    expect(trigger?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(trigger?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Date de consultation" }),
    );

    const content = await waitFor(() => {
      const node = document.querySelector(
        "[data-slot='date-picker-content']",
      ) as HTMLElement | null;
      if (!node) {
        throw new Error("DatePicker content not mounted yet");
      }
      return node;
    });

    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
  });

  it("merges className and supports root ref", async () => {
    const rootRef = createRef<HTMLDivElement>();
    const { container } = renderDatePicker({
      calendarClassName: "calendrier-personnalise",
      className: "date-picker-personnalise",
      contentClassName: "contenu-personnalise",
      defaultOpen: true,
      ref: rootRef,
      triggerClassName: "declencheur-personnalise",
    });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector(".date-picker-personnalise")).toBeTruthy();
    expect(container.querySelector(".declencheur-personnalise")).toBeTruthy();
    expect(document.querySelector(".contenu-personnalise")).toBeTruthy();
    expect(document.querySelector(".calendrier-personnalise")).toBeTruthy();
    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderDatePicker();

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
