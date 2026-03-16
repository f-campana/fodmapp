export const radioGroupRecommendedUsageCode = `import {
  Label,
  RadioGroup,
  RadioGroupItem,
} from "@fodmapp/ui";

export function Example() {
  return (
    <RadioGroup aria-label="Niveau de flexibilité recommandé" defaultValue="gentle">
      <div className="flex items-start gap-3">
        <RadioGroupItem id="radio-gentle" value="gentle" />
        <Label htmlFor="radio-gentle">Tolérance prudente</Label>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem id="radio-balanced" value="balanced" />
        <Label htmlFor="radio-balanced">Tolérance intermédiaire</Label>
      </div>
    </RadioGroup>
  );
}
`;
