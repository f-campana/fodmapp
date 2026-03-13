import * as React from "react";

import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";

import { cn } from "../../../lib/cn";

export type ContextMenuProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Root
>;

function ContextMenu({ children, ...props }: ContextMenuProps) {
  return (
    <ContextMenuPrimitive.Root {...props}>
      <span data-slot="context-menu" hidden />
      {children}
    </ContextMenuPrimitive.Root>
  );
}

export type ContextMenuTriggerProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Trigger
>;

function ContextMenuTrigger({ className, ...props }: ContextMenuTriggerProps) {
  return (
    <ContextMenuPrimitive.Trigger
      {...props}
      data-slot="context-menu-trigger"
      className={cn(className)}
    />
  );
}

export type ContextMenuGroupProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Group
>;

function ContextMenuGroup({ className, ...props }: ContextMenuGroupProps) {
  return (
    <ContextMenuPrimitive.Group
      {...props}
      data-slot="context-menu-group"
      className={cn(className)}
    />
  );
}

export type ContextMenuPortalProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Portal
>;

function ContextMenuPortal({ children, ...props }: ContextMenuPortalProps) {
  return (
    <ContextMenuPrimitive.Portal {...props}>
      <div data-slot="context-menu-portal">{children}</div>
    </ContextMenuPrimitive.Portal>
  );
}

export type ContextMenuSubProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Sub
>;

function ContextMenuSub({ children, ...props }: ContextMenuSubProps) {
  return (
    <ContextMenuPrimitive.Sub {...props}>
      <span data-slot="context-menu-sub" hidden />
      {children}
    </ContextMenuPrimitive.Sub>
  );
}

export type ContextMenuRadioGroupProps = React.ComponentProps<
  typeof ContextMenuPrimitive.RadioGroup
>;

function ContextMenuRadioGroup({
  className,
  ...props
}: ContextMenuRadioGroupProps) {
  return (
    <ContextMenuPrimitive.RadioGroup
      {...props}
      data-slot="context-menu-radio-group"
      className={cn(className)}
    />
  );
}

export interface ContextMenuSubTriggerProps extends React.ComponentProps<
  typeof ContextMenuPrimitive.SubTrigger
> {
  inset?: boolean;
}

function ContextMenuSubTrigger({
  className,
  inset = false,
  children,
  ...props
}: ContextMenuSubTriggerProps) {
  return (
    <ContextMenuPrimitive.SubTrigger
      {...props}
      data-slot="context-menu-sub-trigger"
      data-inset={inset || undefined}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-(--radius) px-2 py-1.5 text-sm outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
    >
      {children}
      <svg
        aria-hidden="true"
        className="ml-auto size-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 6L15 12L9 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </ContextMenuPrimitive.SubTrigger>
  );
}

export type ContextMenuSubContentProps = React.ComponentProps<
  typeof ContextMenuPrimitive.SubContent
>;

function ContextMenuSubContent({
  className,
  sideOffset = 4,
  ...props
}: ContextMenuSubContentProps) {
  return (
    <ContextMenuPrimitive.SubContent
      {...props}
      data-slot="context-menu-sub-content"
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-(--radius) border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "origin-(--radix-context-menu-content-transform-origin)",
        "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
    />
  );
}

export type ContextMenuContentProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Content
> & {
  container?: ContextMenuPortalProps["container"];
};

function ContextMenuContent({
  container,
  className,
  ...props
}: ContextMenuContentProps) {
  return (
    <ContextMenuPortal container={container}>
      <ContextMenuPrimitive.Content
        {...props}
        data-slot="context-menu-content"
        className={cn(
          "z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-(--radius) border border-border bg-popover p-1 text-popover-foreground shadow-md",
          "origin-(--radix-context-menu-content-transform-origin)",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
      />
    </ContextMenuPortal>
  );
}

export interface ContextMenuItemProps extends React.ComponentProps<
  typeof ContextMenuPrimitive.Item
> {
  inset?: boolean;
}

function ContextMenuItem({
  className,
  inset = false,
  ...props
}: ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      {...props}
      data-slot="context-menu-item"
      data-inset={inset || undefined}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-(--radius) px-2 py-1.5 text-sm outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
    />
  );
}

export type ContextMenuCheckboxItemProps = React.ComponentProps<
  typeof ContextMenuPrimitive.CheckboxItem
>;

function ContextMenuCheckboxItem({
  className,
  children,
  ...props
}: ContextMenuCheckboxItemProps) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      {...props}
      data-slot="context-menu-checkbox-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-(--radius) py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
    >
      <span
        className="absolute left-2 inline-flex size-4 items-center justify-center"
        data-slot="context-menu-item-indicator"
      >
        <ContextMenuPrimitive.ItemIndicator>
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
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

export type ContextMenuRadioItemProps = React.ComponentProps<
  typeof ContextMenuPrimitive.RadioItem
>;

function ContextMenuRadioItem({
  className,
  children,
  ...props
}: ContextMenuRadioItemProps) {
  return (
    <ContextMenuPrimitive.RadioItem
      {...props}
      data-slot="context-menu-radio-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-(--radius) py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
    >
      <span
        className="absolute left-2 inline-flex size-4 items-center justify-center"
        data-slot="context-menu-item-indicator"
      >
        <ContextMenuPrimitive.ItemIndicator>
          <span className="size-2 rounded-full bg-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

export interface ContextMenuLabelProps extends React.ComponentProps<
  typeof ContextMenuPrimitive.Label
> {
  inset?: boolean;
}

function ContextMenuLabel({
  className,
  inset = false,
  ...props
}: ContextMenuLabelProps) {
  return (
    <ContextMenuPrimitive.Label
      {...props}
      data-slot="context-menu-label"
      data-inset={inset || undefined}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className,
      )}
    />
  );
}

export type ContextMenuSeparatorProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Separator
>;

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuSeparatorProps) {
  return (
    <ContextMenuPrimitive.Separator
      {...props}
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
    />
  );
}

export type ContextMenuShortcutProps = React.ComponentProps<"span">;

function ContextMenuShortcut({
  className,
  ...props
}: ContextMenuShortcutProps) {
  return (
    <span
      {...props}
      data-slot="context-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
    />
  );
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
