export const collapsibleRecommendedUsageCode = `import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@fodmap/ui";

export function Example() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Repères de préparation</CollapsibleTrigger>
      <CollapsibleContent>
        Gardez un seul bloc d'aide optionnelle au plus près de l'action qu'il accompagne.
      </CollapsibleContent>
    </Collapsible>
  );
}
`;
