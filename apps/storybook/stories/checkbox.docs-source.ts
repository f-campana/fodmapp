export const checkboxRecommendedUsageCode = `import { Checkbox, Label } from "@fodmap/ui";

export function Example() {
  return (
    <div className="flex items-start gap-3">
      <Checkbox aria-label="Enregistrer dans mon plan" id="meal-plan" />
      <div className="space-y-1">
        <Label htmlFor="meal-plan">Enregistrer dans mon plan</Label>
        <p className="text-sm text-muted-foreground">
          Gardez cette substitution visible lors de vos prochains repas.
        </p>
      </div>
    </div>
  );
}
`;
