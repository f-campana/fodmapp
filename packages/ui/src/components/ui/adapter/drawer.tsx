"use client";

import * as React from "react";

import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../../../lib/cn";

export type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root>;

function Drawer({
  children,
  direction = "bottom",
  shouldScaleBackground = true,
  ...props
}: DrawerProps) {
  return (
    <DrawerPrimitive.Root
      direction={direction}
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    >
      <span data-slot="drawer" hidden />
      {children}
    </DrawerPrimitive.Root>
  );
}

export type DrawerTriggerProps = React.ComponentProps<
  typeof DrawerPrimitive.Trigger
>;

function DrawerTrigger({ className, ...props }: DrawerTriggerProps) {
  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

export type DrawerPortalProps = React.ComponentProps<
  typeof DrawerPrimitive.Portal
>;

function DrawerPortal({ children, ...props }: DrawerPortalProps) {
  return (
    <DrawerPrimitive.Portal {...props}>
      <span data-slot="drawer-portal" hidden />
      {children}
    </DrawerPrimitive.Portal>
  );
}

export type DrawerOverlayProps = React.ComponentProps<
  typeof DrawerPrimitive.Overlay
>;

function DrawerOverlay({ className, ...props }: DrawerOverlayProps) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-muted/80",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

export interface DrawerContentProps extends React.ComponentProps<
  typeof DrawerPrimitive.Content
> {
  closeLabel?: string;
}

function DrawerContent({
  className,
  children,
  closeLabel = "Fermer",
  ...props
}: DrawerContentProps) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed z-50 flex h-auto flex-col border border-border bg-popover text-popover-foreground shadow-lg outline-hidden",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:rounded-t-(--radius)",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:max-h-[90vh] data-[vaul-drawer-direction=top]:rounded-b-(--radius)",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:max-w-sm data-[vaul-drawer-direction=left]:rounded-r-(--radius)",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:max-w-sm data-[vaul-drawer-direction=right]:rounded-l-(--radius)",
          "data-[vaul-drawer-direction=bottom]:data-[state=open]:slide-in-from-bottom data-[vaul-drawer-direction=bottom]:data-[state=closed]:slide-out-to-bottom",
          "data-[vaul-drawer-direction=top]:data-[state=open]:slide-in-from-top data-[vaul-drawer-direction=top]:data-[state=closed]:slide-out-to-top",
          "data-[vaul-drawer-direction=left]:data-[state=open]:slide-in-from-left data-[vaul-drawer-direction=left]:data-[state=closed]:slide-out-to-left",
          "data-[vaul-drawer-direction=right]:data-[state=open]:slide-in-from-right data-[vaul-drawer-direction=right]:data-[state=closed]:slide-out-to-right",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          data-slot="drawer-handle"
          className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border"
        />
        {children}
        <DrawerPrimitive.Close
          aria-label={closeLabel}
          data-slot="drawer-close"
          className={cn(
            "absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-(--radius) border border-transparent",
            "text-muted-foreground transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
            "hover:bg-accent hover:text-accent-foreground",
            "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

export type DrawerCloseProps = React.ComponentProps<
  typeof DrawerPrimitive.Close
>;

function DrawerClose({ className, ...props }: DrawerCloseProps) {
  return (
    <DrawerPrimitive.Close
      data-slot="drawer-close"
      className={cn(
        "inline-flex items-center justify-center rounded-(--radius) border border-border px-3 py-2 text-sm font-medium",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "hover:bg-accent hover:text-accent-foreground",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type DrawerHeaderProps = React.ComponentProps<"div">;

function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("grid gap-1.5 p-4 text-left", className)}
      {...props}
    />
  );
}

export type DrawerFooterProps = React.ComponentProps<"div">;

function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-wrap justify-end gap-2 p-4", className)}
      {...props}
    />
  );
}

export type DrawerTitleProps = React.ComponentProps<
  typeof DrawerPrimitive.Title
>;

function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

export type DrawerDescriptionProps = React.ComponentProps<
  typeof DrawerPrimitive.Description
>;

function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
