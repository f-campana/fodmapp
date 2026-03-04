import * as React from "react";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../../../lib/cn";

export type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>;

function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

export type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>;

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-(--radius) bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type TabsTriggerProps = React.ComponentProps<
  typeof TabsPrimitive.Trigger
>;

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center rounded-[calc(var(--radius)-0.25rem)] px-3 py-1.5 text-sm font-medium whitespace-nowrap",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "data-[state=active]:bg-background data-[state=active]:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type TabsContentProps = React.ComponentProps<
  typeof TabsPrimitive.Content
>;

function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "mt-2 rounded-(--radius) border border-border bg-card p-4 text-card-foreground",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
