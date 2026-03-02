import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  [
    // Layout
    "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap",
    // Typography
    "text-sm font-medium select-none",
    // Shape — transparent border reserves space for focus indicator
    "rounded-(--radius) border border-transparent bg-clip-padding",
    // Motion — semantic tokens (120ms, cubic-bezier(0.2, 0, 0, 1))
    "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    // Focus — two-layer: solid border (--color-ring) + subtle outer ring (--color-ring-soft)
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
    // Invalid — semantic validation tokens (strict token-only contract)
    "aria-invalid:border-validation-error-border aria-invalid:ring-2",
    "aria-invalid:ring-validation-error-ring-soft",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",
    // Cursor — native <button> doesn't show pointer; our convention adds it
    "cursor-pointer",
    // SVG children — auto-size unless explicit class, prevent pointer capture
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline: [
          "border-outline-border bg-outline text-outline-foreground",
          "hover:bg-outline-hover",
          "aria-expanded:bg-outline aria-expanded:text-outline-foreground",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary-hover",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ].join(" "),
        ghost: [
          "text-ghost-foreground hover:bg-ghost-hover",
          "aria-expanded:bg-ghost-hover aria-expanded:text-ghost-foreground",
        ].join(" "),
        // Subtle destructive now uses dedicated semantic tokens (no opacity hacks).
        destructive: [
          "bg-destructive-subtle text-destructive-subtle-foreground",
          "hover:bg-destructive-subtle-hover",
          "focus-visible:border-destructive-subtle-border focus-visible:ring-destructive-subtle-ring",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: [
          "h-6 gap-1 px-2 text-xs",
          "rounded-[min(var(--radius-md),10px)]",
          "in-data-[slot=button-group]:rounded-lg",
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
          "[&_svg:not([class*='size-'])]:size-3",
        ].join(" "),
        sm: [
          "h-7 gap-1 px-2.5 text-[0.8rem]",
          "rounded-[min(var(--radius-md),12px)]",
          "in-data-[slot=button-group]:rounded-lg",
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
          "[&_svg:not([class*='size-'])]:size-3.5",
        ].join(" "),
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// React 19: ref is a regular prop — forwardRef is no longer needed.
// React.ComponentProps<"button"> includes ref.

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type = "button",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      type={asChild ? undefined : type}
      {...props}
    />
  );
}

export { Button, buttonVariants };
