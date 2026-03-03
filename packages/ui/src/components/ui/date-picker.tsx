"use client";

import * as React from "react";

import { useControllableState } from "../../hooks/use-controllable-state";
import { useLocale } from "../../hooks/use-locale";
import { cn } from "../../lib/cn";
import { Button } from "./button";
import { Calendar, type CalendarProps } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

function isSameCalendarDay(left: Date | undefined, right: Date | undefined) {
  if (!left || !right) {
    return false;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

type DatePickerCalendarProps = Omit<
  CalendarProps,
  "initialFocus" | "mode" | "onSelect" | "selected"
>;

export interface DatePickerProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (value: Date | undefined) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
  calendarClassName?: string;
  calendarProps?: DatePickerCalendarProps;
  disabled?: boolean;
}

function DatePicker({
  className,
  value,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  placeholder = "Choisir une date",
  triggerAriaLabel = "Sélecteur de date",
  triggerClassName,
  contentClassName,
  calendarClassName,
  calendarProps,
  disabled = false,
  ...props
}: DatePickerProps) {
  const { formatDate } = useLocale();
  const [open = false, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const [selectedDate, setSelectedDate] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });

  const { className: calendarPropsClassName, ...restCalendarProps } =
    calendarProps ?? {};

  const contentId = React.useId();

  const triggerLabel = selectedDate
    ? formatDate(selectedDate, { dateStyle: "long" })
    : placeholder;

  const handleSelect = React.useCallback(
    (nextDate: Date | undefined) => {
      if (!nextDate) {
        setOpen(false);
        return;
      }

      if (!isSameCalendarDay(selectedDate, nextDate)) {
        setSelectedDate(nextDate);
      }

      setOpen(false);
    },
    [selectedDate, setOpen, setSelectedDate],
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <div
        className={cn("w-full", className)}
        data-slot="date-picker"
        {...props}
      >
        <PopoverTrigger asChild>
          <Button
            aria-controls={contentId}
            aria-expanded={open}
            aria-label={triggerAriaLabel}
            className={cn(
              "h-10 w-full justify-between border-input bg-background text-foreground hover:bg-background",
              "data-[empty=true]:text-muted-foreground",
              triggerClassName,
            )}
            data-empty={selectedDate ? "false" : "true"}
            data-slot="date-picker-trigger"
            disabled={disabled}
            variant="outline"
          >
            <span className="truncate text-left">{triggerLabel}</span>
            <svg
              aria-hidden="true"
              className="size-4"
              data-slot="date-picker-icon"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2V5M16 2V5M3.5 9H20.5M6 3.5H18C19.3807 3.5 20.5 4.61929 20.5 6V19C20.5 20.3807 19.3807 21.5 18 21.5H6C4.61929 21.5 3.5 20.3807 3.5 19V6C3.5 4.61929 4.61929 3.5 6 3.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
              />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn("w-auto p-0", contentClassName)}
          data-slot="date-picker-content"
          id={contentId}
          sideOffset={4}
        >
          <Calendar
            data-slot="date-picker-calendar"
            initialFocus
            mode="single"
            onSelect={handleSelect}
            selected={selectedDate}
            className={cn(calendarPropsClassName, calendarClassName)}
            {...restCalendarProps}
          />
        </PopoverContent>
      </div>
    </Popover>
  );
}

export { DatePicker };
