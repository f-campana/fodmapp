import * as React from "react";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const sheetVariants = cva(
  [
    "fixed z-50 gap-4 border border-border bg-popover p-6 text-popover-foreground shadow-lg",
    "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
  ].join(" "),
  {
    variants: {
      side: {
        top: [
          "inset-x-0 top-0 border-b",
          "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        ].join(" "),
        bottom: [
          "inset-x-0 bottom-0 border-t",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        ].join(" "),
        left: [
          "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        ].join(" "),
        right: [
          "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        ].join(" "),
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

export type SheetProps = React.ComponentProps<typeof DialogPrimitive.Root>;

function Sheet({ children, ...props }: SheetProps) {
  return (
    <DialogPrimitive.Root {...props}>
      <span data-slot="sheet" hidden />
      {children}
    </DialogPrimitive.Root>
  );
}

export type SheetTriggerProps = React.ComponentProps<
  typeof DialogPrimitive.Trigger
>;

function SheetTrigger({ className, ...props }: SheetTriggerProps) {
  return (
    <DialogPrimitive.Trigger
      data-slot="sheet-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

export type SheetPortalProps = React.ComponentProps<
  typeof DialogPrimitive.Portal
>;

function SheetPortal({ children, ...props }: SheetPortalProps) {
  return (
    <DialogPrimitive.Portal {...props}>
      <span data-slot="sheet-portal" hidden />
      {children}
    </DialogPrimitive.Portal>
  );
}

export type SheetOverlayProps = React.ComponentProps<
  typeof DialogPrimitive.Overlay
>;

function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
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

export interface SheetContentProps
  extends
    React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  closeLabel?: string;
}

function SheetContent({
  className,
  children,
  side = "right",
  closeLabel = "Fermer",
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={closeLabel}
          data-slot="sheet-close"
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
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

export type SheetCloseProps = React.ComponentProps<
  typeof DialogPrimitive.Close
>;

function SheetClose({ className, ...props }: SheetCloseProps) {
  return (
    <DialogPrimitive.Close
      data-slot="sheet-close"
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

export type SheetHeaderProps = React.ComponentProps<"div">;

function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

export type SheetFooterProps = React.ComponentProps<"div">;

function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("flex flex-wrap justify-end gap-2", className)}
      {...props}
    />
  );
}

export type SheetTitleProps = React.ComponentProps<
  typeof DialogPrimitive.Title
>;

function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

export type SheetDescriptionProps = React.ComponentProps<
  typeof DialogPrimitive.Description
>;

function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  sheetVariants,
};
