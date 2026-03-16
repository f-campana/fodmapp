export const scrollAreaRecommendedUsageCode = `import { ScrollArea } from "@fodmapp/ui/scroll-area";

export function Example() {
  return (
    <ScrollArea className="h-72 w-full rounded-(--radius) border border-border bg-background p-3">
      <div className="space-y-2 pr-2">
        <div className="rounded-(--radius-sm) border border-border bg-card px-3 py-3 text-sm">
          Breakfast prep notes
        </div>
        <div className="rounded-(--radius-sm) border border-border bg-card px-3 py-3 text-sm">
          Lunch substitutions
        </div>
        <div className="rounded-(--radius-sm) border border-border bg-card px-3 py-3 text-sm">
          Dinner freezer labels
        </div>
      </div>
    </ScrollArea>
  );
}
`;
