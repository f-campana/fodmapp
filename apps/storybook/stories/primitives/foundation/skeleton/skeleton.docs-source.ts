export const skeletonRecommendedUsageCode = `import { Skeleton } from "@fodmapp/ui/skeleton";

export function Example() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-full max-w-xs" />
      <Skeleton className="h-4 w-full max-w-sm" />
    </div>
  );
}
`;
