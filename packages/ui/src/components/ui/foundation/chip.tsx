import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/cn";

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-(--radius) border p-0.5",
  {
    variants: {
      variant: {
        default: "border-border bg-background",
        secondary: "border-border bg-secondary",
        outline: "border-outline-border bg-outline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const chipTriggerVariants = cva(
  [
    "inline-flex items-center justify-center rounded-[calc(var(--radius)-2px)] border border-transparent px-2.5 py-1 text-sm font-medium whitespace-nowrap",
    "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        outline: "",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        selected: true,
        className: "bg-primary text-primary-foreground hover:bg-primary-hover",
      },
      {
        variant: "default",
        selected: false,
        className: "text-foreground hover:bg-ghost-hover",
      },
      {
        variant: "secondary",
        selected: true,
        className:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
      },
      {
        variant: "secondary",
        selected: false,
        className: "text-secondary-foreground hover:bg-secondary-hover",
      },
      {
        variant: "outline",
        selected: true,
        className:
          "border-outline-border bg-outline text-outline-foreground hover:bg-outline-hover",
      },
      {
        variant: "outline",
        selected: false,
        className: "text-outline-foreground hover:bg-outline-hover",
      },
    ],
    defaultVariants: {
      variant: "default",
      selected: false,
    },
  },
);

const chipRemoveVariants = cva(
  [
    "inline-flex size-7 items-center justify-center rounded-[calc(var(--radius)-2px)] border border-transparent text-sm",
    "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
    "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "text-muted-foreground hover:bg-ghost-hover",
        secondary: "text-secondary-foreground hover:bg-secondary-hover",
        outline: "text-outline-foreground hover:bg-outline-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ChipProps
  extends
    Omit<React.ComponentProps<"div">, "onSelect">,
    VariantProps<typeof chipVariants> {
  selected?: boolean;
  removable?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}

function Chip({
  className,
  variant = "default",
  selected = false,
  removable = false,
  disabled = false,
  onSelect,
  onRemove,
  removeLabel = "Supprimer le filtre",
  children,
  ...props
}: ChipProps) {
  return (
    <div
      data-slot="chip"
      data-variant={variant}
      data-selected={selected ? "true" : "false"}
      data-removable={removable ? "true" : "false"}
      role="group"
      className={cn(chipVariants({ variant }), className)}
      {...props}
    >
      <button
        type="button"
        data-slot="chip-trigger"
        aria-pressed={selected}
        disabled={disabled}
        className={cn(chipTriggerVariants({ variant, selected }))}
        onClick={() => onSelect?.()}
      >
        {children}
      </button>
      {removable ? (
        <button
          type="button"
          data-slot="chip-remove"
          aria-label={removeLabel}
          disabled={disabled}
          className={cn(chipRemoveVariants({ variant }))}
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export { Chip, chipVariants };
