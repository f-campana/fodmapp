import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn } from "../../../lib/cn";

function Breadcrumb({
  className,
  "aria-label": ariaLabel = "Fil d'Ariane",
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="breadcrumb"
      aria-label={ariaLabel}
      className={cn("w-full", className)}
      {...props}
    />
  );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "m-0 flex min-w-0 list-none flex-wrap items-center gap-1.5 p-0 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

export interface BreadcrumbLinkProps extends React.ComponentProps<"a"> {
  asChild?: boolean;
}

function BreadcrumbLink({
  className,
  asChild = false,
  ...props
}: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "transition-colors duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children = "/",
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  "aria-label": ariaLabel = "Niveaux intermédiaires masqués",
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    >
      …
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
