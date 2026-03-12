import * as React from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "../../../lib/cn";

export type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root>;

function Popover({ children, ...props }: PopoverProps) {
  return (
    <PopoverPrimitive.Root {...props}>
      <span data-slot="popover" hidden />
      {children}
    </PopoverPrimitive.Root>
  );
}

export type PopoverTriggerProps = React.ComponentProps<
  typeof PopoverPrimitive.Trigger
>;

function PopoverTrigger({ className, ...props }: PopoverTriggerProps) {
  return (
    <PopoverPrimitive.Trigger
      {...props}
      data-slot="popover-trigger"
      className={cn("cursor-pointer", className)}
    />
  );
}

export type PopoverAnchorProps = React.ComponentProps<
  typeof PopoverPrimitive.Anchor
>;

function PopoverAnchor({ className, ...props }: PopoverAnchorProps) {
  return (
    <PopoverPrimitive.Anchor
      className={cn(className)}
      {...props}
      data-slot="popover-anchor"
    />
  );
}

export type PopoverPortalProps = React.ComponentProps<
  typeof PopoverPrimitive.Portal
>;

function PopoverPortal({ children, ...props }: PopoverPortalProps) {
  return (
    <PopoverPrimitive.Portal {...props}>
      <div data-slot="popover-portal">{children}</div>
    </PopoverPrimitive.Portal>
  );
}

export type PopoverContentProps = React.ComponentProps<
  typeof PopoverPrimitive.Content
> & {
  container?: PopoverPortalProps["container"];
};

function PopoverContent({
  container,
  className,
  sideOffset = 6,
  "aria-label": ariaLabel = "Popover",
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortal container={container}>
      <PopoverPrimitive.Content
        className={cn(
          "z-50 w-72 rounded-(--radius) border border-border bg-popover p-4 text-popover-foreground shadow-md",
          "origin-(--radix-popover-content-transform-origin)",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className,
        )}
        {...props}
        aria-label={ariaLabel}
        data-slot="popover-content"
        sideOffset={sideOffset}
      />
    </PopoverPortal>
  );
}

export type PopoverArrowProps = React.ComponentProps<
  typeof PopoverPrimitive.Arrow
>;

function PopoverArrow({
  className,
  width = 12,
  height = 6,
  ...props
}: PopoverArrowProps) {
  return (
    <PopoverPrimitive.Arrow
      width={width}
      height={height}
      className={cn("fill-popover stroke-border", className)}
      {...props}
      data-slot="popover-arrow"
    />
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
};
