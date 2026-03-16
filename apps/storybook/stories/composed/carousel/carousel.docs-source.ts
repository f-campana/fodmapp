export const carouselRecommendedUsageCode = `import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@fodmap/ui/carousel";

export function Example() {
  return (
    <Carousel aria-label="Plan de repas de la semaine">
      <CarouselContent>
        <CarouselItem>Jour 1</CarouselItem>
        <CarouselItem>Jour 2</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
`;
