import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Calendar } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function CalendarAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-calendar-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const defaultMonth = new Date(2026, 2, 1);
const defaultSelectedDate = new Date(2026, 2, 12);
const defaultTodayDate = new Date(2026, 2, 14);
const defaultDisabledDate = new Date(2026, 2, 19);

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  fixedWeeks: false,
  numberOfMonths: 1,
  showOutsideDays: true,
} as const;

function formatLocalDate(value: Date | undefined) {
  if (!value) {
    return "empty";
  }

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDayButton(canvasElement: HTMLElement, dayNumber: number) {
  const button = Array.from(
    canvasElement.querySelectorAll("[role='gridcell'] button"),
  ).find((candidate) => candidate.textContent?.trim() === String(dayNumber));

  if (!button) {
    throw new Error(`No day button found for day ${dayNumber}.`);
  }

  return button as HTMLButtonElement;
}

function getCalendarSelectionKey(args?: Story["args"]) {
  return [
    args?.fixedWeeks ?? defaultPlaygroundArgs.fixedWeeks,
    args?.numberOfMonths ?? defaultPlaygroundArgs.numberOfMonths,
    args?.showOutsideDays ?? defaultPlaygroundArgs.showOutsideDays,
  ].join(":");
}

function CalendarSelection({
  args,
  dataSlot,
}: {
  args?: Story["args"];
  dataSlot?: string;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultSelectedDate,
  );

  return (
    <div className="space-y-3">
      <Calendar
        {...args}
        data-slot={dataSlot}
        defaultMonth={defaultMonth}
        disabled={[defaultDisabledDate]}
        mode="single"
        onSelect={setSelectedDate}
        selected={selectedDate}
        today={defaultTodayDate}
      />
      <p
        className="text-sm text-muted-foreground"
        data-selected-date={formatLocalDate(selectedDate)}
      >
        Date selectionnee:{" "}
        {selectedDate ? formatLocalDate(selectedDate) : "aucune"}
      </p>
    </div>
  );
}

const meta = {
  title: "Composed/Calendar",
  component: Calendar,
  argTypes: {
    fixedWeeks: {
      description: "Always renders six week rows for a consistent grid height.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    numberOfMonths: {
      description: "Displays one or more adjacent months in the same calendar.",
      control: { type: "number", min: 1, max: 2, step: 1 },
      table: { defaultValue: { summary: "1" } },
    },
    showOutsideDays: {
      description: "Shows the leading and trailing days from adjacent months.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: {
      expanded: true,
      include: ["fixedWeeks", "numberOfMonths", "showOutsideDays"],
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-calendar-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <CalendarAuditFrame centeredMinHeight={72} maxWidth="md">
      <CalendarSelection args={args} key={getCalendarSelectionKey(args)} />
    </CalendarAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CalendarAuditFrame centeredMinHeight={72} maxWidth="md">
      <CalendarSelection
        args={defaultPlaygroundArgs}
        key={getCalendarSelectionKey(defaultPlaygroundArgs)}
      />
    </CalendarAuditFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
};

export const InteractionChecks: Story = {
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <CalendarAuditFrame centeredMinHeight={72} maxWidth="md">
      <CalendarSelection
        args={args}
        dataSlot="custom-calendar"
        key={getCalendarSelectionKey(args)}
      />
    </CalendarAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='calendar']");
    const selectedDateReadout = canvasElement.querySelector(
      "[data-selected-date]",
    );
    const selectedDay = getDayButton(canvasElement, 12);
    const nextDay = getDayButton(canvasElement, 13);
    const disabledDay = getDayButton(canvasElement, 19);

    await expect(root).toHaveAttribute("data-slot", "calendar");
    await expect(
      canvasElement.querySelector("[data-slot='custom-calendar']"),
    ).toBeNull();
    await expect(root?.className ?? "").toContain("border-border");
    await expect(selectedDay.className).toContain("aria-selected:bg-primary");
    await expect(
      canvasElement.querySelector("[data-day='2026-03-14'][data-today='true']"),
    ).toBeTruthy();
    await expect(disabledDay).toBeDisabled();
    await expect(disabledDay.className).toContain("opacity-50");

    selectedDay.focus();
    await expect(selectedDay).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");

    await waitFor(() => {
      if (document.activeElement !== nextDay) {
        throw new Error("The next day is not focused yet.");
      }
    });

    await userEvent.click(nextDay);

    await expect(canvas.getByText(/Date selectionnee:/)).toBeTruthy();
    await expect(selectedDateReadout).toHaveAttribute(
      "data-selected-date",
      "2026-03-13",
    );
  },
};
