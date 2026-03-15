export const buttonRecommendedUsageCode = `import { Button } from "@fodmap/ui";

export function Example() {
  return (
    <Button type="submit">
      Save changes
    </Button>
  );
}
`;

export const buttonAsChildUsageCode = `import { Button } from "@fodmap/ui";

export function Example() {
  return (
    <Button asChild variant="outline">
      <a href="/substitutions/review">Open review packet</a>
    </Button>
  );
}
`;
