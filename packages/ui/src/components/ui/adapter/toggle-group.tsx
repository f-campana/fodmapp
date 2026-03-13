import * as React from "react";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";
import { toggleVariants } from "./toggle";

export type ToggleGroupProps = React.ComponentProps<
  typeof ToggleGroupPrimitive.Root
>;

function ToggleGroup({
  className,
  orientation = "horizontal",
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      {...props}
      data-slot="toggle-group"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "inline-flex items-center gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    />
  );
}

export interface ToggleGroupItemProps
  extends
    React.ComponentProps<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleVariants> {}

function ToggleGroupItem({
  className,
  variant = "default",
  size = "default",
  ...props
}: ToggleGroupItemProps) {
  return (
    <ToggleGroupPrimitive.Item
      {...props}
      data-slot="toggle-group-item"
      data-variant={variant}
      data-size={size}
      className={cn(
        toggleVariants({ variant, size }),
        "in-data-[slot=toggle-group]:rounded-(--radius-sm)",
        className,
      )}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
