import * as React from "react";

import * as AccordionPrimitive from "@radix-ui/react-accordion";

import { cn } from "../../lib/cn";

export type AccordionProps = React.ComponentProps<
  typeof AccordionPrimitive.Root
>;

function Accordion({ children, ...props }: AccordionProps) {
  return (
    <AccordionPrimitive.Root {...props}>
      <span data-slot="accordion" hidden />
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
      data-slot="accordion-item"
      className={cn("border-b border-border", className)}
      {...props}
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
        data-slot="accordion-trigger"
        className={cn(
          "group inline-flex flex-1 items-center justify-between gap-2 rounded-[calc(var(--radius)-0.25rem)] py-4 text-left text-sm font-medium",
          "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--transition-duration-interactive) ease-(--transition-timing-interactive) group-data-[state=open]:rotate-180"
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
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-sm",
        "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        className,
      )}
      {...props}
    >
      <div
        data-slot="accordion-content-inner"
        className="pt-0 pb-4 text-muted-foreground"
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
