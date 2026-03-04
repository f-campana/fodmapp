import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const buttonGroupVariants = cva(
  [
    "isolate inline-flex w-fit items-stretch",
    "[&>[data-slot=button]]:relative [&>[data-slot=button]]:focus-visible:z-10",
    "[&>[data-slot=button]]:rounded-none",
  ].join(" "),
  {
    variants: {
      orientation: {
        horizontal: [
          "flex-row",
          "[&>[data-slot=button]]:-ms-px [&>[data-slot=button]:first-child]:ms-0",
          "[&>[data-slot=button]:first-child]:rounded-s-(--radius)",
          "[&>[data-slot=button]:last-child]:rounded-e-(--radius)",
        ].join(" "),
        vertical: [
          "flex-col",
          "[&>[data-slot=button]]:-mt-px [&>[data-slot=button]:first-child]:mt-0",
          "[&>[data-slot=button]:first-child]:rounded-t-(--radius)",
          "[&>[data-slot=button]:last-child]:rounded-b-(--radius)",
        ].join(" "),
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

export interface ButtonGroupProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof buttonGroupVariants> {}

function ButtonGroup({
  className,
  orientation = "horizontal",
  role = "group",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      data-slot="button-group"
      data-orientation={orientation}
      role={role}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export { ButtonGroup, buttonGroupVariants };
