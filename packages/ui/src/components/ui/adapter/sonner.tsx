"use client";

import * as React from "react";

import { toast, Toaster, type ToasterProps } from "sonner";

import { cn } from "../../../lib/cn";
import { buttonVariants } from "../foundation/button";

export type SonnerProps = ToasterProps;

function NotificationCloseIcon() {
  return (
    <span
      aria-hidden="true"
      data-slot="sonner-close-icon"
      className="inline-flex size-3.5 items-center justify-center"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="size-full"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        <path d="M4.5 4.5L11.5 11.5" />
        <path d="M11.5 4.5L4.5 11.5" />
      </svg>
    </span>
  );
}

function NotificationSuccessIcon() {
  return (
    <span
      aria-hidden="true"
      data-slot="sonner-success-icon"
      className="inline-flex size-4 items-center justify-center"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="size-full"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      >
        <path d="M4.25 8.25L6.9 10.9L11.75 5.1" />
      </svg>
    </span>
  );
}

function NotificationInfoIcon() {
  return (
    <span
      aria-hidden="true"
      data-slot="sonner-info-icon"
      className="inline-flex size-4 items-center justify-center"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="size-full"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 6.5V10.25" />
        <path d="M8 4.25H8.01" />
      </svg>
    </span>
  );
}

function NotificationWarningIcon() {
  return (
    <span
      aria-hidden="true"
      data-slot="sonner-warning-icon"
      className="inline-flex size-4 items-center justify-center"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="size-full"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        <path d="M8 2.5L13.25 12.25H2.75L8 2.5Z" />
        <path d="M8 6V8.75" />
        <path d="M8 11H8.01" />
      </svg>
    </span>
  );
}

function NotificationErrorIcon() {
  return (
    <span
      aria-hidden="true"
      data-slot="sonner-error-icon"
      className="inline-flex size-4 items-center justify-center"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="size-full"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        <circle cx="8" cy="8" r="6.25" />
        <path d="M5.25 5.25L10.75 10.75" />
        <path d="M10.75 5.25L5.25 10.75" />
      </svg>
    </span>
  );
}

function NotificationLoadingIcon() {
  return (
    <span
      aria-hidden="true"
      data-slot="sonner-loading-icon"
      className="inline-flex size-4 animate-spin items-center justify-center"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-full">
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-20"
        />
        <path
          d="M20.5 12A8.5 8.5 0 0 0 12 3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </svg>
    </span>
  );
}

const defaultToasterIcons = {
  close: <NotificationCloseIcon />,
  error: <NotificationErrorIcon />,
  info: <NotificationInfoIcon />,
  loading: <NotificationLoadingIcon />,
  success: <NotificationSuccessIcon />,
  warning: <NotificationWarningIcon />,
} satisfies NonNullable<SonnerProps["icons"]>;

const toasterClassNames = {
  actionButton: cn(
    buttonVariants({ size: "default", variant: "default" }),
    "col-start-2 row-start-2 h-8 max-w-full justify-self-start px-3.5",
  ),
  cancelButton: cn(
    buttonVariants({ size: "default", variant: "outline" }),
    "col-start-3 row-start-2 h-8 max-w-full justify-self-start px-3.5 max-[360px]:col-start-2 max-[360px]:row-start-3",
  ),
  closeButton: cn(
    buttonVariants({ size: "icon-sm", variant: "ghost" }),
    "col-start-4 row-start-1 size-7 self-start justify-self-end rounded-full border border-border/80 bg-background text-muted-foreground",
    "max-[360px]:col-start-3",
    "hover:bg-accent hover:text-accent-foreground",
  ),
  content:
    "col-start-2 col-span-2 row-start-1 min-w-0 space-y-1 pr-1 max-[360px]:col-span-1",
  default: "border-border",
  description: "text-sm leading-6 text-muted-foreground",
  error:
    "border-border [&_[data-icon]]:border-danger/25 [&_[data-icon]]:bg-danger/10 [&_[data-icon]]:text-danger",
  icon: cn(
    "col-start-1 row-start-1 mt-0.5 flex size-8 shrink-0 items-center justify-center self-start rounded-full border border-border/70 bg-muted/35 text-muted-foreground",
    "[&_.sonner-loader]:inline-flex [&_.sonner-loader]:items-center [&_.sonner-loader]:justify-center [&_svg]:size-4",
  ),
  info: "border-border [&_[data-icon]]:border-info/25 [&_[data-icon]]:bg-info/10 [&_[data-icon]]:text-info",
  loader:
    "!static !inset-auto !top-auto !left-auto inline-flex items-center justify-center text-current !transform-none data-[visible=false]:!transform-none [&_.sonner-loading-bar]:bg-current",
  loading:
    "border-border [&_[data-icon]]:size-7 [&_[data-icon]]:border-0 [&_[data-icon]]:bg-muted/25 [&_[data-icon]]:text-foreground/80 [&_[data-icon]_svg]:size-5",
  success:
    "border-border [&_[data-icon]]:border-success/25 [&_[data-icon]]:bg-success/10 [&_[data-icon]]:text-success",
  title: "text-base leading-7 font-semibold text-foreground",
  toast: cn(
    "pointer-events-auto relative grid w-[min(22rem,calc(100vw-1rem))] grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-3 gap-y-3 rounded-(--radius)",
    "border bg-popover p-4 text-popover-foreground shadow-lg",
    "transition-[box-shadow,transform,opacity] duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
    "[&_[data-button=true]]:max-w-full [&_[data-button=true]]:min-w-0",
    "max-[360px]:grid-cols-[auto_minmax(0,1fr)_auto] [&_[data-button=true]]:whitespace-nowrap",
    "data-[type=loading]:items-center data-[type=loading]:[&_[data-content]]:space-y-0 data-[type=loading]:[&_[data-content]]:self-center",
    "data-[type=loading]:[&_[data-icon]]:mt-0 data-[type=loading]:[&_[data-icon]]:self-center",
  ),
  warning:
    "border-border [&_[data-icon]]:border-warning/25 [&_[data-icon]]:bg-warning/10 [&_[data-icon]]:text-warning",
} as const;

function Sonner({
  className,
  closeButton = true,
  icons,
  position = "bottom-right",
  richColors = false,
  toastOptions,
  ...props
}: SonnerProps) {
  const mergedIcons = { ...defaultToasterIcons, ...icons };

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
        icons={mergedIcons}
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
