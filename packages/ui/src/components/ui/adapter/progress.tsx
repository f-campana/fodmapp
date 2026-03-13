import * as React from "react";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../../../lib/cn";

export type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root>;

function Progress({ className, value, ...props }: ProgressProps) {
  const safeValue =
    typeof value === "number" ? Math.min(100, Math.max(0, value)) : undefined;
  const indicatorStyle =
    typeof safeValue === "number"
      ? { transform: `translateX(-${100 - safeValue}%)` }
      : { transform: "translateX(-100%)" };

  return (
    <ProgressPrimitive.Root
      {...props}
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      value={safeValue}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 bg-primary",
          "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        )}
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
