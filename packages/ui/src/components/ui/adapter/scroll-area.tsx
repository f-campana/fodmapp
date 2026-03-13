import * as React from "react";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "../../../lib/cn";

export type ScrollAreaProps = React.ComponentProps<
  typeof ScrollAreaPrimitive.Root
>;

function ScrollArea({
  className,
  children,
  type = "always",
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      {...props}
      data-slot="scroll-area"
      type={type}
      className={cn("relative overflow-hidden", className)}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        tabIndex={0}
        className="size-full rounded-[inherit]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" forceMount />
      <ScrollBar orientation="horizontal" forceMount />
      <ScrollAreaPrimitive.Corner
        data-slot="scroll-area-corner"
        className="bg-muted"
      />
      <span data-slot="scroll-area-corner" hidden />
    </ScrollAreaPrimitive.Root>
  );
}

export type ScrollBarProps = React.ComponentProps<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
>;

function ScrollBar({
  className,
  orientation = "vertical",
  forceMount = true,
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      {...props}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      forceMount={forceMount}
      className={cn(
        "flex touch-none p-0.5 transition-colors select-none",
        orientation === "vertical"
          ? "h-full w-2.5 border-l border-l-transparent"
          : "h-2.5 flex-col border-t border-t-transparent",
        className,
      )}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        forceMount
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
