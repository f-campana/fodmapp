import * as React from "react";

import { cn } from "../../../lib/cn";

export type EmptyProps = React.ComponentProps<"div">;

function Empty({ className, ...props }: EmptyProps) {
  return (
    <div
      {...props}
      data-slot="empty"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center text-foreground",
        className,
      )}
    />
  );
}

export type EmptyIconProps = React.ComponentProps<"div">;

function EmptyIcon({ className, ...props }: EmptyIconProps) {
  return (
    <div
      {...props}
      data-slot="empty-icon"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
        className,
      )}
    />
  );
}

export type EmptyTitleProps = React.ComponentProps<"h3">;

function EmptyTitle({ className, children, ...props }: EmptyTitleProps) {
  return (
    <h3
      {...props}
      data-slot="empty-title"
      className={cn("text-base font-semibold text-foreground", className)}
    >
      {children}
    </h3>
  );
}

export type EmptyDescriptionProps = React.ComponentProps<"p">;

function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return (
    <p
      {...props}
      data-slot="empty-description"
      className={cn("max-w-prose text-sm text-muted-foreground", className)}
    />
  );
}

export type EmptyActionsProps = React.ComponentProps<"div">;

function EmptyActions({ className, ...props }: EmptyActionsProps) {
  return (
    <div
      {...props}
      data-slot="empty-actions"
      className={cn(
        "mt-1 flex flex-wrap items-center justify-center gap-2",
        className,
      )}
    />
  );
}

export { Empty, EmptyActions, EmptyDescription, EmptyIcon, EmptyTitle };
