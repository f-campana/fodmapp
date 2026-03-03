import * as React from "react";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

import { cn } from "../../lib/cn";

export type AspectRatioProps = React.ComponentProps<
  typeof AspectRatioPrimitive.Root
>;

function AspectRatio({ className, ...props }: AspectRatioProps) {
  return (
    <AspectRatioPrimitive.Root
      data-slot="aspect-ratio"
      className={cn(className)}
      {...props}
    />
  );
}

export { AspectRatio };
