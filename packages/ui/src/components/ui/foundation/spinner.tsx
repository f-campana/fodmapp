import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";
import { VisuallyHidden } from "../utilities/visually-hidden";

const spinnerVariants = cva(
  "inline-flex items-center justify-center text-muted-foreground",
  {
    variants: {
      size: {
        sm: "size-4",
        default: "size-5",
        lg: "size-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface SpinnerProps
  extends React.ComponentProps<"span">, VariantProps<typeof spinnerVariants> {
  announce?: boolean;
  label?: string;
}

function Spinner({
  announce = false,
  className,
  size = "default",
  label = "Chargement",
  role,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  "aria-live": ariaLive,
  ...props
}: SpinnerProps) {
  const shouldAnnounce =
    announce || role === "status" || ariaLive !== undefined;
  const resolvedRole = shouldAnnounce ? (role ?? "status") : role;
  const resolvedAriaHidden = shouldAnnounce ? ariaHidden : (ariaHidden ?? true);
  const resolvedAriaLabel = shouldAnnounce ? (ariaLabel ?? label) : ariaLabel;
  const resolvedAriaLive = shouldAnnounce ? (ariaLive ?? "polite") : ariaLive;

  return (
    <span
      data-slot="spinner"
      data-size={size}
      role={resolvedRole}
      aria-hidden={resolvedAriaHidden}
      aria-live={resolvedAriaLive}
      aria-label={resolvedAriaLabel}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-full animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="3"
          className="opacity-30"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {shouldAnnounce && !resolvedAriaHidden ? (
        <VisuallyHidden>{resolvedAriaLabel ?? label}</VisuallyHidden>
      ) : null}
    </span>
  );
}

export { Spinner, spinnerVariants };
