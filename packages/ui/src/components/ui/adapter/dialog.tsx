import * as React from "react";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "../../../lib/cn";

export type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

function Dialog({ children, ...props }: DialogProps) {
  return (
    <DialogPrimitive.Root {...props}>
      <span data-slot="dialog" hidden />
      {children}
    </DialogPrimitive.Root>
  );
}

export type DialogTriggerProps = React.ComponentProps<
  typeof DialogPrimitive.Trigger
>;

function DialogTrigger({ className, ...props }: DialogTriggerProps) {
  return (
    <DialogPrimitive.Trigger
      {...props}
      data-slot="dialog-trigger"
      className={cn("cursor-pointer", className)}
    />
  );
}

export type DialogPortalProps = React.ComponentProps<
  typeof DialogPrimitive.Portal
>;

function DialogPortal({ children, ...props }: DialogPortalProps) {
  return (
    <DialogPrimitive.Portal {...props}>
      <span data-slot="dialog-portal" hidden />
      {children}
    </DialogPrimitive.Portal>
  );
}

export type DialogOverlayProps = React.ComponentProps<
  typeof DialogPrimitive.Overlay
>;

function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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

export type DialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & {
  closeLabel?: string;
  container?: DialogPortalProps["container"];
};

function DialogContent({
  container,
  className,
  children,
  closeLabel = "Fermer",
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal container={container}>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-(--radius) border border-border bg-popover p-6 text-popover-foreground shadow-lg",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
        data-slot="dialog-content"
      >
        {children}
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className={cn(
            "absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-(--radius) border border-transparent",
            "text-muted-foreground transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
            "hover:bg-accent hover:text-accent-foreground",
            "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          type="button"
          data-slot="dialog-close"
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
    </DialogPortal>
  );
}

export type DialogCloseProps = React.ComponentProps<
  typeof DialogPrimitive.Close
>;

function DialogClose({ className, ...props }: DialogCloseProps) {
  return (
    <DialogPrimitive.Close
      {...props}
      data-slot="dialog-close"
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

export type DialogHeaderProps = React.ComponentProps<"div">;

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
      data-slot="dialog-header"
    />
  );
}

export type DialogBodyProps = React.ComponentProps<"div">;

function DialogBody({ className, ...props }: DialogBodyProps) {
  return (
    <div
      className={cn("grid gap-4", className)}
      {...props}
      data-slot="dialog-body"
    />
  );
}

export type DialogFooterProps = React.ComponentProps<"div">;

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn("flex flex-wrap justify-end gap-2", className)}
      {...props}
      data-slot="dialog-footer"
    />
  );
}

export type DialogTitleProps = React.ComponentProps<
  typeof DialogPrimitive.Title
>;

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
      data-slot="dialog-title"
    />
  );
}

export type DialogDescriptionProps = React.ComponentProps<
  typeof DialogPrimitive.Description
>;

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
      data-slot="dialog-description"
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
