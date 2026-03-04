import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";
import { VisuallyHidden } from "../utilities/visually-hidden";

const dotVariants = cva(
  "relative inline-flex size-2.5 shrink-0 rounded-full border border-transparent",
  {
    variants: {
      variant: {
        none: "bg-success",
        low: "bg-info",
        moderate: "bg-warning",
        high: "bg-danger",
        unknown: "bg-muted",
      },
    },
    defaultVariants: {
      variant: "unknown",
    },
  },
);

const defaultLabels = {
  none: "Aucun FODMAP",
  low: "Faible FODMAP",
  moderate: "FODMAP modéré",
  high: "FODMAP élevé",
  unknown: "FODMAP inconnu",
} as const;

export interface DotProps
  extends React.ComponentProps<"span">, VariantProps<typeof dotVariants> {
  label?: string;
}

function Dot({ className, variant = "unknown", label, ...props }: DotProps) {
  const resolvedLabel = label ?? defaultLabels[variant ?? "unknown"];

  return (
    <span
      data-slot="dot"
      data-variant={variant}
      className={cn(dotVariants({ variant }), className)}
      {...props}
    >
      <VisuallyHidden>{resolvedLabel}</VisuallyHidden>
    </span>
  );
}

export { Dot, dotVariants };
