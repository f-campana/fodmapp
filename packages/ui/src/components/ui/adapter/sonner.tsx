"use client";

import * as React from "react";

import { toast, Toaster, type ToasterProps } from "sonner";

import { cn } from "../../../lib/cn";

export type SonnerProps = ToasterProps;

function Sonner({
  className,
  closeButton = true,
  position = "bottom-right",
  richColors = true,
  toastOptions,
  ...props
}: SonnerProps) {
  return (
    <div
      data-slot="sonner"
      className={cn(
        "toaster group",
        "[&_[data-sonner-toast]]:border-border [&_[data-sonner-toast]]:bg-popover [&_[data-sonner-toast]]:text-popover-foreground",
        "[&_[data-sonner-toast]]:shadow-lg",
        className,
      )}
    >
      <Toaster
        closeButton={closeButton}
        position={position}
        richColors={richColors}
        toastOptions={{
          ...toastOptions,
          classNames: {
            ...toastOptions?.classNames,
            toast: cn(
              "border border-border bg-popover text-popover-foreground",
              toastOptions?.classNames?.toast,
            ),
            title: cn("text-foreground", toastOptions?.classNames?.title),
            description: cn(
              "text-muted-foreground",
              toastOptions?.classNames?.description,
            ),
            actionButton: cn(
              "bg-primary text-primary-foreground hover:bg-primary-hover",
              toastOptions?.classNames?.actionButton,
            ),
            cancelButton: cn(
              "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
              toastOptions?.classNames?.cancelButton,
            ),
          },
        }}
        {...props}
      />
    </div>
  );
}

export { Sonner, toast };
