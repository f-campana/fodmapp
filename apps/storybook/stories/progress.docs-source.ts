export const progressRecommendedUsageCode = `import { Progress } from "@fodmap/ui/progress";

export function Example() {
  return (
    <div className="grid gap-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-foreground">
            Meal plan import
          </div>
          <div className="text-sm text-muted-foreground">
            Syncing substitutions and tolerance notes.
          </div>
        </div>
        <div className="text-sm font-medium text-foreground">42%</div>
      </div>
      <Progress aria-label="Import progress" value={42} />
    </div>
  );
}
`;
