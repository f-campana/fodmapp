"use client";

import * as React from "react";

import { toast, Toaster, type ToasterProps } from "sonner";

import { cn } from "../../../lib/cn";
import { buttonVariants } from "../foundation/button";

export type SonnerProps = ToasterProps;

const toasterClassNames = {
  actionButton: cn(
    buttonVariants({ size: "sm", variant: "default" }),
    "order-last h-8 max-w-full justify-center px-3",
  ),
  cancelButton: cn(
    buttonVariants({ size: "sm", variant: "outline" }),
    "order-last h-8 max-w-full justify-center px-3",
  ),
  closeButton: cn(
    buttonVariants({ size: "icon-xs", variant: "ghost" }),
    "absolute top-3 right-3 size-7 rounded-full border border-border bg-background text-muted-foreground",
    "hover:bg-accent hover:text-accent-foreground",
  ),
  content: "min-w-0 flex-1 basis-48 space-y-1 pr-6",
  default: "border-border [&_[data-icon]]:text-muted-foreground",
  description: "text-sm leading-5 text-muted-foreground",
  error: "border-danger [&_[data-icon]]:text-danger",
  icon: "mt-0.5 flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4",
  info: "border-info [&_[data-icon]]:text-info",
  loader:
    "text-muted-foreground [&_.sonner-loading-bar]:bg-current [&_.sonner-spinner]:left-0 [&_.sonner-spinner]:top-0",
  loading: "[&_[data-icon]]:text-muted-foreground",
  success: "border-success [&_[data-icon]]:text-success",
  title: "text-sm leading-5 font-medium text-foreground",
  toast: cn(
    "pointer-events-auto relative flex w-[min(22rem,calc(100vw-1rem))] flex-wrap items-start gap-3 rounded-(--radius)",
    "border bg-popover p-4 text-popover-foreground shadow-lg",
    "transition-[box-shadow,transform,opacity] duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
  ),
  warning: "border-warning [&_[data-icon]]:text-warning",
} as const;

function Sonner({
  className,
  closeButton = true,
  position = "bottom-right",
  richColors = false,
  toastOptions,
  ...props
}: SonnerProps) {
  return (
    <div data-slot="sonner" className={cn("group/sonner", className)}>
      <Toaster
        className={cn(
          "[font-family:var(--font-body)]",
          "[&_[data-sonner-toast]]:border-border",
          "[&_[data-sonner-toast]]:bg-popover",
          "[&_[data-sonner-toast]]:text-popover-foreground",
          "[&_button]:cursor-pointer",
        )}
        closeButton={closeButton}
        position={position}
        richColors={richColors}
        toastOptions={{
          ...toastOptions,
          unstyled: toastOptions?.unstyled ?? true,
          classNames: {
            toast: cn(toasterClassNames.toast, toastOptions?.classNames?.toast),
            title: cn(toasterClassNames.title, toastOptions?.classNames?.title),
            description: cn(
              toasterClassNames.description,
              toastOptions?.classNames?.description,
            ),
            loader: cn(
              toasterClassNames.loader,
              toastOptions?.classNames?.loader,
            ),
            closeButton: cn(
              toasterClassNames.closeButton,
              toastOptions?.classNames?.closeButton,
            ),
            content: cn(
              toasterClassNames.content,
              toastOptions?.classNames?.content,
            ),
            icon: cn(toasterClassNames.icon, toastOptions?.classNames?.icon),
            actionButton: cn(
              toasterClassNames.actionButton,
              toastOptions?.classNames?.actionButton,
            ),
            cancelButton: cn(
              toasterClassNames.cancelButton,
              toastOptions?.classNames?.cancelButton,
            ),
            default: cn(
              toasterClassNames.default,
              toastOptions?.classNames?.default,
            ),
            success: cn(
              toasterClassNames.success,
              toastOptions?.classNames?.success,
            ),
            info: cn(toasterClassNames.info, toastOptions?.classNames?.info),
            warning: cn(
              toasterClassNames.warning,
              toastOptions?.classNames?.warning,
            ),
            error: cn(toasterClassNames.error, toastOptions?.classNames?.error),
            loading: cn(
              toasterClassNames.loading,
              toastOptions?.classNames?.loading,
            ),
          },
        }}
        {...props}
      />
    </div>
  );
}

export { Sonner, toast };
