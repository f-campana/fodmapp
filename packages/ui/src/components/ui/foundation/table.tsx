import * as React from "react";

import { cn } from "../../../lib/cn";

export type TableProps = React.ComponentProps<"table">;

function Table({ className, ...props }: TableProps) {
  return (
    <div
      data-slot="table"
      className="relative w-full overflow-x-auto"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the scroll wrapper must be keyboard focusable for accessible horizontal scrolling
      tabIndex={0}
    >
      <table
        {...props}
        className={cn("min-w-full caption-bottom text-sm", className)}
      />
    </div>
  );
}

export type TableHeaderProps = React.ComponentProps<"thead">;

function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead
      {...props}
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
    />
  );
}

export type TableBodyProps = React.ComponentProps<"tbody">;

function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      {...props}
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
    />
  );
}

export type TableFooterProps = React.ComponentProps<"tfoot">;

function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      {...props}
      data-slot="table-footer"
      className={cn(
        "border-t border-border bg-muted font-medium [&>tr]:last:border-b-0",
        className,
      )}
    />
  );
}

export type TableRowProps = React.ComponentProps<"tr">;

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      {...props}
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted data-[state=selected]:bg-muted",
        className,
      )}
    />
  );
}

export type TableHeadProps = React.ComponentProps<"th">;

function TableHead({ className, scope = "col", ...props }: TableHeadProps) {
  return (
    <th
      {...props}
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium text-muted-foreground",
        className,
      )}
      scope={scope}
    />
  );
}

export type TableCellProps = React.ComponentProps<"td">;

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      {...props}
      data-slot="table-cell"
      className={cn("p-2 align-middle", className)}
    />
  );
}

export type TableCaptionProps = React.ComponentProps<"caption">;

function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      {...props}
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
