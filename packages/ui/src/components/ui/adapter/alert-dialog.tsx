import * as React from "react";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "../../../lib/cn";
import { buttonVariants } from "../foundation/button";

export type AlertDialogProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Root
>;

function AlertDialog({ children, ...props }: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root {...props}>
      <span data-slot="alert-dialog" hidden />
      {children}
    </AlertDialogPrimitive.Root>
  );
}

export type AlertDialogTriggerProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Trigger
>;

function AlertDialogTrigger({ className, ...props }: AlertDialogTriggerProps) {
  return (
    <AlertDialogPrimitive.Trigger
      {...props}
      data-slot="alert-dialog-trigger"
      className={cn("cursor-pointer", className)}
    />
  );
}

export type AlertDialogPortalProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Portal
>;

function AlertDialogPortal({ children, ...props }: AlertDialogPortalProps) {
  return (
    <AlertDialogPrimitive.Portal {...props}>
      <span data-slot="alert-dialog-portal" hidden />
      {children}
    </AlertDialogPrimitive.Portal>
  );
}

export type AlertDialogOverlayProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Overlay
>;

function AlertDialogOverlay({ className, ...props }: AlertDialogOverlayProps) {
  return (
    <AlertDialogPrimitive.Overlay
      {...props}
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-muted/80",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
    />
  );
}

export type AlertDialogContentProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Content
> & {
  container?: AlertDialogPortalProps["container"];
};

function AlertDialogContent({
  container,
  className,
  ...props
}: AlertDialogContentProps) {
  return (
    <AlertDialogPortal container={container}>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        {...props}
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-(--radius) border border-border bg-popover p-6 text-popover-foreground shadow-lg",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
      />
    </AlertDialogPortal>
  );
}

export type AlertDialogHeaderProps = React.ComponentProps<"div">;

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
  return (
    <div
      {...props}
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-1.5 text-left", className)}
    />
  );
}

export type AlertDialogFooterProps = React.ComponentProps<"div">;

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps) {
  return (
    <div
      {...props}
      data-slot="alert-dialog-footer"
      className={cn("flex flex-wrap justify-end gap-2", className)}
    />
  );
}

export type AlertDialogTitleProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Title
>;

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      {...props}
      data-slot="alert-dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
    />
  );
}

export type AlertDialogDescriptionProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Description
>;

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      {...props}
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
    />
  );
}

export type AlertDialogActionProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Action
>;

function AlertDialogAction({ className, ...props }: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action
      {...props}
      data-slot="alert-dialog-action"
      className={cn(buttonVariants({ variant: "default" }), className)}
    />
  );
}

export type AlertDialogCancelProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Cancel
>;

function AlertDialogCancel({ className, ...props }: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Cancel
      {...props}
      data-slot="alert-dialog-cancel"
      className={cn(buttonVariants({ variant: "outline" }), className)}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
