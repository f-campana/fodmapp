import * as React from "react";

import { cn } from "../../lib/cn";

export type KbdProps = React.ComponentProps<"kbd">;

function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[min(var(--radius-sm),8px)] border border-border bg-muted px-1.5",
        "font-mono text-[0.7rem] font-medium text-muted-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export type KbdGroupProps = React.ComponentProps<"div">;

function KbdGroup({ className, ...props }: KbdGroupProps) {
  return (
    <div
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
