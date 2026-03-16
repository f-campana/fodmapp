export const itemRecommendedUsageCode = `import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@fodmapp/ui/item";

export function Example() {
  return (
    <Item>
      <ItemContent>
        <ItemHeader>
          <ItemTitle>Cooked quinoa</ItemTitle>
          <ItemActions>120 g</ItemActions>
        </ItemHeader>
        <ItemDescription>
          Portion guidance for a prepared grain base.
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
`;
