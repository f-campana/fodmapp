import * as React from "react";

import * as AccordionPrimitive from "@radix-ui/react-accordion";

import { cn } from "../../../lib/cn";

export type AccordionProps = React.ComponentProps<
  typeof AccordionPrimitive.Root
>;

function Accordion({ children, ...props }: AccordionProps) {
  return (
    <AccordionPrimitive.Root {...props} data-slot="accordion">
      {children}
    </AccordionPrimitive.Root>
  );
}

export type AccordionItemProps = React.ComponentProps<
  typeof AccordionPrimitive.Item
>;

function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      {...props}
      data-slot="accordion-item"
      className={cn(
        "overflow-hidden border-b border-border last:rounded-b-(--radius) last:border-b-0 first-of-type:rounded-t-(--radius)",
        className,
      )}
    />
  );
}

export type AccordionTriggerProps = React.ComponentProps<
  typeof AccordionPrimitive.Trigger
>;

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        {...props}
        data-slot="accordion-trigger"
        className={cn(
          "group inline-flex min-h-11 flex-1 cursor-pointer items-center justify-between gap-2 p-2 text-left text-base leading-6 font-medium",
          "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "hover:bg-accent hover:text-foreground",
          "data-[state=open]:bg-accent data-[state=open]:font-semibold data-[state=open]:text-foreground",
          "outline-hidden focus-visible:ring-2 focus-visible:ring-ring-soft",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
      >
        {children}
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--transition-duration-interactive) ease-(--transition-timing-interactive) group-hover:text-foreground group-data-[state=open]:rotate-180 group-data-[state=open]:text-foreground"
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
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export type AccordionContentProps = React.ComponentProps<
  typeof AccordionPrimitive.Content
>;

function AccordionContent({
  className,
  children,
  ...props
}: AccordionContentProps) {
  return (
    <AccordionPrimitive.Content
      {...props}
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden",
        "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        className,
      )}
    >
      <div
        data-slot="accordion-content-inner"
        className="p-2 text-base leading-7 text-muted-foreground"
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
