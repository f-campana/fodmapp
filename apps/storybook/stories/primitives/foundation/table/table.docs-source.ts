export const tableRecommendedUsageCode = `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fodmapp/ui/table";

export function Example() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Current food</TableHead>
          <TableHead>Suggested swap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Greek yogurt</TableCell>
          <TableCell>Coconut yogurt</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
`;
