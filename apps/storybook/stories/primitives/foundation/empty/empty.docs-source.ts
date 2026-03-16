export const emptyRecommendedUsageCode = `import { Empty, EmptyActions, EmptyDescription, EmptyTitle } from "@fodmap/ui/empty";

export function Example() {
  return (
    <Empty>
      <EmptyTitle>No saved meals yet</EmptyTitle>
      <EmptyDescription>
        Add a first plan so the dashboard has something to show.
      </EmptyDescription>
      <EmptyActions>{/* buttons or links */}</EmptyActions>
    </Empty>
  );
}
`;
