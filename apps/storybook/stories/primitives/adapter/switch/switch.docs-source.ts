export const switchRecommendedUsageCode = `import { Label } from "@fodmapp/ui/label";
import { Switch } from "@fodmapp/ui/switch";

export function Example() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor="daily-reminders">Daily reminders</Label>
      <Switch id="daily-reminders" />
    </div>
  );
}
`;
