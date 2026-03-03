import * as React from "react";

import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "../../lib/cn";

export type SeparatorProps = React.ComponentProps<
  typeof SeparatorPrimitive.Root
>;

function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
