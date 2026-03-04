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
      data-slot="toggle-group"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "inline-flex items-center gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
      {...props}
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
      data-slot="toggle-group-item"
      data-variant={variant}
      data-size={size}
      className={cn(
        toggleVariants({ variant, size }),
        "in-data-[slot=toggle-group]:rounded-(--radius-sm)",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
