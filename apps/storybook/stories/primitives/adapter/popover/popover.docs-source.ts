export const popoverRecommendedUsageCode = `import { Button } from "@fodmapp/ui/button";
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from "@fodmapp/ui/popover";

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
