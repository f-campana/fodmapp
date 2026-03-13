import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "./date-picker";

window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();

const defaultMonth = new Date(2026, 2, 1);

function formatLocalDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDayButton(dayNumber: number) {
  const button = Array.from(
    document.querySelectorAll(
      "[data-slot='date-picker-calendar'] [role='gridcell'] button",
    ),
  ).find((candidate) => candidate.textContent?.trim() === String(dayNumber));

  if (!button) {
    throw new Error(`No day button found for day ${dayNumber}.`);
  }

  return button as HTMLButtonElement;
}

describe("DatePicker", () => {
  function renderDatePicker(props?: React.ComponentProps<typeof DatePicker>) {
    return render(
      <DatePicker
        calendarProps={{ defaultMonth, showOutsideDays: false }}
        placeholder="Choisir une date"
        triggerAriaLabel="Date de consultation"
        {...props}
      />,
    );
  }

  it("keeps the root and calendar slots stable and renders composed slots", async () => {
    const { container } = renderDatePicker({
      calendarProps: {
        defaultMonth,
        showOutsideDays: false,
        "data-slot": "custom-calendar",
      },
      "data-slot": "custom-date-picker",
      defaultOpen: true,
    });

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='date-picker-content']");
      if (!node) {
        throw new Error("DatePicker content not mounted yet.");
      }

      return node as HTMLElement;
    });

    expect(container.querySelector("[data-slot='date-picker']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='custom-date-picker']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='date-picker-trigger']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='date-picker-icon']"),
    ).toBeTruthy();
    expect(content).toHaveAttribute("data-slot", "date-picker-content");
    expect(
      document.querySelector("[data-slot='date-picker-calendar']"),
    ).toBeTruthy();
    expect(
      document.querySelector(
        "[data-slot='date-picker-calendar'] [data-slot='calendar']",
      ),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='custom-calendar']")).toBeNull();
  });

  it("opens and closes with the trigger, Escape, and outside click", async () => {
    const user = userEvent.setup();

    renderDatePicker();

    const trigger = screen.getByRole("button", {
      name: "Date de consultation",
    });

    await user.click(trigger);

    const content = await waitFor(() => {
      const node = document.querySelector(
        "[data-slot='date-picker-content']",
      ) as HTMLElement | null;
      if (!node) {
        throw new Error("DatePicker content not mounted yet.");
      }

      return node;
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeNull();
      expect(trigger).toHaveFocus();
    });

    await user.click(trigger);

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
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderDatePicker({ onValueChange });

    await user.click(
      screen.getByRole("button", { name: "Date de consultation" }),
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    await user.click(getDayButton(12));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toBeInstanceOf(Date);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeNull();
    });
  });

  it("supports controlled value updates via callback", async () => {
    const user = userEvent.setup();

    function ControlledExample() {
      const [value, setValue] = useState<Date | undefined>();

      return (
        <>
          <span data-value={value ? formatLocalDate(value) : "empty"} />
          <DatePicker
            calendarProps={{ defaultMonth, showOutsideDays: false }}
            onValueChange={setValue}
            triggerAriaLabel="Date controlee"
            value={value}
          />
        </>
      );
    }

    const { container } = render(<ControlledExample />);

    await user.click(screen.getByRole("button", { name: "Date controlee" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    await user.click(getDayButton(13));

    await waitFor(() => {
      expect(container.querySelector("[data-value]")).toHaveAttribute(
        "data-value",
        "2026-03-13",
      );
    });
  });

  it("keeps the value unchanged when selecting the same date and still closes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const selectedDate = new Date(2026, 2, 12);

    renderDatePicker({
      onValueChange,
      value: selectedDate,
    });

    await user.click(
      screen.getByRole("button", { name: "Date de consultation" }),
    );

    await user.click(getDayButton(12));

    expect(onValueChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeNull();
    });
  });

  it("applies semantic class contracts", async () => {
    const user = userEvent.setup();
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

    await user.click(
      screen.getByRole("button", { name: "Date de consultation" }),
    );

    const content = await waitFor(() => {
      const node = document.querySelector(
        "[data-slot='date-picker-content']",
      ) as HTMLElement | null;
      if (!node) {
        throw new Error("DatePicker content not mounted yet.");
      }

      return node;
    });

    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
  });

  it("merges className and supports the root ref", async () => {
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
    renderDatePicker({ defaultOpen: true });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='date-picker-content']"),
      ).toBeTruthy();
    });

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
