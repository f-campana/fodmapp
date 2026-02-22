import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { compareValueText, naturalTokenPathCompare } from "./token-docs.helpers";

type SortDirection = "asc" | "desc";

export interface TokenGridColumn<Row> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: "left" | "right";
  getValue: (row: Row) => string;
  render?: (row: Row) => ReactNode;
  copyValue?: (row: Row) => string | null;
}

export interface TokenGridGroup<Row> {
  id: string;
  label: string;
  description?: string;
  rows: Row[];
  defaultCollapsed?: boolean;
}

export interface TokenGridRowBase {
  id: string;
  path: string;
  searchText?: string;
}

interface TokenDataGridProps<Row extends TokenGridRowBase> {
  gridLabel: string;
  columns: TokenGridColumn<Row>[];
  groups: TokenGridGroup<Row>[];
  searchPlaceholder?: string;
  virtualizationThreshold?: number;
  rowHeight?: number;
}

function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to deterministic non-permission fallback.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    const ok = await copyText(text);
    setStatus(ok ? "copied" : "error");
    window.setTimeout(() => setStatus("idle"), 1200);
  }

  const display = status === "idle" ? "Copy" : status === "copied" ? "Copied" : "Error";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={classNames(
        "rounded border px-2 py-0.5 text-[10px] font-medium transition-colors",
        status === "copied" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
      )}
      aria-label={`Copy ${label}`}
    >
      {display}
    </button>
  );
}

function getAriaSort(active: boolean, direction: SortDirection): "ascending" | "descending" | "none" {
  if (!active) {
    return "none";
  }

  return direction === "asc" ? "ascending" : "descending";
}

export function TokenDocsPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="font-sans">
      <div className="mx-auto w-full max-w-[1120px] space-y-6 px-6 py-6 text-foreground">
        <header className="space-y-2 border-b border-border pb-4">
          <h1 className="font-sans text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-4xl text-sm text-muted-foreground">{subtitle}</p>
        </header>
        {children}
      </div>
    </main>
  );
}

export function TokenSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-background p-4">
      <div className="space-y-1">
        <h2 className="font-sans text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function TokenValuePill({ value }: { value: string }) {
  return (
    <code className="inline-flex max-w-full items-center rounded bg-surface-muted px-2 py-0.5 font-mono text-xs text-foreground" title={value}>
      <span className="truncate">{value}</span>
    </code>
  );
}

export function ColorValueCell({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-4 w-6 rounded border border-border" style={{ backgroundColor: value }} aria-hidden="true" />
      <TokenValuePill value={value} />
    </div>
  );
}

export function ScaleBarCell({ value, widthPx }: { value: string; widthPx: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block h-2 rounded bg-muted-foreground/30" style={{ width: `${Math.max(4, widthPx)}px` }} aria-hidden="true" />
      <TokenValuePill value={value} />
    </div>
  );
}

export function TokenDataGrid<Row extends TokenGridRowBase>({
  gridLabel,
  columns,
  groups,
  searchPlaceholder = "Search token path or value",
  virtualizationThreshold = 24,
  rowHeight = 44,
}: TokenDataGridProps<Row>) {
  const sortableColumns = columns.filter((column) => column.sortable !== false);
  const initialSortKey = sortableColumns[0]?.key ?? columns[0]?.key ?? "path";

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(groups.map((group) => [group.id, !group.defaultCollapsed]))
  );
  const [groupScrollTop, setGroupScrollTop] = useState<Record<string, number>>({});

  const activeSortColumn = columns.find((column) => column.key === sortKey);
  const normalizedQuery = query.trim().toLowerCase();

  const processedGroups = useMemo(() => {
    return groups.map((group) => {
      const filteredRows =
        normalizedQuery.length === 0
          ? group.rows
          : group.rows.filter((row) => {
              const values = columns.map((column) => column.getValue(row));
              const haystack = [row.path, ...values, row.searchText ?? ""].join(" ").toLowerCase();
              return haystack.includes(normalizedQuery);
            });

      const sortedRows = [...filteredRows].sort((left, right) => {
        if (!activeSortColumn) {
          return naturalTokenPathCompare(left.path, right.path);
        }

        const leftValue = activeSortColumn.getValue(left);
        const rightValue = activeSortColumn.getValue(right);
        const compare =
          activeSortColumn.key === "path"
            ? naturalTokenPathCompare(leftValue, rightValue)
            : compareValueText(leftValue, rightValue);
        return sortDirection === "asc" ? compare : -compare;
      });

      return {
        ...group,
        rows: sortedRows,
      };
    });
  }, [activeSortColumn, columns, groups, normalizedQuery, sortDirection]);

  const visibleCount = processedGroups.reduce((count, group) => count + group.rows.length, 0);
  const totalCount = groups.reduce((count, group) => count + group.rows.length, 0);

  const gridTemplateColumns = columns.map((column) => column.width ?? "minmax(220px, 1fr)").join(" ");

  function toggleSort(columnKey: string) {
    if (sortKey === columnKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((state) => ({
      ...state,
      [groupId]: !state[groupId],
    }));
  }

  function renderRow(row: Row) {
    return (
      <div
        key={row.id}
        role="row"
        className="grid h-11 items-center border-b border-border px-3 text-xs last:border-b-0"
        style={{ gridTemplateColumns }}
      >
        {columns.map((column) => {
          const raw = column.getValue(row);
          const copyValue = column.copyValue ? column.copyValue(row) : raw;

          return (
            <div
              key={`${row.id}:${column.key}`}
              role="cell"
              className={classNames(
                "flex min-w-0 items-center gap-2",
                column.align === "right" ? "justify-end text-right" : "justify-start text-left"
              )}
            >
              <div className="min-w-0 truncate">{column.render ? column.render(row) : <TokenValuePill value={raw} />}</div>
              {copyValue ? <CopyButton text={copyValue} label={`${column.label} ${row.path}`} /> : null}
            </div>
          );
        })}
      </div>
    );
  }

  function renderVirtualizedRows(groupId: string, rows: Row[]) {
    if (rows.length <= virtualizationThreshold) {
      return rows.map((row) => renderRow(row));
    }

    const scrollTop = groupScrollTop[groupId] ?? 0;
    const viewportHeight = 420;
    const overscan = 8;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRows = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
    const endIndex = Math.min(rows.length, startIndex + visibleRows);
    const topPadding = startIndex * rowHeight;
    const bottomPadding = Math.max(0, (rows.length - endIndex) * rowHeight);

    return (
      <div role="rowgroup">
        <div style={{ height: `${topPadding}px` }} aria-hidden="true" />
        {rows.slice(startIndex, endIndex).map((row) => renderRow(row))}
        <div style={{ height: `${bottomPadding}px` }} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <label htmlFor={`${gridLabel}-search`} className="mb-1 block text-xs font-semibold text-foreground">
            Search
          </label>
          <input
            id={`${gridLabel}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {visibleCount} / {totalCount} rows
        </p>
      </div>

      <div className="space-y-3">
        {processedGroups.map((group) => {
          const expanded = expandedGroups[group.id] ?? true;
          const contentId = `${gridLabel}-${group.id}-rows`;

          return (
            <section key={group.id} className="rounded border border-border bg-background">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-muted"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={expanded}
                aria-controls={contentId}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{group.label}</span>
                  {group.description ? <span className="block text-xs text-muted-foreground">{group.description}</span> : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{group.rows.length} rows</span>
              </button>

              {expanded ? (
                <div id={contentId} className="border-t border-border">
                  {group.rows.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">No matching rows for current filter.</p>
                  ) : (
                    <div
                      className="max-h-[420px] overflow-auto"
                      onScroll={(event) =>
                        setGroupScrollTop((state) => ({
                          ...state,
                          [group.id]: event.currentTarget.scrollTop,
                        }))
                      }
                    >
                      <div role="table" aria-label={`${gridLabel} ${group.label}`} className="min-w-[860px]">
                        <div role="row" className="sticky top-0 z-10 grid border-b border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-foreground" style={{ gridTemplateColumns }}>
                          {columns.map((column) => {
                            const active = column.key === sortKey;
                            const ariaSort = getAriaSort(active, sortDirection);
                            return (
                              <div
                                key={`${group.id}:${column.key}`}
                                role="columnheader"
                                aria-sort={ariaSort}
                                className={classNames(column.align === "right" ? "text-right" : "text-left")}
                              >
                                {column.sortable === false ? (
                                  <span>{column.label}</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-left hover:text-primary"
                                    onClick={() => toggleSort(column.key)}
                                  >
                                    <span>{column.label}</span>
                                    {active ? <span aria-hidden="true">{sortDirection === "asc" ? "↑" : "↓"}</span> : null}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {renderVirtualizedRows(group.id, group.rows)}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="space-y-1 rounded border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-mono text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </article>
  );
}

