export const cardRecommendedUsageCode = `import { Badge } from "@fodmap/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@fodmap/ui/card";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Swap review summary</CardTitle>
          <CardDescription>
            Keep the high-level summary in the header.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline">Ready</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>{/* summary content */}</CardContent>
      <CardFooter>{/* supporting metadata */}</CardFooter>
    </Card>
  );
}
`;
