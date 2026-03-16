export const toggleGroupRecommendedUsageCode = `import {
  ToggleGroup,
  ToggleGroupItem,
} from "@fodmapp/ui";

export function Example() {
  return (
    <ToggleGroup aria-label="Symptom threshold" type="single">
      <ToggleGroupItem value="low">Low</ToggleGroupItem>
      <ToggleGroupItem value="moderate">Moderate</ToggleGroupItem>
      <ToggleGroupItem value="high">High</ToggleGroupItem>
    </ToggleGroup>
  );
}
`;
