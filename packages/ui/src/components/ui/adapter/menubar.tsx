import * as React from "react";

import * as MenubarPrimitive from "@radix-ui/react-menubar";

import { cn } from "../../../lib/cn";

export type MenubarProps = React.ComponentProps<typeof MenubarPrimitive.Root>;

function Menubar({ className, ...props }: MenubarProps) {
  return (
    <MenubarPrimitive.Root
      {...props}
      data-slot="menubar"
      className={cn(
        "flex h-10 max-w-full items-center gap-1 overflow-x-auto rounded-(--radius) border border-border bg-background p-1",
        className,
      )}
    />
  );
}

export type MenubarMenuProps = React.ComponentProps<
  typeof MenubarPrimitive.Menu
>;

function MenubarMenu({ children, ...props }: MenubarMenuProps) {
  return (
    <MenubarPrimitive.Menu {...props}>
      <span data-slot="menubar-menu" hidden />
      {children}
    </MenubarPrimitive.Menu>
  );
}

export type MenubarTriggerProps = React.ComponentProps<
  typeof MenubarPrimitive.Trigger
>;

function MenubarTrigger({ className, ...props }: MenubarTriggerProps) {
  return (
    <MenubarPrimitive.Trigger
      {...props}
      data-slot="menubar-trigger"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-(--radius) border border-transparent px-3 py-1.5 text-sm font-medium outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    />
  );
}

export type MenubarGroupProps = React.ComponentProps<
  typeof MenubarPrimitive.Group
>;

function MenubarGroup({ className, ...props }: MenubarGroupProps) {
  return (
    <MenubarPrimitive.Group
      {...props}
      data-slot="menubar-group"
      className={cn(className)}
    />
  );
}

export type MenubarPortalProps = React.ComponentProps<
  typeof MenubarPrimitive.Portal
>;

function MenubarPortal({ children, ...props }: MenubarPortalProps) {
  return (
    <MenubarPrimitive.Portal {...props}>
      <div data-slot="menubar-portal">{children}</div>
    </MenubarPrimitive.Portal>
  );
}

export type MenubarSubProps = React.ComponentProps<typeof MenubarPrimitive.Sub>;

function MenubarSub({ children, ...props }: MenubarSubProps) {
  return (
    <MenubarPrimitive.Sub {...props}>
      <span data-slot="menubar-sub" hidden />
      {children}
    </MenubarPrimitive.Sub>
  );
}

export type MenubarRadioGroupProps = React.ComponentProps<
  typeof MenubarPrimitive.RadioGroup
>;

function MenubarRadioGroup({ className, ...props }: MenubarRadioGroupProps) {
  return (
    <MenubarPrimitive.RadioGroup
      {...props}
      data-slot="menubar-radio-group"
      className={cn(className)}
    />
  );
}

export interface MenubarSubTriggerProps extends React.ComponentProps<
  typeof MenubarPrimitive.SubTrigger
> {
  inset?: boolean;
}

function MenubarSubTrigger({
  className,
  inset = false,
  children,
  ...props
}: MenubarSubTriggerProps) {
  return (
    <MenubarPrimitive.SubTrigger
      {...props}
      data-slot="menubar-sub-trigger"
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
    </MenubarPrimitive.SubTrigger>
  );
}

export type MenubarSubContentProps = React.ComponentProps<
  typeof MenubarPrimitive.SubContent
>;

function MenubarSubContent({
  className,
  sideOffset = 4,
  ...props
}: MenubarSubContentProps) {
  return (
    <MenubarPrimitive.SubContent
      {...props}
      data-slot="menubar-sub-content"
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-(--radix-menubar-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-(--radius) border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "origin-(--radix-menubar-content-transform-origin)",
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

export type MenubarContentProps = React.ComponentProps<
  typeof MenubarPrimitive.Content
> & {
  container?: MenubarPortalProps["container"];
};

function MenubarContent({
  container,
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: MenubarContentProps) {
  return (
    <MenubarPortal container={container}>
      <MenubarPrimitive.Content
        {...props}
        align={align}
        data-slot="menubar-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-(--radix-menubar-content-available-height) min-w-[12rem] overflow-x-hidden overflow-y-auto rounded-(--radius) border border-border bg-popover p-1 text-popover-foreground shadow-md",
          "origin-(--radix-menubar-content-transform-origin)",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
      />
    </MenubarPortal>
  );
}

export interface MenubarItemProps extends React.ComponentProps<
  typeof MenubarPrimitive.Item
> {
  inset?: boolean;
}

function MenubarItem({ className, inset = false, ...props }: MenubarItemProps) {
  return (
    <MenubarPrimitive.Item
      {...props}
      data-slot="menubar-item"
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

export type MenubarCheckboxItemProps = React.ComponentProps<
  typeof MenubarPrimitive.CheckboxItem
>;

function MenubarCheckboxItem({
  className,
  children,
  ...props
}: MenubarCheckboxItemProps) {
  return (
    <MenubarPrimitive.CheckboxItem
      {...props}
      data-slot="menubar-checkbox-item"
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
        data-slot="menubar-item-indicator"
      >
        <MenubarPrimitive.ItemIndicator>
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
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}

export type MenubarRadioItemProps = React.ComponentProps<
  typeof MenubarPrimitive.RadioItem
>;

function MenubarRadioItem({
  className,
  children,
  ...props
}: MenubarRadioItemProps) {
  return (
    <MenubarPrimitive.RadioItem
      {...props}
      data-slot="menubar-radio-item"
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
        data-slot="menubar-item-indicator"
      >
        <MenubarPrimitive.ItemIndicator>
          <span className="size-2 rounded-full bg-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
}

export interface MenubarLabelProps extends React.ComponentProps<
  typeof MenubarPrimitive.Label
> {
  inset?: boolean;
}

function MenubarLabel({
  className,
  inset = false,
  ...props
}: MenubarLabelProps) {
  return (
    <MenubarPrimitive.Label
      {...props}
      data-slot="menubar-label"
      data-inset={inset || undefined}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className,
      )}
    />
  );
}

export type MenubarSeparatorProps = React.ComponentProps<
  typeof MenubarPrimitive.Separator
>;

function MenubarSeparator({ className, ...props }: MenubarSeparatorProps) {
  return (
    <MenubarPrimitive.Separator
      {...props}
      data-slot="menubar-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
    />
  );
}

export type MenubarShortcutProps = React.ComponentProps<"span">;

function MenubarShortcut({ className, ...props }: MenubarShortcutProps) {
  return (
    <span
      {...props}
      data-slot="menubar-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
    />
  );
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
