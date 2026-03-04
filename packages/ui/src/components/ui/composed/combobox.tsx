"use client";

import * as React from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { Command as CommandPrimitive } from "cmdk";

import { useControllableState } from "../../../hooks/use-controllable-state";
import { cn } from "../../../lib/cn";

type ComboboxMode = "single" | "multiple";

interface ComboboxContextValue {
  mode: ComboboxMode;
  open: boolean;
  setOpen: (nextOpen: boolean) => void;
  contentId: string;
  listId: string;
  selectedValues: string[];
  selectValue: (nextValue: string, label: string) => void;
  registerItemLabel: (value: string, label: string) => void;
  resolveItemLabel: (value: string) => string;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

function useComboboxContext(componentName: string) {
  const context = React.useContext(ComboboxContext);

  if (!context) {
    throw new Error(
      `${componentName} must be used inside Combobox or ComboboxMulti.`,
    );
  }

  return context;
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node).trim();
  }

  if (Array.isArray(node)) {
    return node
      .map((item) => getNodeText(item))
      .join(" ")
      .trim();
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children).trim();
  }

  return "";
}

function createLabelMapUpdater(value: string, label: string) {
  return (previous: Record<string, string>) => {
    if (!label || previous[value] === label) {
      return previous;
    }

    return {
      ...previous,
      [value]: label,
    };
  };
}

interface ComboboxRootSharedProps {
  children?: React.ReactNode;
}

export interface ComboboxProps
  extends
    ComboboxRootSharedProps,
    Omit<
      React.ComponentProps<typeof PopoverPrimitive.Root>,
      "children" | "defaultOpen" | "onOpenChange" | "open"
    > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Combobox({
  children,
  value,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: ComboboxProps) {
  const [open = false, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const [selectedValue, setSelectedValue] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });
  const [itemLabels, setItemLabels] = React.useState<Record<string, string>>(
    {},
  );
  const contentId = React.useId();
  const listId = React.useId();

  const registerItemLabel = React.useCallback(
    (itemValue: string, label: string) => {
      setItemLabels(createLabelMapUpdater(itemValue, label));
    },
    [],
  );

  const resolveItemLabel = React.useCallback(
    (itemValue: string) => itemLabels[itemValue] ?? itemValue,
    [itemLabels],
  );

  const selectValue = React.useCallback(
    (nextValue: string, label: string) => {
      registerItemLabel(nextValue, label);

      if (selectedValue !== nextValue) {
        setSelectedValue(nextValue);
      }

      setOpen(false);
    },
    [registerItemLabel, selectedValue, setOpen, setSelectedValue],
  );

  const contextValue = React.useMemo<ComboboxContextValue>(
    () => ({
      mode: "single",
      open,
      setOpen,
      contentId,
      listId,
      selectedValues: selectedValue ? [selectedValue] : [],
      selectValue,
      registerItemLabel,
      resolveItemLabel,
    }),
    [
      contentId,
      listId,
      open,
      registerItemLabel,
      resolveItemLabel,
      selectValue,
      selectedValue,
      setOpen,
    ],
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <PopoverPrimitive.Root onOpenChange={setOpen} open={open} {...props}>
        <span data-slot="combobox" hidden />
        {children}
      </PopoverPrimitive.Root>
    </ComboboxContext.Provider>
  );
}

export interface ComboboxMultiProps
  extends
    ComboboxRootSharedProps,
    Omit<
      React.ComponentProps<typeof PopoverPrimitive.Root>,
      "children" | "defaultOpen" | "onOpenChange" | "open"
    > {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ComboboxMulti({
  children,
  value,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: ComboboxMultiProps) {
  const [open = false, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const [selectedValues = [], setSelectedValues] = useControllableState({
    prop: value,
    defaultProp: defaultValue ?? [],
    onChange: onValueChange,
  });
  const [itemLabels, setItemLabels] = React.useState<Record<string, string>>(
    {},
  );
  const contentId = React.useId();
  const listId = React.useId();

  const registerItemLabel = React.useCallback(
    (itemValue: string, label: string) => {
      setItemLabels(createLabelMapUpdater(itemValue, label));
    },
    [],
  );

  const resolveItemLabel = React.useCallback(
    (itemValue: string) => itemLabels[itemValue] ?? itemValue,
    [itemLabels],
  );

  const selectValue = React.useCallback(
    (nextValue: string, label: string) => {
      registerItemLabel(nextValue, label);

      if (!selectedValues.includes(nextValue)) {
        setSelectedValues([...selectedValues, nextValue]);
      }

      setOpen(false);
    },
    [registerItemLabel, selectedValues, setOpen, setSelectedValues],
  );

  const contextValue = React.useMemo<ComboboxContextValue>(
    () => ({
      mode: "multiple",
      open,
      setOpen,
      contentId,
      listId,
      selectedValues,
      selectValue,
      registerItemLabel,
      resolveItemLabel,
    }),
    [
      contentId,
      listId,
      open,
      registerItemLabel,
      resolveItemLabel,
      selectValue,
      selectedValues,
      setOpen,
    ],
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <PopoverPrimitive.Root onOpenChange={setOpen} open={open} {...props}>
        <span data-slot="combobox-multi" hidden />
        {children}
      </PopoverPrimitive.Root>
    </ComboboxContext.Provider>
  );
}

export interface ComboboxTriggerProps extends React.ComponentProps<
  typeof PopoverPrimitive.Trigger
> {
  placeholder?: string;
}

function ComboboxTrigger({
  className,
  children,
  placeholder = "Sélectionner une option",
  ...props
}: ComboboxTriggerProps) {
  const context = useComboboxContext("ComboboxTrigger");
  const selectedCount = context.selectedValues.length;
  const hasSelection = selectedCount > 0;

  const displayValue = React.useMemo(() => {
    if (!hasSelection) {
      return placeholder;
    }

    if (context.mode === "single") {
      return context.resolveItemLabel(context.selectedValues[0]);
    }

    const firstLabel = context.resolveItemLabel(context.selectedValues[0]);

    if (selectedCount === 1) {
      return firstLabel;
    }

    return `${firstLabel} +${selectedCount - 1}`;
  }, [context, hasSelection, placeholder, selectedCount]);

  return (
    <PopoverPrimitive.Trigger
      aria-controls={context.contentId}
      aria-expanded={context.open}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-(--radius) border border-input bg-background px-3 py-2 text-sm whitespace-nowrap outline-hidden",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "aria-invalid:border-validation-error-border aria-invalid:ring-validation-error-ring-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      data-slot="combobox-trigger"
      role="combobox"
      {...props}
    >
      {children ?? (
        <span
          className={cn("truncate", !hasSelection && "text-muted-foreground")}
        >
          {displayValue}
        </span>
      )}
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
    </PopoverPrimitive.Trigger>
  );
}

export interface ComboboxContentProps extends React.ComponentProps<
  typeof PopoverPrimitive.Content
> {
  commandClassName?: string;
}

function ComboboxContent({
  className,
  children,
  commandClassName,
  sideOffset = 4,
  ...props
}: ComboboxContentProps) {
  const context = useComboboxContext("ComboboxContent");

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn(
          "z-50 w-(--radix-popover-trigger-width) min-w-[12rem] overflow-hidden rounded-(--radius) border border-border bg-popover p-0 text-popover-foreground shadow-md",
          "origin-(--radix-popover-content-transform-origin)",
          "duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        data-slot="combobox-content"
        id={context.contentId}
        sideOffset={sideOffset}
        {...props}
      >
        <CommandPrimitive
          className={cn(
            "flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground",
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
            commandClassName,
          )}
          shouldFilter
        >
          {children}
        </CommandPrimitive>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export type ComboboxInputProps = React.ComponentProps<
  typeof CommandPrimitive.Input
>;

function ComboboxInput({ className, ...props }: ComboboxInputProps) {
  const context = useComboboxContext("ComboboxInput");

  return (
    <div
      data-slot="combobox-input-wrapper"
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
        aria-controls={context.listId}
        className={cn(
          "flex h-11 w-full rounded-(--radius) bg-transparent py-3 text-sm outline-hidden",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        data-slot="combobox-input"
        {...props}
      />
    </div>
  );
}

export type ComboboxListProps = React.ComponentProps<
  typeof CommandPrimitive.List
>;

function ComboboxList({ className, ...props }: ComboboxListProps) {
  const context = useComboboxContext("ComboboxList");

  return (
    <CommandPrimitive.List
      className={cn("max-h-72 overflow-x-hidden overflow-y-auto", className)}
      data-slot="combobox-list"
      id={context.listId}
      {...props}
    />
  );
}

export type ComboboxEmptyProps = React.ComponentProps<
  typeof CommandPrimitive.Empty
>;

function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <CommandPrimitive.Empty
      className={cn("py-6 text-center text-sm", className)}
      data-slot="combobox-empty"
      {...props}
    />
  );
}

export type ComboboxGroupProps = React.ComponentProps<
  typeof CommandPrimitive.Group
>;

function ComboboxGroup({ className, heading, ...props }: ComboboxGroupProps) {
  const headingNode = heading ? (
    <span data-slot="combobox-group-heading">{heading}</span>
  ) : undefined;

  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-foreground",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      data-slot="combobox-group"
      heading={headingNode}
      {...props}
    />
  );
}

export interface ComboboxItemProps extends Omit<
  React.ComponentProps<typeof CommandPrimitive.Item>,
  "onSelect" | "value"
> {
  value: string;
  label?: string;
  onSelect?: (value: string) => void;
}

function ComboboxItem({
  className,
  children,
  label,
  onSelect,
  value,
  ...props
}: ComboboxItemProps) {
  const context = useComboboxContext("ComboboxItem");
  const { registerItemLabel, selectValue, selectedValues } = context;

  const resolvedLabel = React.useMemo(() => {
    const fromChildren = getNodeText(children);
    return label ?? (fromChildren || value);
  }, [children, label, value]);

  const isSelected = selectedValues.includes(value);

  React.useEffect(() => {
    registerItemLabel(value, resolvedLabel);
  }, [registerItemLabel, resolvedLabel, value]);

  const handleSelect = React.useCallback(
    (nextValue: string) => {
      const selectedValue = nextValue || value;
      selectValue(selectedValue, resolvedLabel);
      onSelect?.(selectedValue);
    },
    [onSelect, resolvedLabel, selectValue, value],
  );

  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-(--radius) py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      data-slot="combobox-item"
      onSelect={handleSelect}
      value={value}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute left-2 inline-flex size-4 items-center justify-center opacity-0 data-[selected=true]:opacity-100"
        data-selected={isSelected ? "true" : "false"}
        data-slot="combobox-item-indicator"
      >
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
      </span>
      {children}
    </CommandPrimitive.Item>
  );
}

export type ComboboxSeparatorProps = React.ComponentProps<
  typeof CommandPrimitive.Separator
>;

function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps) {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 h-px bg-border", className)}
      data-slot="combobox-separator"
      role="presentation"
      {...props}
    />
  );
}

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxMulti,
  ComboboxSeparator,
  ComboboxTrigger,
};
