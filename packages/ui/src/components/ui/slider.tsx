import * as React from "react";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../../lib/cn";

export type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root>;

function Slider({ className, "aria-label": ariaLabel, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      aria-label={ariaLabel}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-primary"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={ariaLabel}
        className={cn(
          "block size-4 rounded-full border border-primary bg-background shadow-sm",
          "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
          "outline-hidden focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring-soft",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      />
    </SliderPrimitive.Root>
  );
}

export { Slider };
