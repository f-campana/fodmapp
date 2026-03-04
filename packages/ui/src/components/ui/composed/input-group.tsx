import * as React from "react";

import { cn } from "../../../lib/cn";

const groupedItemClasses = [
  "rounded-none border-0 border-l border-border first:border-l-0",
  "first:rounded-l-(--radius) last:rounded-r-(--radius)",
].join(" ");

export type InputGroupProps = React.ComponentProps<"div">;

function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <div
      role="group"
      data-slot="input-group"
      className={cn(
        "flex w-full items-stretch rounded-(--radius) border border-input bg-background",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring-soft",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupInputProps = React.ComponentProps<"input">;

function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  return (
    <input
      data-slot="input-group-input"
      className={cn(
        "h-10 min-w-0 flex-1 bg-transparent px-3 py-2 text-sm shadow-none outline-hidden",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "aria-invalid:border-validation-error-border aria-invalid:ring-validation-error-ring-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        groupedItemClasses,
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupAddonProps = React.ComponentProps<"div">;

function InputGroupAddon({ className, ...props }: InputGroupAddonProps) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "inline-flex h-10 items-center bg-muted/40 px-3 text-sm text-muted-foreground",
        groupedItemClasses,
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupTextProps = React.ComponentProps<"span">;

function InputGroupText({ className, ...props }: InputGroupTextProps) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "inline-flex h-10 items-center bg-muted/20 px-3 text-sm text-muted-foreground",
        groupedItemClasses,
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupButtonProps = React.ComponentProps<"button">;

function InputGroupButton({
  className,
  type = "button",
  ...props
}: InputGroupButtonProps) {
  return (
    <button
      data-slot="input-group-button"
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-medium whitespace-nowrap",
        "bg-background text-foreground",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "outline-hidden hover:bg-accent hover:text-accent-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        groupedItemClasses,
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
};
