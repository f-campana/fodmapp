import {
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { DatePicker } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function DatePickerAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-date-picker-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const defaultMonth = new Date(2026, 2, 1);

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

type DatePickerStoryArgs = Pick<
  ComponentProps<typeof DatePicker>,
  | "disabled"
  | "onOpenChange"
  | "onValueChange"
  | "placeholder"
  | "triggerAriaLabel"
>;

const defaultPlaygroundArgs = {
  disabled: false,
  onOpenChange: fn(),
  onValueChange: fn(),
  placeholder: "Choisir une date",
  triggerAriaLabel: "Date de rendez-vous",
} satisfies DatePickerStoryArgs;

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

function getMonthNavigationButton(direction: "next" | "previous") {
  const button = Array.from(
    document.querySelectorAll("[data-slot='date-picker-calendar'] button"),
  ).find((candidate) =>
    candidate
      .getAttribute("aria-label")
      ?.toLowerCase()
      .includes(direction === "previous" ? "previous month" : "next month"),
  );

  if (!button) {
    throw new Error(`No ${direction} month button found.`);
  }

  return button as HTMLButtonElement;
}

function getDatePickerFieldKey(args?: DatePickerStoryArgs) {
  return [
    args?.disabled ?? defaultPlaygroundArgs.disabled,
    args?.placeholder ?? defaultPlaygroundArgs.placeholder,
    args?.triggerAriaLabel ?? defaultPlaygroundArgs.triggerAriaLabel,
  ].join(":");
}

function DatePickerField({
  args,
  calendarDataSlot,
  dataSlot,
  description,
}: {
  args?: DatePickerStoryArgs;
  calendarDataSlot?: string;
  dataSlot?: string;
  description: string;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  return (
    <div className="space-y-3">
      <DatePicker
        {...args}
        calendarProps={{
          defaultMonth,
          showOutsideDays: false,
          "data-slot": calendarDataSlot,
        }}
        data-slot={dataSlot}
        onValueChange={(nextValue) => {
          setSelectedDate(nextValue);
          args?.onValueChange?.(nextValue);
        }}
      />
      <p className="text-sm text-muted-foreground">{description}</p>
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
  title: "Composed/DatePicker",
  component: DatePicker as ComponentType<DatePickerStoryArgs>,
  argTypes: {
    disabled: {
      description:
        "Disables the trigger button and keeps the selection frozen.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    placeholder: {
      description: "Placeholder text shown before a date is selected.",
      control: { type: "text" },
      table: { defaultValue: { summary: "Choisir une date" } },
    },
    triggerAriaLabel: {
      description: "Accessible name applied to the trigger button.",
      control: { type: "text" },
      table: { defaultValue: { summary: "Date de rendez-vous" } },
    },
    onOpenChange: {
      description: "Callback fired whenever the popover open state changes.",
    },
    onValueChange: {
      description: "Callback fired when the selected date changes.",
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: {
      expanded: true,
      include: ["disabled", "placeholder", "triggerAriaLabel"],
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-date-picker-audit-root]"],
      },
    },
  },
} satisfies Meta<DatePickerStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <DatePickerAuditFrame centeredMinHeight={72} maxWidth="sm">
      <DatePickerField
        args={args}
        description="The trigger stays compact until the user opens the calendar popover."
        key={getDatePickerFieldKey(args)}
      />
    </DatePickerAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DatePickerAuditFrame centeredMinHeight={72} maxWidth="sm">
      <DatePickerField
        args={defaultPlaygroundArgs}
        description="Use DatePicker when the date choice should stay behind a trigger until the user needs it."
        key={getDatePickerFieldKey(defaultPlaygroundArgs)}
      />
    </DatePickerAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DatePickerAuditFrame centeredMinHeight={72} maxWidth="sm" surface>
      <DatePickerField
        args={defaultPlaygroundArgs}
        description="This composition keeps the trigger inside a surfaced form block without changing the popover contract."
        key={getDatePickerFieldKey(defaultPlaygroundArgs)}
      />
    </DatePickerAuditFrame>
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
  args: {
    ...defaultPlaygroundArgs,
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <DatePickerAuditFrame centeredMinHeight={72} maxWidth="sm">
      <DatePickerField
        args={args}
        calendarDataSlot="custom-calendar"
        dataSlot="custom-date-picker"
        description="Verify slot stability, portal mounting, Escape close, and the single-date selection flow."
        key={getDatePickerFieldKey(args)}
      />
    </DatePickerAuditFrame>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", {
      name: "Date de rendez-vous",
    });

    await expect(
      canvasElement.querySelector("[data-slot='date-picker']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='custom-date-picker']"),
    ).toBeNull();
    await expect(trigger).toHaveAttribute("data-slot", "date-picker-trigger");
    await expect(trigger.className).toContain("border-input");
    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");

    await userEvent.click(trigger);

    const popover = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='popover-content']");
      if (!node) {
        throw new Error("DatePicker popover is not mounted yet.");
      }

      return node as HTMLElement;
    });

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='date-picker-content']",
      );
      if (!node) {
        throw new Error("DatePicker content is not mounted yet.");
      }

      return node as HTMLElement;
    });
    const calendar = document.body.querySelector(
      "[data-slot='date-picker-calendar'] [data-slot='calendar']",
    ) as HTMLElement | null;
    const nav = calendar?.querySelector("nav");
    const previousButton = getMonthNavigationButton("previous");
    const nextButton = getMonthNavigationButton("next");
    const popoverRect = popover.getBoundingClientRect();
    const calendarRect = calendar?.getBoundingClientRect();
    const previousRect = previousButton.getBoundingClientRect();
    const nextRect = nextButton.getBoundingClientRect();

    if (!calendar) {
      throw new Error("DatePicker calendar is not mounted yet.");
    }

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(popover.className).toContain("bg-popover");
    await expect(popover.className).toContain("border-border");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).not.toContain("bg-popover");
    await expect(canvasElement.contains(content)).toBe(false);
    await expect(
      document.body.querySelector("[data-slot='date-picker-calendar']"),
    ).toBeTruthy();
    await expect(
      document.body.querySelector("[data-slot='custom-calendar']"),
    ).toBeNull();
    await expect(calendar).toHaveAttribute("data-nav-layout", "after");
    await expect(calendar.className).toContain("border-0");
    await expect(calendar.className).toContain("rounded-none");
    await expect(calendar.className).toContain("bg-transparent");
    await expect(nav?.className ?? "").toContain("absolute");

    if (!calendarRect) {
      throw new Error("DatePicker calendar has no measurable bounds.");
    }

    if (Math.abs(popoverRect.width - calendarRect.width) > 2) {
      throw new Error(
        "DatePicker popover and calendar should render as one surface.",
      );
    }

    if (
      previousRect.left < calendarRect.left ||
      previousRect.right > calendarRect.right ||
      nextRect.left < calendarRect.left ||
      nextRect.right > calendarRect.right
    ) {
      throw new Error(
        "DatePicker month navigation escaped the calendar bounds.",
      );
    }

    await userEvent.click(getDayButton(12));

    await expect(args.onValueChange).toHaveBeenCalledWith(expect.any(Date));
    await expect(
      canvasElement.querySelector("[data-selected-date]"),
    ).toHaveAttribute("data-selected-date", "2026-03-12");

    await waitFor(() => {
      if (document.body.querySelector("[data-slot='date-picker-content']")) {
        throw new Error("DatePicker content should close after selection.");
      }
    });

    await userEvent.click(trigger);

    await waitFor(() => {
      if (!document.body.querySelector("[data-slot='date-picker-content']")) {
        throw new Error("DatePicker content did not reopen.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (document.body.querySelector("[data-slot='date-picker-content']")) {
        throw new Error("DatePicker content is still mounted after Escape.");
      }
      if (document.activeElement !== trigger) {
        throw new Error("DatePicker trigger did not regain focus.");
      }
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <DatePickerAuditFrame centeredMinHeight={72} maxWidth="sm">
      <DatePickerField
        args={{
          ...defaultPlaygroundArgs,
          placeholder:
            "Selectionner une date de suivi avec la note clinique associee",
          triggerAriaLabel: "Date de suivi clinique",
        }}
        description="Keep the trigger label readable and the opened calendar usable on compact form widths."
        key={getDatePickerFieldKey({
          ...defaultPlaygroundArgs,
          placeholder:
            "Selectionner une date de suivi avec la note clinique associee",
          triggerAriaLabel: "Date de suivi clinique",
        })}
      />
    </DatePickerAuditFrame>
  ),
};
