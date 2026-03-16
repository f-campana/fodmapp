export const popoverRecommendedUsageCode = `import { Button } from "@fodmap/ui/button";
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from "@fodmap/ui/popover";

export function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Afficher les details</Button>
      </PopoverTrigger>
      <PopoverContent>
        Portion recommandee : 120 g maximum.
        <PopoverArrow />
      </PopoverContent>
    </Popover>
  );
}
`;
