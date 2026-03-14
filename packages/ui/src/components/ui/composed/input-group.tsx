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
      {...props}
      role="group"
      data-slot="input-group"
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-(--radius) border border-input bg-background",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring-soft",
        "has-[input[aria-invalid='true']]:border-validation-error-border",
        "has-[input[aria-invalid='true']]:ring-2 has-[input[aria-invalid='true']]:ring-validation-error-ring-soft",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    />
  );
}

export type InputGroupInputProps = React.ComponentProps<"input">;

function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  return (
    <input
      {...props}
      data-slot="input-group-input"
      className={cn(
        "h-10 min-w-[5.5rem] flex-[1_1_7rem] bg-transparent px-3 py-2 text-sm shadow-none outline-hidden",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "aria-invalid:border-validation-error-border aria-invalid:ring-validation-error-ring-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        groupedItemClasses,
        className,
      )}
    />
  );
}

export type InputGroupAddonProps = React.ComponentProps<"div">;

function InputGroupAddon({ className, ...props }: InputGroupAddonProps) {
  return (
    <div
      {...props}
      data-slot="input-group-addon"
      className={cn(
        "inline-flex h-10 max-w-[45%] min-w-0 shrink basis-auto items-center truncate bg-muted/40 px-3 text-sm text-muted-foreground",
        groupedItemClasses,
        className,
      )}
    />
  );
}

export type InputGroupTextProps = React.ComponentProps<"span">;

function InputGroupText({ className, ...props }: InputGroupTextProps) {
  return (
    <span
      {...props}
      data-slot="input-group-text"
      className={cn(
        "inline-flex h-10 max-w-[45%] min-w-0 shrink basis-auto items-center truncate bg-muted/20 px-3 text-sm text-muted-foreground",
        groupedItemClasses,
        className,
      )}
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
      {...props}
      className={cn(
        "inline-flex h-10 min-w-0 shrink-0 cursor-pointer items-center justify-center gap-2 px-3 text-sm font-medium whitespace-nowrap",
        "bg-background text-foreground",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "outline-hidden hover:bg-accent hover:text-accent-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        groupedItemClasses,
        className,
      )}
      data-slot="input-group-button"
      type={type}
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
