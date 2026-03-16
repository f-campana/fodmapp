export const switchRecommendedUsageCode = `import { Label } from "@fodmap/ui/label";
import { Switch } from "@fodmap/ui/switch";

export function Example() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor="daily-reminders">Daily reminders</Label>
      <Switch id="daily-reminders" />
    </div>
  );
}
`;
