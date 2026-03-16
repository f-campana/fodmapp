export const tooltipRecommendedUsageCode = `import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@fodmapp/ui";

export function Example() {
  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Check portion note
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Keep the garnish portion measured before serving.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
`;
