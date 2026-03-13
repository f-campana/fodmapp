"use client";

import * as React from "react";

import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";

import { cn } from "../../../lib/cn";
import { Button } from "../foundation/button";

type CarouselApi = NonNullable<UseEmblaCarouselType[1]>;

type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

type CarouselPlugins = Parameters<typeof useEmblaCarousel>[1];
type DataSlotProp = { "data-slot"?: string };

type CarouselContextValue = {
  api: UseEmblaCarouselType[1];
  canScrollNext: boolean;
  canScrollPrev: boolean;
  orientation: "horizontal" | "vertical";
  scrollNext: () => void;
  scrollPrev: () => void;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

export interface CarouselProps extends React.ComponentProps<"div"> {
  opts?: CarouselOptions;
  plugins?: CarouselPlugins;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
}

function Carousel({
  className,
  children,
  opts,
  plugins,
  orientation = "horizontal",
  setApi,
  onKeyDownCapture,
  tabIndex = 0,
  "data-slot": dataSlot,
  ...props
}: CarouselProps & DataSlotProp) {
  void dataSlot;

  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((emblaApi: CarouselApi) => {
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api.off("reInit", onSelect);
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  React.useEffect(() => {
    if (api && setApi) {
      setApi(api);
    }
  }, [api, setApi]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    onKeyDownCapture?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (orientation === "horizontal") {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    }

    if (orientation === "vertical") {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        scrollPrev();
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        scrollNext();
      }
    }
  }

  return (
    <CarouselContext.Provider
      value={{
        api,
        canScrollNext,
        canScrollPrev,
        orientation,
        scrollNext,
        scrollPrev,
      }}
    >
      <div
        aria-roledescription="carousel"
        data-slot="carousel"
        role="region"
        tabIndex={tabIndex}
        className={cn(
          "relative rounded-(--radius) outline-hidden focus-visible:ring-2 focus-visible:ring-ring-soft",
          className,
        )}
        onKeyDownCapture={handleKeyDown}
        {...props}
      >
        <div
          ref={carouselRef}
          className="overflow-hidden"
          data-slot="carousel-viewport"
        >
          {children}
        </div>
      </div>
    </CarouselContext.Provider>
  );
}

export type CarouselContentProps = React.ComponentProps<"div">;

function CarouselContent({
  className,
  "data-slot": dataSlot,
  ...props
}: CarouselContentProps & DataSlotProp) {
  void dataSlot;

  const { orientation } = useCarousel();

  return (
    <div
      data-slot="carousel-content"
      className={cn(
        "flex",
        orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
        className,
      )}
      {...props}
    />
  );
}

export type CarouselItemProps = React.ComponentProps<"div">;

function CarouselItem({
  className,
  "data-slot": dataSlot,
  ...props
}: CarouselItemProps & DataSlotProp) {
  void dataSlot;

  const { orientation } = useCarousel();

  return (
    <div
      aria-roledescription="slide"
      data-slot="carousel-item"
      role="group"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

export type CarouselPreviousProps = React.ComponentProps<typeof Button>;

function CarouselPrevious({
  className,
  onClick,
  size = "icon-sm",
  type = "button",
  variant = "outline",
  "data-slot": dataSlot,
  ...props
}: CarouselPreviousProps & DataSlotProp) {
  void dataSlot;

  const { canScrollPrev, orientation, scrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      disabled={!canScrollPrev}
      size={size}
      variant={variant}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-10 -translate-y-1/2"
          : "top-[-2.5rem] left-1/2 -translate-x-1/2",
        className,
      )}
      onClick={(event) => {
        scrollPrev();
        onClick?.(event);
      }}
      type={type}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {orientation === "horizontal" ? (
          <path
            d="M15 6L9 12L15 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        ) : (
          <path
            d="M6 15L12 9L18 15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        )}
      </svg>
      <span className="sr-only">Slide precedent</span>
    </Button>
  );
}

export type CarouselNextProps = React.ComponentProps<typeof Button>;

function CarouselNext({
  className,
  onClick,
  size = "icon-sm",
  type = "button",
  variant = "outline",
  "data-slot": dataSlot,
  ...props
}: CarouselNextProps & DataSlotProp) {
  void dataSlot;

  const { canScrollNext, orientation, scrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      disabled={!canScrollNext}
      size={size}
      variant={variant}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-10 -translate-y-1/2"
          : "-bottom-10 left-1/2 -translate-x-1/2",
        className,
      )}
      onClick={(event) => {
        scrollNext();
        onClick?.(event);
      }}
      type={type}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {orientation === "horizontal" ? (
          <path
            d="M9 6L15 12L9 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        ) : (
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        )}
      </svg>
      <span className="sr-only">Slide suivant</span>
    </Button>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
};
export type { CarouselApi };
