export const hoverCardRecommendedUsageCode = `import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "@fodmapp/ui";

export function Example() {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <button
          className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
          type="button"
        >
          View food card
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="grid gap-3">
          <div className="text-sm font-semibold text-foreground">
            Roasted vegetable bowl
          </div>
          <div className="text-sm text-muted-foreground">
            Stage the tolerated garnish and portion note together.
          </div>
        </div>
        <HoverCardArrow />
      </HoverCardContent>
    </HoverCard>
  );
}
`;
