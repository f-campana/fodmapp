"use client";

import * as React from "react";

import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "../../lib/cn";

export type ResizablePanelGroupProps = React.ComponentProps<
  typeof ResizablePrimitive.Group
>;

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

export type ResizablePanelProps = React.ComponentProps<
  typeof ResizablePrimitive.Panel
>;

function ResizablePanel({ className, ...props }: ResizablePanelProps) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      className={cn(className)}
      {...props}
    />
  );
}

export interface ResizableHandleProps extends React.ComponentProps<
  typeof ResizablePrimitive.Separator
> {
  withHandle?: boolean;
}

function ResizableHandle({
  className,
  withHandle = false,
  ...props
}: ResizableHandleProps) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "relative shrink-0 touch-none bg-border outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "data-[panel-group-direction=horizontal]:h-px data-[panel-group-direction=horizontal]:w-full",
        "data-[panel-group-direction=vertical]:h-full data-[panel-group-direction=vertical]:w-px",
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <div
          data-slot="resizable-handle-grip"
          className={cn(
            "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground",
            "data-[panel-group-direction=horizontal]:h-4 data-[panel-group-direction=horizontal]:w-12",
            "data-[panel-group-direction=vertical]:h-12 data-[panel-group-direction=vertical]:w-4",
          )}
        >
          <svg
            aria-hidden="true"
            className="size-3"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 6V18M15 6V18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      ) : null}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
