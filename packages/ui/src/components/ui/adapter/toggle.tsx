import * as React from "react";

import * as TogglePrimitive from "@radix-ui/react-toggle";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const toggleVariants = cva(
  [
    "group/toggle inline-flex shrink-0 items-center justify-center rounded-(--radius) border border-transparent bg-background whitespace-nowrap",
    "text-sm font-medium select-none",
    "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "cursor-pointer",
    "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "hover:bg-muted hover:text-foreground",
        outline:
          "border-outline-border bg-outline text-outline-foreground hover:bg-outline-hover",
      },
      size: {
        default: "h-8 px-2.5",
        sm: "h-7 px-2 text-[0.8rem]",
        lg: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ToggleProps
  extends
    React.ComponentProps<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      {...props}
      data-slot="toggle"
      data-variant={variant}
      data-size={size}
      className={cn(toggleVariants({ variant, size, className }))}
    />
  );
}

export { Toggle, toggleVariants };
