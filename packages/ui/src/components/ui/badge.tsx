import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
    "transition-colors duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft focus-visible:outline-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary-hover",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow hover:bg-secondary-hover",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive-hover",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
