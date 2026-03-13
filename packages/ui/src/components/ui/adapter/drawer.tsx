"use client";

import * as React from "react";

import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../../../lib/cn";

interface DrawerContextValue {
  setLastTrigger: (trigger: HTMLElement | null) => void;
  lastTriggerRef: React.MutableRefObject<HTMLElement | null>;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

export type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root>;

function Drawer({
  autoFocus = true,
  children,
  direction = "bottom",
  shouldScaleBackground = true,
  ...props
}: DrawerProps) {
  const lastTriggerRef = React.useRef<HTMLElement | null>(null);
  const contextValue = React.useMemo<DrawerContextValue>(
    () => ({
      setLastTrigger(trigger) {
        lastTriggerRef.current = trigger;
      },
      lastTriggerRef,
    }),
    [],
  );
  const rootProps = {
    autoFocus,
    direction,
    shouldScaleBackground,
    ...props,
  };

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root {...rootProps}>
        <span data-slot="drawer" hidden />
        {children}
      </DrawerPrimitive.Root>
    </DrawerContext.Provider>
  );
}

export type DrawerTriggerProps = React.ComponentProps<
  typeof DrawerPrimitive.Trigger
>;

function DrawerTrigger({ className, ...props }: DrawerTriggerProps) {
  const context = React.useContext(DrawerContext);

  return (
    <DrawerPrimitive.Trigger
      {...props}
      onFocus={(event) => {
        props.onFocus?.(event);
        context?.setLastTrigger(event.currentTarget);
      }}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        context?.setLastTrigger(event.currentTarget);
      }}
      data-slot="drawer-trigger"
      className={cn("cursor-pointer", className)}
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
  container?: DrawerPortalProps["container"];
}

function DrawerContent({
  container,
  className,
  children,
  closeLabel = "Fermer",
  onAnimationEnd,
  ref: forwardedRef,
  ...props
}: DrawerContentProps) {
  const context = React.useContext(DrawerContext);

  const setContentRef = (node: HTMLDivElement | null) => {
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
      return;
    }

    if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  return (
    <DrawerPortal container={container}>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={setContentRef}
        onAnimationEnd={(event) => {
          onAnimationEnd?.(event);

          if (
            event.defaultPrevented ||
            event.currentTarget.getAttribute("data-state") !== "closed"
          ) {
            return;
          }

          const contentId = event.currentTarget.id;
          window.setTimeout(() => {
            const trigger = context?.lastTriggerRef.current;
            if (
              trigger instanceof HTMLElement &&
              (contentId === "" ||
                trigger.getAttribute("aria-controls") === contentId)
            ) {
              trigger.focus();
            }
          }, 0);
        }}
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
        data-slot="drawer-content"
      >
        <div
          aria-hidden="true"
          data-slot="drawer-handle"
          className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border"
        />
        {children}
        <DrawerPrimitive.Close
          aria-label={closeLabel}
          className={cn(
            "absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-(--radius) border border-transparent",
            "text-muted-foreground transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
            "hover:bg-accent hover:text-accent-foreground",
            "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          type="button"
          data-slot="drawer-close"
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
      {...props}
      data-slot="drawer-close"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-(--radius) border border-border px-3 py-2 text-sm font-medium",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "hover:bg-accent hover:text-accent-foreground",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    />
  );
}

export type DrawerHeaderProps = React.ComponentProps<"div">;

function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn("grid gap-1.5 p-4 text-left", className)}
      {...props}
      data-slot="drawer-header"
    />
  );
}

export type DrawerFooterProps = React.ComponentProps<"div">;

function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return (
    <div
      className={cn("mt-auto flex flex-wrap justify-end gap-2 p-4", className)}
      {...props}
      data-slot="drawer-footer"
    />
  );
}

export type DrawerTitleProps = React.ComponentProps<
  typeof DrawerPrimitive.Title
>;

function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <DrawerPrimitive.Title
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
      data-slot="drawer-title"
    />
  );
}

export type DrawerDescriptionProps = React.ComponentProps<
  typeof DrawerPrimitive.Description
>;

function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
      data-slot="drawer-description"
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
