import * as React from "react";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import { cn } from "../../../lib/cn";

export type HoverCardProps = React.ComponentProps<
  typeof HoverCardPrimitive.Root
>;

function HoverCard({ children, ...props }: HoverCardProps) {
  return (
    <HoverCardPrimitive.Root {...props}>
      <span data-slot="hover-card" hidden />
      {children}
    </HoverCardPrimitive.Root>
  );
}

export type HoverCardTriggerProps = React.ComponentProps<
  typeof HoverCardPrimitive.Trigger
>;

function HoverCardTrigger({ className, ...props }: HoverCardTriggerProps) {
  return (
    <HoverCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

export type HoverCardPortalProps = React.ComponentProps<
  typeof HoverCardPrimitive.Portal
>;

function HoverCardPortal({ children, ...props }: HoverCardPortalProps) {
  return (
    <HoverCardPrimitive.Portal {...props}>
      <div data-slot="hover-card-portal">{children}</div>
    </HoverCardPrimitive.Portal>
  );
}

export type HoverCardContentProps = React.ComponentProps<
  typeof HoverCardPrimitive.Content
>;

function HoverCardContent({
  className,
  sideOffset = 8,
  ...props
}: HoverCardContentProps) {
  return (
    <HoverCardPortal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-(--radius) border border-border bg-popover p-4 text-popover-foreground shadow-md",
          "origin-(--radix-hover-card-content-transform-origin)",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </HoverCardPortal>
  );
}

export type HoverCardArrowProps = React.ComponentProps<
  typeof HoverCardPrimitive.Arrow
>;

function HoverCardArrow({
  className,
  width = 12,
  height = 6,
  ...props
}: HoverCardArrowProps) {
  return (
    <HoverCardPrimitive.Arrow
      data-slot="hover-card-arrow"
      width={width}
      height={height}
      className={cn("fill-popover stroke-border", className)}
      {...props}
    />
  );
}

export {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
};
