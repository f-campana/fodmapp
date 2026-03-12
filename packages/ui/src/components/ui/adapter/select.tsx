import * as React from "react";

import * as SelectPrimitive from "@radix-ui/react-select";

import { cn } from "../../../lib/cn";

export type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root>;

function Select({ children, ...props }: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      <span data-slot="select" hidden />
      {children}
    </SelectPrimitive.Root>
  );
}

export type SelectGroupProps = React.ComponentProps<
  typeof SelectPrimitive.Group
>;

function SelectGroup({ className, ...props }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group
      className={cn(className)}
      data-slot="select-group"
      {...props}
    />
  );
}

export type SelectValueProps = React.ComponentProps<
  typeof SelectPrimitive.Value
>;

function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <SelectPrimitive.Value
      className={cn(className)}
      data-slot="select-value"
      {...props}
    />
  );
}

export type SelectTriggerProps = React.ComponentProps<
  typeof SelectPrimitive.Trigger
>;

function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-(--radius) border border-input bg-background px-3 py-2 text-sm whitespace-nowrap outline-hidden",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "aria-invalid:border-validation-error-border aria-invalid:ring-validation-error-ring-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[placeholder]:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <span data-slot="select-icon">
          <svg
            aria-hidden="true"
            className="size-4"
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
        </span>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export type SelectContentProps = React.ComponentProps<
  typeof SelectPrimitive.Content
>;

function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 4,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <div
        aria-label="Options du sélecteur"
        data-slot="select-portal"
        role="region"
      >
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-hidden rounded-(--radius) border border-border bg-popover text-popover-foreground shadow-md",
            "origin-(--radix-select-content-transform-origin)",
            "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className,
          )}
          data-slot="select-content"
          position={position}
          sideOffset={sideOffset}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              "p-1",
              position === "popper" &&
                "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)",
            )}
            data-slot="select-viewport"
            tabIndex={0}
          >
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </div>
    </SelectPrimitive.Portal>
  );
}

export type SelectLabelProps = React.ComponentProps<
  typeof SelectPrimitive.Label
>;

function SelectLabel({ className, ...props }: SelectLabelProps) {
  return (
    <SelectPrimitive.Label
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

export type SelectItemProps = React.ComponentProps<typeof SelectPrimitive.Item>;

function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-(--radius) py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      data-slot="select-item"
      {...props}
    >
      <span
        className="absolute right-2 inline-flex size-4 items-center justify-center"
        data-slot="select-item-indicator"
      >
        <SelectPrimitive.ItemIndicator>
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12L10 17L19 8"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export type SelectSeparatorProps = React.ComponentProps<
  typeof SelectPrimitive.Separator
>;

function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      data-slot="select-separator"
      {...props}
    />
  );
}

export type SelectScrollUpButtonProps = React.ComponentProps<
  typeof SelectPrimitive.ScrollUpButton
>;

function SelectScrollUpButton({
  className,
  ...props
}: SelectScrollUpButtonProps) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        className,
      )}
      data-slot="select-scroll-up-button"
      {...props}
    >
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 15L12 9L18 15"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </SelectPrimitive.ScrollUpButton>
  );
}

export type SelectScrollDownButtonProps = React.ComponentProps<
  typeof SelectPrimitive.ScrollDownButton
>;

function SelectScrollDownButton({
  className,
  ...props
}: SelectScrollDownButtonProps) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        className,
      )}
      data-slot="select-scroll-down-button"
      {...props}
    >
      <svg
        aria-hidden="true"
        className="size-4"
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
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
