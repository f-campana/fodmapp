import * as React from "react";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

import { cn } from "../../../lib/cn";

export type CollapsibleProps = React.ComponentProps<
  typeof CollapsiblePrimitive.Root
>;

function Collapsible({ className, ...props }: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      {...props}
      data-slot="collapsible"
      className={cn("flex flex-col gap-2", className)}
    />
  );
}

export type CollapsibleTriggerProps = React.ComponentProps<
  typeof CollapsiblePrimitive.Trigger
>;

function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger
      {...props}
      data-slot="collapsible-trigger"
      className={cn(
        "inline-flex items-center justify-between gap-2 rounded-(--radius) border border-input bg-background px-3 py-2 text-sm font-medium",
        "cursor-pointer transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    />
  );
}

export type CollapsibleContentProps = React.ComponentProps<
  typeof CollapsiblePrimitive.Content
>;

function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.Content
      {...props}
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden text-sm text-muted-foreground",
        "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        className,
      )}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
