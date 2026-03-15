import * as React from "react";

import { cn } from "../../../lib/cn";

export type SkeletonProps = React.ComponentProps<"div">;

function Skeleton({
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden={ariaHidden}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
