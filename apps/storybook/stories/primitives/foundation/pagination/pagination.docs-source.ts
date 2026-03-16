export const paginationRecommendedUsageCode = `import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@fodmap/ui/pagination";

export function ResultsPagination() {
  return (
    <Pagination aria-label="Pagination resultats">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="/results?page=3" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="/results?page=3">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="/results?page=4" isActive>
            4
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="/results?page=5" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}`;
