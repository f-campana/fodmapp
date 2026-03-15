import * as React from "react";

import { cn } from "../../../lib/cn";

export type TextareaProps = React.ComponentProps<"textarea">;

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-(--radius) border border-input bg-background px-3 py-2 text-base shadow-sm",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
        "placeholder:text-muted-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-validation-error-border aria-invalid:ring-2 aria-invalid:ring-validation-error-ring-soft",
        "md:text-sm",
        className,
      )}
    />
  );
}

export { Textarea };
