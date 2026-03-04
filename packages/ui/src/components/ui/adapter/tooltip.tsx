import * as React from "react";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "../../../lib/cn";

export type TooltipProviderProps = React.ComponentProps<
  typeof TooltipPrimitive.Provider
>;

function TooltipProvider({
  children,
  delayDuration = 150,
  ...props
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} {...props}>
      <span data-slot="tooltip-provider" hidden />
      {children}
    </TooltipPrimitive.Provider>
  );
}

export type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root>;

function Tooltip({ children, ...props }: TooltipProps) {
  return (
    <TooltipPrimitive.Root {...props}>
      <span data-slot="tooltip" hidden />
      {children}
    </TooltipPrimitive.Root>
  );
}

export type TooltipTriggerProps = React.ComponentProps<
  typeof TooltipPrimitive.Trigger
>;

function TooltipTrigger({ className, ...props }: TooltipTriggerProps) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

export type TooltipContentProps = React.ComponentProps<
  typeof TooltipPrimitive.Content
>;

function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-xs overflow-hidden rounded-(--radius) border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
          "origin-(--radix-tooltip-content-transform-origin)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
