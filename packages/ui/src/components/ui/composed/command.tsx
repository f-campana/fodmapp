"use client";

import * as React from "react";

import { Command as CommandPrimitive } from "cmdk";

import { cn } from "../../../lib/cn";
import {
  Dialog,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  type DialogProps,
  DialogTitle,
} from "../adapter/dialog";

type DataSlotProp = { "data-slot"?: string };

export type CommandProps = React.ComponentProps<typeof CommandPrimitive>;

function Command({
  className,
  "data-slot": dataSlot,
  ...props
}: CommandProps & DataSlotProp) {
  void dataSlot;

  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-(--radius) bg-popover text-popover-foreground",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        "[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0",
        "[&_[cmdk-group-items]]:p-1",
        "[&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5",
        className,
      )}
      {...props}
    />
  );
}

export type CommandDialogProps = DialogProps & {
  children?: React.ReactNode;
  contentClassName?: DialogContentProps["className"];
  commandClassName?: CommandProps["className"];
  description?: React.ReactNode;
  title?: React.ReactNode;
};

function CommandDialog({
  children,
  contentClassName,
  commandClassName,
  description = "Tapez pour filtrer les actions disponibles.",
  title = "Palette de commandes",
  ...props
}: CommandDialogProps) {
  const ariaLabel = typeof title === "string" ? title : "Palette de commandes";

  return (
    <Dialog {...props}>
      <DialogContent
        aria-label={ariaLabel}
        className={cn("overflow-hidden p-0", contentClassName)}
      >
        <span data-slot="command-dialog" hidden />
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <Command
          label={ariaLabel}
          className={cn(
            "[&_[data-slot=command-input-wrapper]]:h-12",
            "[&_[data-slot=command-item]]:px-2 [&_[data-slot=command-item]]:py-3",
            "[&_[data-slot=command-group-heading]]:px-2",
            commandClassName,
          )}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export type CommandInputProps = React.ComponentProps<
  typeof CommandPrimitive.Input
>;

function CommandInput({
  className,
  "data-slot": dataSlot,
  ...props
}: CommandInputProps & DataSlotProp) {
  void dataSlot;

  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center gap-2 border-b border-border px-3"
    >
      <svg
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 21L16.65 16.65M18.5 11C18.5 15.1421 15.1421 18.5 11 18.5C6.85786 18.5 3.5 15.1421 3.5 11C3.5 6.85786 6.85786 3.5 11 3.5C15.1421 3.5 18.5 6.85786 18.5 11Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "flex h-11 w-full rounded-(--radius) bg-transparent py-3 text-sm outline-hidden",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export type CommandListProps = React.ComponentProps<
  typeof CommandPrimitive.List
>;

function CommandList({
  className,
  "data-slot": dataSlot,
  ...props
}: CommandListProps & DataSlotProp) {
  void dataSlot;

  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-72 overflow-x-hidden overflow-y-auto", className)}
      {...props}
    />
  );
}

export type CommandEmptyProps = React.ComponentProps<
  typeof CommandPrimitive.Empty
>;

function CommandEmpty({
  className,
  "data-slot": dataSlot,
  ...props
}: CommandEmptyProps & DataSlotProp) {
  void dataSlot;

  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

export type CommandGroupProps = React.ComponentProps<
  typeof CommandPrimitive.Group
>;

function CommandGroup({
  className,
  heading,
  "data-slot": dataSlot,
  ...props
}: CommandGroupProps & DataSlotProp) {
  void dataSlot;

  const headingNode = heading ? (
    <span data-slot="command-group-heading">{heading}</span>
  ) : undefined;

  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      heading={headingNode}
      className={cn(
        "overflow-hidden p-1 text-foreground",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type CommandItemProps = React.ComponentProps<
  typeof CommandPrimitive.Item
>;

function CommandItem({
  className,
  "data-slot": dataSlot,
  ...props
}: CommandItemProps & DataSlotProp) {
  void dataSlot;

  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-(--radius) px-2 py-1.5 text-sm outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type CommandSeparatorProps = React.ComponentProps<
  typeof CommandPrimitive.Separator
>;

function CommandSeparator({
  className,
  "data-slot": dataSlot,
  ...props
}: CommandSeparatorProps & DataSlotProp) {
  void dataSlot;

  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      role="presentation"
      {...props}
    />
  );
}

export type CommandShortcutProps = React.ComponentProps<"span">;

function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
