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
  label?: string;
}

function Spinner({
  className,
  size = "default",
  label = "Chargement",
  ...props
}: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      data-size={size}
      role="status"
      aria-live="polite"
      aria-label={label}
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
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

export { Spinner, spinnerVariants };
