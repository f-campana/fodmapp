import * as React from "react";

import { cn } from "../../../lib/cn";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card"
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-start gap-1.5 p-6",
        className,
      )}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-title"
      className={cn(
        "min-w-0 leading-5 font-semibold tracking-tight",
        className,
      )}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-description"
      className={cn("min-w-0 text-sm text-muted-foreground", className)}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 shrink-0 self-start justify-self-end",
        className,
      )}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
