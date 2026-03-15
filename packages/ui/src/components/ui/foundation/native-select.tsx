import * as React from "react";

import { cn } from "../../../lib/cn";

export type NativeSelectProps = React.ComponentProps<"select">;

function NativeSelect({ className, children, ...props }: NativeSelectProps) {
  return (
    <select
      {...props}
      data-slot="native-select"
      className={cn(
        "flex h-10 w-full cursor-pointer rounded-(--radius) border border-input bg-background py-2 pr-9 pl-3 text-base shadow-sm",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-validation-error-border aria-invalid:ring-2 aria-invalid:ring-validation-error-ring-soft",
        "md:text-sm",
        className,
      )}
    >
      {children}
    </select>
  );
}

export { NativeSelect };
