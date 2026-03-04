import * as React from "react";

import * as LabelPrimitive from "@radix-ui/react-label";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const labelVariants = cva(
  "flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
);

export interface LabelProps
  extends
    React.ComponentProps<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {}

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
}

export { Label, labelVariants };
