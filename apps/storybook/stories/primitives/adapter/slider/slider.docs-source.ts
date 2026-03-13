export const sliderRecommendedUsageCode = `import { Slider } from "@fodmap/ui";

export function Example() {
  return (
    <Slider
      aria-label="Tolerance threshold"
      defaultValue={[40]}
      max={100}
      min={0}
      step={5}
    />
  );
}
`;
