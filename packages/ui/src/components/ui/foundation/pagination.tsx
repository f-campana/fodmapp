import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cva } from "class-variance-authority";

import { cn } from "../../../lib/cn";

function Pagination({
  className,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn(
        "m-0 flex list-none flex-row flex-wrap items-center justify-center gap-1 p-0",
        className,
      )}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    />
  );
}

const paginationLinkVariants = cva(
  [
    "inline-flex h-8 min-w-8 items-center justify-center rounded-(--radius) border border-transparent px-2 text-sm font-medium whitespace-nowrap select-none",
    "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
    "cursor-pointer",
    "data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-default data-[disabled=true]:opacity-50",
  ].join(" "),
  {
    variants: {
      active: {
        true: "border-outline-border bg-outline text-outline-foreground hover:bg-outline-hover",
        false: "text-ghost-foreground hover:bg-ghost-hover",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export interface PaginationLinkProps extends React.ComponentProps<"a"> {
  asChild?: boolean;
  disabled?: boolean;
  isActive?: boolean;
}

function PaginationLink({
  className,
  asChild = false,
  disabled = false,
  isActive = false,
  onClick,
  tabIndex,
  "aria-disabled": ariaDisabled,
  ...props
}: PaginationLinkProps) {
  const Comp = asChild ? Slot : "a";
  const isDisabled =
    disabled || ariaDisabled === true || ariaDisabled === "true";
  const linkProps = asChild ? props : { href: props.href ?? "#", ...props };

  return (
    <Comp
      aria-current={isActive ? "page" : undefined}
      aria-disabled={isDisabled || undefined}
      data-slot="pagination-link"
      data-active={isActive ? "true" : "false"}
      data-disabled={isDisabled ? "true" : "false"}
      className={cn(paginationLinkVariants({ active: isActive }), className)}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        onClick?.(event);
      }}
      tabIndex={isDisabled ? (tabIndex ?? -1) : tabIndex}
      {...linkProps}
    />
  );
}

function PaginationPrevious({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Précédent"
      className={cn("gap-1 px-2.5", className)}
      {...props}
    >
      <span aria-hidden="true">‹</span>
      {children ?? "Précédent"}
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Suivant"
      className={cn("gap-1 px-2.5", className)}
      {...props}
    >
      {children ?? "Suivant"}
      <span aria-hidden="true">›</span>
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  "aria-label": ariaLabel = "Pages intermédiaires masquées",
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-8 items-center justify-center text-muted-foreground",
        className,
      )}
      {...props}
    >
      …
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
