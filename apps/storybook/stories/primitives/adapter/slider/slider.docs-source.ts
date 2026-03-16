export const sliderRecommendedUsageCode = `import { Slider } from "@fodmapp/ui";

export function Example() {
  return (
    <div className="space-y-2">
      <p id="tolerance-threshold-label" className="text-sm font-medium">
        Tolerance threshold
      </p>
      <Slider
        aria-labelledby="tolerance-threshold-label"
        defaultValue={[40]}
        max={100}
        min={0}
        step={5}
      />
    </div>
  );
}
`;
