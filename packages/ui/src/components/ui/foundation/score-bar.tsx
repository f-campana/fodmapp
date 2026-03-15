import * as React from "react";

import { cva } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const scoreBarFillVariants = cva(
  "h-full rounded-full transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
  {
    variants: {
      status: {
        danger: "bg-danger",
        warning: "bg-warning",
        success: "bg-success",
      },
    },
  },
);

type ScoreStatus = "danger" | "warning" | "success";

function clampScore(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getScoreStatus(value: number): ScoreStatus {
  if (value < 0.5) {
    return "danger";
  }

  if (value <= 0.7) {
    return "warning";
  }

  return "success";
}

export interface ScoreBarProps extends React.ComponentProps<"div"> {
  value: number;
  label?: React.ReactNode;
}

function ScoreBar({
  className,
  value,
  label,
  "aria-label": ariaLabel,
  ...props
}: ScoreBarProps) {
  const normalizedValue = clampScore(value);
  const status = getScoreStatus(normalizedValue);
  const width = `${normalizedValue * 100}%`;
  const labelId = React.useId();
  const hasVisibleLabel = label !== undefined && label !== null;
  const fallbackLabel =
    ariaLabel ?? (typeof label === "string" ? label : "Score");

  return (
    <div
      data-slot="score-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Number(normalizedValue.toFixed(2))}
      aria-label={hasVisibleLabel ? undefined : fallbackLabel}
      aria-labelledby={hasVisibleLabel ? labelId : undefined}
      className={cn("grid w-full gap-1.5", className)}
      {...props}
    >
      {hasVisibleLabel ? (
        <div
          id={labelId}
          data-slot="score-bar-label"
          className="text-sm text-foreground"
        >
          {label}
        </div>
      ) : null}
      <div
        data-slot="score-bar-track"
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          data-slot="score-bar-fill"
          data-status={status}
          className={cn(scoreBarFillVariants({ status }))}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export { ScoreBar };
