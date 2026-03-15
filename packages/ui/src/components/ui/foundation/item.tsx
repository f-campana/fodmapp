import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn } from "../../../lib/cn";

export interface ItemProps extends React.ComponentProps<"div"> {
  asChild?: boolean;
}

function Item({ className, asChild = false, ...props }: ItemProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="item"
      className={cn(
        "flex w-full items-start gap-3 rounded-(--radius) border border-border bg-card p-3 text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type ItemGroupProps = React.ComponentProps<"div">;

function ItemGroup({ className, ...props }: ItemGroupProps) {
  return (
    <div
      data-slot="item-group"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    />
  );
}

export type ItemHeaderProps = React.ComponentProps<"div">;

function ItemHeader({ className, ...props }: ItemHeaderProps) {
  return (
    <div
      data-slot="item-header"
      className={cn("flex w-full items-start justify-between gap-2", className)}
      {...props}
    />
  );
}

export type ItemMediaProps = React.ComponentProps<"div">;

function ItemMedia({ className, ...props }: ItemMediaProps) {
  return (
    <div
      data-slot="item-media"
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export type ItemContentProps = React.ComponentProps<"div">;

function ItemContent({ className, ...props }: ItemContentProps) {
  return (
    <div
      data-slot="item-content"
      className={cn("min-w-0 flex-1 space-y-1", className)}
      {...props}
    />
  );
}

export type ItemTitleProps = React.ComponentProps<"div">;

function ItemTitle({ className, children, ...props }: ItemTitleProps) {
  return (
    <div
      data-slot="item-title"
      className={cn("text-sm leading-5 font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export type ItemDescriptionProps = React.ComponentProps<"p">;

function ItemDescription({ className, ...props }: ItemDescriptionProps) {
  return (
    <p
      data-slot="item-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export type ItemActionsProps = React.ComponentProps<"div">;

function ItemActions({ className, ...props }: ItemActionsProps) {
  return (
    <div
      data-slot="item-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export type ItemSeparatorProps = React.ComponentProps<"div">;

function ItemSeparator({ className, ...props }: ItemSeparatorProps) {
  return (
    <div
      data-slot="item-separator"
      role="separator"
      className={cn("h-px w-full bg-border", className)}
      {...props}
    />
  );
}

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
};
