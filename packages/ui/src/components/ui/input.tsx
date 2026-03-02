import * as React from "react";

import { cn } from "../../lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex h-10 w-full rounded-(--radius) border border-input bg-background px-3 py-2 text-base shadow-sm",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-validation-error-border aria-invalid:ring-2 aria-invalid:ring-validation-error-ring-soft",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
