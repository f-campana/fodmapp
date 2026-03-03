import { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const emblaCarouselMock = vi.fn();
const emblaScrollPrevMock = vi.fn();
const emblaScrollNextMock = vi.fn();

vi.mock("embla-carousel-react", () => ({
  default: (...args: unknown[]) => emblaCarouselMock(...args),
}));

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";

beforeEach(() => {
  emblaScrollPrevMock.mockReset();
  emblaScrollNextMock.mockReset();

  const emblaApi = {
    canScrollNext: () => true,
    canScrollPrev: () => true,
    off: vi.fn(),
    on: vi.fn((_: string, cb: (api: unknown) => void) => {
      cb(emblaApi);
    }),
    scrollNext: emblaScrollNextMock,
    scrollPrev: emblaScrollPrevMock,
  };

  emblaCarouselMock.mockReturnValue([vi.fn(), emblaApi]);
});

describe("Carousel", () => {
  function renderCarousel(
    orientation: "horizontal" | "vertical" = "horizontal",
  ) {
    return render(
      <Carousel orientation={orientation}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
          <CarouselItem>Slide 3</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
  }

  it("renders slots and region semantics", () => {
    const { container } = renderCarousel();

    const root = container.querySelector("[data-slot='carousel']");

    expect(root).toHaveAttribute("role", "region");
    expect(root).toHaveAttribute("aria-roledescription", "carousel");
    expect(
      container.querySelector("[data-slot='carousel-content']"),
    ).toBeTruthy();
    expect(
      container.querySelectorAll("[data-slot='carousel-item']"),
    ).toHaveLength(3);
    expect(
      container.querySelector("[data-slot='carousel-previous']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='carousel-next']")).toBeTruthy();
  });

  it("handles previous and next actions", () => {
    renderCarousel();

    fireEvent.click(screen.getByRole("button", { name: "Slide precedent" }));
    fireEvent.click(screen.getByRole("button", { name: "Slide suivant" }));

    expect(emblaScrollPrevMock).toHaveBeenCalledTimes(1);
    expect(emblaScrollNextMock).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard navigation", () => {
    const { container } = renderCarousel();

    const root = container.querySelector(
      "[data-slot='carousel']",
    ) as HTMLElement;

    root.focus();
    fireEvent.keyDown(root, { key: "ArrowLeft", code: "ArrowLeft" });
    fireEvent.keyDown(root, { key: "ArrowRight", code: "ArrowRight" });

    expect(emblaScrollPrevMock).toHaveBeenCalled();
    expect(emblaScrollNextMock).toHaveBeenCalled();
  });

  it("applies vertical orientation classes", () => {
    const { container } = renderCarousel("vertical");

    const content = container.querySelector("[data-slot='carousel-content']");

    expect(content?.className ?? "").toContain("flex-col");
  });

  it("merges className and supports refs", () => {
    const carouselRef = createRef<HTMLDivElement>();
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();

    const { container } = render(
      <Carousel className="carousel-personnalise" ref={carouselRef}>
        <CarouselContent className="contenu-personnalise" ref={contentRef}>
          <CarouselItem className="item-personnalise" ref={itemRef}>
            Slide 1
          </CarouselItem>
        </CarouselContent>
      </Carousel>,
    );

    expect(container.querySelector(".carousel-personnalise")).toBeTruthy();
    expect(container.querySelector(".contenu-personnalise")).toBeTruthy();
    expect(container.querySelector(".item-personnalise")).toBeTruthy();

    expect(carouselRef.current).toBeInstanceOf(HTMLDivElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderCarousel();

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
