import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const calloutVariants = cva(
  "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-xl border p-4 text-sm",
  {
    variants: {
      variant: {
        info: "border-info bg-info text-info-foreground",
        caution: [
          "border-warning bg-background text-foreground",
          "[&>[data-slot=callout-icon]]:text-warning",
          "[&>[data-slot=callout-title]]:text-warning",
        ].join(" "),
        warning: "border-warning bg-warning text-warning-foreground",
        danger: "border-danger bg-danger text-danger-foreground",
        tip: "border-success bg-success text-success-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

export interface CalloutProps
  extends React.ComponentProps<"div">, VariantProps<typeof calloutVariants> {}

function Callout({ className, variant = "info", ...props }: CalloutProps) {
  return (
    <div
      data-slot="callout"
      data-variant={variant}
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    />
  );
}

export type CalloutIconProps = React.ComponentProps<"div">;

function CalloutIcon({ className, ...props }: CalloutIconProps) {
  return (
    <div
      data-slot="callout-icon"
      className={cn(
        "row-span-2 mt-0.5 inline-flex size-5 items-center justify-center text-current",
        className,
      )}
      {...props}
    />
  );
}

export type CalloutTitleProps = React.ComponentProps<"h5">;

function CalloutTitle({ className, children, ...props }: CalloutTitleProps) {
  return (
    <h5
      data-slot="callout-title"
      className={cn(
        "col-start-2 leading-none font-semibold text-current",
        className,
      )}
      {...props}
    >
      {children}
    </h5>
  );
}

export type CalloutDescriptionProps = React.ComponentProps<"p">;

function CalloutDescription({
  className,
  children,
  ...props
}: CalloutDescriptionProps) {
  return (
    <p
      data-slot="callout-description"
      className={cn("col-start-2 text-sm leading-6 text-current", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export {
  Callout,
  CalloutDescription,
  CalloutIcon,
  CalloutTitle,
  calloutVariants,
};
