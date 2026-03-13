import * as React from "react";

import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";

import { cva } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const navigationMenuTriggerStyle = cva(
  [
    "group inline-flex h-10 w-max items-center justify-center gap-1 rounded-(--radius) border border-transparent bg-background px-4 py-2 text-sm font-medium",
    "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "hover:bg-accent hover:text-accent-foreground",
    "focus:bg-accent focus:text-accent-foreground",
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-[active]:bg-accent data-[active]:text-accent-foreground",
    "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
  ].join(" "),
);

export type NavigationMenuProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.Root
>;

function NavigationMenu({
  className,
  children,
  ...props
}: NavigationMenuProps) {
  return (
    <NavigationMenuPrimitive.Root
      {...props}
      data-slot="navigation-menu"
      className={cn(
        "relative z-10 flex max-w-max flex-1 items-center justify-center",
        className,
      )}
    >
      {children}
      <NavigationMenuViewportPosition>
        <NavigationMenuViewport />
      </NavigationMenuViewportPosition>
    </NavigationMenuPrimitive.Root>
  );
}

export type NavigationMenuListProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.List
>;

function NavigationMenuList({ className, ...props }: NavigationMenuListProps) {
  return (
    <NavigationMenuPrimitive.List
      {...props}
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className,
      )}
    />
  );
}

export type NavigationMenuItemProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.Item
>;

function NavigationMenuItem({ className, ...props }: NavigationMenuItemProps) {
  return (
    <NavigationMenuPrimitive.Item
      {...props}
      data-slot="navigation-menu-item"
      className={cn(className)}
    />
  );
}

export type NavigationMenuTriggerProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.Trigger
>;

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuTriggerProps) {
  return (
    <NavigationMenuPrimitive.Trigger
      {...props}
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), className)}
    >
      {children}
      <svg
        aria-hidden="true"
        className="size-3 transition-transform duration-(--transition-duration-interactive) ease-(--transition-timing-interactive) group-data-[state=open]:rotate-180"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </NavigationMenuPrimitive.Trigger>
  );
}

export type NavigationMenuContentProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.Content
>;

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuContentProps) {
  return (
    <NavigationMenuPrimitive.Content
      {...props}
      data-slot="navigation-menu-content"
      className={cn(
        "top-0 left-0 w-full md:absolute md:w-auto",
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out",
        "data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out",
        "data-[motion=from-end]:slide-in-from-right-2 data-[motion=from-start]:slide-in-from-left-2",
        "data-[motion=to-end]:slide-out-to-right-2 data-[motion=to-start]:slide-out-to-left-2",
        className,
      )}
    />
  );
}

export type NavigationMenuLinkProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.Link
>;

function NavigationMenuLink({ className, ...props }: NavigationMenuLinkProps) {
  return (
    <NavigationMenuPrimitive.Link
      {...props}
      data-slot="navigation-menu-link"
      className={cn(className)}
    />
  );
}

export type NavigationMenuIndicatorProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.Indicator
>;

function NavigationMenuIndicator({
  className,
  ...props
}: NavigationMenuIndicatorProps) {
  return (
    <NavigationMenuPrimitive.Indicator
      {...props}
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-1 flex h-1.5 items-end justify-center overflow-hidden",
        "data-[state=visible]:animate-in data-[state=hidden]:animate-out",
        "data-[state=hidden]:fade-out data-[state=visible]:fade-in",
        className,
      )}
    >
      <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}

export type NavigationMenuViewportProps = React.ComponentProps<
  typeof NavigationMenuPrimitive.Viewport
>;

function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuViewportProps) {
  return (
    <NavigationMenuPrimitive.Viewport
      {...props}
      data-slot="navigation-menu-viewport"
      className={cn(
        "origin-top-center relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden rounded-(--radius) border border-border bg-popover text-popover-foreground shadow-lg",
        "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "md:w-(--radix-navigation-menu-viewport-width)",
        className,
      )}
    />
  );
}

function NavigationMenuViewportPosition({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="navigation-menu-viewport-position"
      className={cn(
        "absolute top-full left-0 flex w-full justify-center",
        className,
      )}
    />
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
};
