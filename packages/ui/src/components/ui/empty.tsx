import * as React from "react";

import { cn } from "../../lib/cn";

export type EmptyProps = React.ComponentProps<"div">;

function Empty({ className, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type EmptyIconProps = React.ComponentProps<"div">;

function EmptyIcon({ className, ...props }: EmptyIconProps) {
  return (
    <div
      data-slot="empty-icon"
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type EmptyTitleProps = React.ComponentProps<"h3">;

function EmptyTitle({ className, children, ...props }: EmptyTitleProps) {
  return (
    <h3
      data-slot="empty-title"
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export type EmptyDescriptionProps = React.ComponentProps<"p">;

function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return (
    <p
      data-slot="empty-description"
      className={cn("max-w-prose text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export type EmptyActionsProps = React.ComponentProps<"div">;

function EmptyActions({ className, ...props }: EmptyActionsProps) {
  return (
    <div
      data-slot="empty-actions"
      className={cn(
        "mt-1 flex flex-wrap items-center justify-center gap-2",
        className,
      )}
      {...props}
    />
  );
}

export { Empty, EmptyActions, EmptyDescription, EmptyIcon, EmptyTitle };
