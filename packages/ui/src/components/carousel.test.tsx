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
    props?: React.ComponentProps<typeof Carousel>,
  ) {
    return render(
      <Carousel
        aria-label="Plan de repas hebdomadaire"
        orientation={orientation}
        {...props}
      >
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
    expect(root).toHaveAttribute("aria-label", "Plan de repas hebdomadaire");
    expect(root).toHaveAttribute("tabindex", "0");
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

  it("provides the embla api through setApi", () => {
    const setApi = vi.fn();

    renderCarousel("horizontal", { setApi });

    expect(setApi).toHaveBeenCalledWith(
      expect.objectContaining({
        scrollNext: emblaScrollNextMock,
        scrollPrev: emblaScrollPrevMock,
      }),
    );
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

  it("supports vertical keyboard navigation", () => {
    const { container } = renderCarousel("vertical");

    const root = container.querySelector(
      "[data-slot='carousel']",
    ) as HTMLElement;

    root.focus();
    fireEvent.keyDown(root, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(root, { key: "ArrowDown", code: "ArrowDown" });

    expect(emblaScrollPrevMock).toHaveBeenCalled();
    expect(emblaScrollNextMock).toHaveBeenCalled();
  });

  it("applies viewport and vertical layout classes", () => {
    const { container } = renderCarousel("vertical");

    const viewport = container.querySelector("[data-slot='carousel-viewport']");
    const content = container.querySelector("[data-slot='carousel-content']");
    const item = container.querySelector("[data-slot='carousel-item']");

    expect(viewport?.className ?? "").toContain("cursor-grab");
    expect(viewport?.className ?? "").toContain("h-full");
    expect(viewport?.className ?? "").toContain("touch-pan-x");
    expect(content?.className ?? "").toContain("flex-col");
    expect(content?.className ?? "").toContain("h-full");
    expect(item?.className ?? "").toContain("basis-full");
  });

  it("keeps default slot hooks stable when consumers pass their own data-slot props", () => {
    const { container } = render(
      <Carousel
        aria-label="Resume hebdomadaire"
        data-slot="carousel-personnalise"
      >
        <CarouselContent data-slot="contenu-personnalise">
          <CarouselItem data-slot="item-personnalise">Slide 1</CarouselItem>
        </CarouselContent>
        <CarouselPrevious data-slot="precedent-personnalise" />
        <CarouselNext data-slot="suivant-personnalise" />
      </Carousel>,
    );

    expect(
      container.querySelector("[data-slot='carousel-personnalise']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='contenu-personnalise']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='item-personnalise']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='precedent-personnalise']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='suivant-personnalise']"),
    ).toBeNull();

    expect(container.querySelector("[data-slot='carousel']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='carousel-content']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='carousel-item']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='carousel-previous']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='carousel-next']")).toBeTruthy();
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
