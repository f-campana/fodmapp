export const aspectRatioRecommendedUsageCode = `import { AspectRatio } from "@fodmapp/ui/aspect-ratio";

export function Example() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border">
      <AspectRatio ratio={4 / 3}>
        <img
          alt="Prepared low-FODMAP meal"
          className="size-full object-cover"
          src="/images/recipe-card.jpg"
        />
      </AspectRatio>
    </div>
  );
}
`;
