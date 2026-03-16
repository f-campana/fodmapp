export const popoverRecommendedUsageCode = `import {
  Button,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@fodmapp/ui";

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
