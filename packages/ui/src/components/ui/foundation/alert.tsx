import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const alertVariants = cva(
  [
    "relative w-full rounded-(--radius) border px-4 py-3 text-sm",
    "grid has-[>svg]:grid-cols-[auto_minmax(0,1fr)] has-[>svg]:grid-rows-[auto_auto] has-[>svg]:items-start has-[>svg]:gap-x-3",
    "[&>svg]:row-span-2 [&>svg]:row-start-1 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:translate-y-0.5",
    "[&>svg~[data-slot=alert-title]]:col-start-2 [&>svg~[data-slot=alert-title]]:row-start-1",
    "[&>svg~[data-slot=alert-description]]:col-start-2 [&>svg~[data-slot=alert-description]]:row-start-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-info/25 bg-info/10 text-foreground",
          "[&>svg]:text-info",
          "[&_strong]:text-info-foreground",
        ].join(" "),
        destructive:
          "border-destructive-subtle-border bg-destructive-subtle text-destructive-subtle-foreground [&>svg]:text-destructive-subtle-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps
  extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {}

function Alert({
  className,
  variant = "default",
  role = "alert",
  ...props
}: AlertProps) {
  return (
    <div
      {...props}
      data-slot="alert"
      data-variant={variant}
      role={role}
      className={cn(alertVariants({ variant }), className)}
    />
  );
}

function AlertTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h5">) {
  return (
    <h5
      {...props}
      data-slot="alert-title"
      className={cn(
        "mb-1 min-w-0 leading-5 font-medium tracking-tight",
        className,
      )}
    >
      {children}
    </h5>
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="alert-description"
      className={cn(
        "min-w-0 text-sm leading-relaxed [&_p]:leading-relaxed",
        className,
      )}
    />
  );
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
