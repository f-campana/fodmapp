import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const stepperVariants = cva("m-0 flex w-full list-none gap-3 p-0", {
  variants: {
    orientation: {
      horizontal: "flex-row items-start",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const stepperStepVariants = cva("relative flex min-w-0 items-start gap-2", {
  variants: {
    status: {
      completed: "",
      current: "",
      upcoming: "",
      skipped: "",
    },
  },
  defaultVariants: {
    status: "upcoming",
  },
});

const stepperMarkerVariants = cva(
  "inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
  {
    variants: {
      status: {
        completed: "border-success bg-success text-success-foreground",
        current: "border-primary bg-primary text-primary-foreground",
        upcoming: "border-border bg-muted text-muted-foreground",
        skipped:
          "border-dashed border-border bg-background text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "upcoming",
    },
  },
);

const stepperSeparatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "mx-1 mt-3 h-px flex-1",
      vertical: "ms-3 h-6 w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export interface StepperProps
  extends React.ComponentProps<"ol">, VariantProps<typeof stepperVariants> {}

function Stepper({
  className,
  orientation = "horizontal",
  ...props
}: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(stepperVariants({ orientation }), className)}
      {...props}
    />
  );
}

export interface StepperStepProps
  extends React.ComponentProps<"li">, VariantProps<typeof stepperStepVariants> {
  step: React.ReactNode;
}

function StepperStep({
  className,
  status = "upcoming",
  step,
  children,
  ...props
}: StepperStepProps) {
  return (
    <li
      data-slot="stepper-step"
      data-status={status}
      className={cn(stepperStepVariants({ status }), className)}
      {...props}
    >
      <span
        data-slot="stepper-marker"
        className={cn(stepperMarkerVariants({ status }))}
      >
        {step}
      </span>
      <div className="min-w-0 space-y-1">{children}</div>
    </li>
  );
}

export interface StepperSeparatorProps
  extends
    React.ComponentProps<"li">,
    VariantProps<typeof stepperSeparatorVariants> {}

function StepperSeparator({
  className,
  orientation = "horizontal",
  ...props
}: StepperSeparatorProps) {
  return (
    <li
      data-slot="stepper-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(stepperSeparatorVariants({ orientation }), className)}
      {...props}
    />
  );
}

export type StepperLabelProps = React.ComponentProps<"p">;

function StepperLabel({ className, ...props }: StepperLabelProps) {
  return (
    <p
      data-slot="stepper-label"
      className={cn(
        "pt-0.5 text-sm leading-none font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type StepperDescriptionProps = React.ComponentProps<"p">;

function StepperDescription({ className, ...props }: StepperDescriptionProps) {
  return (
    <p
      data-slot="stepper-description"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Stepper,
  StepperDescription,
  StepperLabel,
  StepperSeparator,
  StepperStep,
  stepperVariants,
};
