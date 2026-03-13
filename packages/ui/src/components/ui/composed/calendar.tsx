"use client";

import * as React from "react";

import { DayPicker } from "react-day-picker";

import { cn } from "../../../lib/cn";
import { buttonVariants } from "../foundation/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  "data-slot"?: string;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      {...props}
      data-slot="calendar"
      className={cn(
        "w-fit rounded-(--radius) border border-border p-3",
        className,
      )}
      classNames={{
        root: "bg-card text-card-foreground",
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute left-1 size-7 bg-background p-0 text-muted-foreground hover:text-foreground",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute right-1 size-7 bg-background p-0 text-muted-foreground hover:text-foreground",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 text-center text-[0.8rem] font-medium text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-(--radius) p-0 font-normal",
          "aria-selected:bg-primary aria-selected:text-primary-foreground",
          "aria-selected:opacity-100",
        ),
        selected:
          "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:[&>button]:text-primary-foreground",
        today: "text-accent-foreground",
        outside: "text-muted-foreground",
        disabled: "cursor-not-allowed text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground aria-selected:[&>button]:text-accent-foreground",
        range_start:
          "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:[&>button]:text-primary-foreground",
        range_end:
          "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:[&>button]:text-primary-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation = "right" }) => {
          const orientationClass =
            orientation === "left"
              ? "rotate-180"
              : orientation === "up"
                ? "-rotate-90"
                : orientation === "down"
                  ? "rotate-90"
                  : "";

          return (
            <svg
              aria-hidden="true"
              className={cn("size-4", orientationClass, className)}
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 6L15 12L9 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          );
        },
        ...components,
      }}
    />
  );
}

export { Calendar };
