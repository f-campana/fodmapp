import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";

// Keep these semantic foreground utilities in the distributed stylesheet contract.
const foregroundContractClasses =
  "text-info-foreground text-warning-foreground text-danger-foreground";
void foregroundContractClasses;

const calloutVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 rounded-xl border p-4 text-sm",
  {
    variants: {
      variant: {
        info: [
          "border-info/25 bg-info/10 text-foreground",
          "[&>[data-slot=callout-icon]]:text-info",
          "[&>[data-slot=callout-title]]:text-info",
          "[&_strong]:text-info-foreground",
        ].join(" "),
        caution: [
          "border-warning/30 bg-warning/8 text-foreground",
          "[&>[data-slot=callout-icon]]:text-warning",
          "[&>[data-slot=callout-title]]:text-warning",
          "[&_strong]:text-warning-foreground",
        ].join(" "),
        warning: [
          "border-warning/35 bg-warning/10 text-foreground",
          "[&>[data-slot=callout-icon]]:text-warning",
          "[&>[data-slot=callout-title]]:text-warning",
          "[&_strong]:text-warning-foreground",
        ].join(" "),
        danger: [
          "border-danger/35 bg-danger/10 text-foreground",
          "[&>[data-slot=callout-icon]]:text-danger",
          "[&>[data-slot=callout-title]]:text-danger",
          "[&_strong]:text-danger-foreground",
        ].join(" "),
        tip: [
          "border-success/35 bg-success/10 text-foreground",
          "[&>[data-slot=callout-icon]]:text-success",
          "[&>[data-slot=callout-title]]:text-success",
        ].join(" "),
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
      {...props}
      data-slot="callout"
      data-variant={variant}
      className={cn(calloutVariants({ variant }), className)}
    />
  );
}

export type CalloutIconProps = React.ComponentProps<"div">;

function CalloutIcon({ className, ...props }: CalloutIconProps) {
  return (
    <div
      {...props}
      data-slot="callout-icon"
      className={cn(
        "row-span-2 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center text-current",
        className,
      )}
    />
  );
}

export type CalloutTitleProps = React.ComponentProps<"h5">;

function CalloutTitle({ className, children, ...props }: CalloutTitleProps) {
  return (
    <h5
      {...props}
      data-slot="callout-title"
      className={cn(
        "col-start-2 min-w-0 leading-5 font-semibold text-current",
        className,
      )}
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
      {...props}
      data-slot="callout-description"
      className={cn(
        "col-start-2 min-w-0 text-sm leading-6 text-current",
        className,
      )}
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
