import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  compareValueText,
  naturalTokenPathCompare,
  normalizeFilterQuery,
  normalizeSearchText,
  type TokenSortDirection,
  type TokenSortOption,
} from "./token-docs.helpers";
import "./token-docs.css";

type ColumnValueMode = "pill" | "wrap" | "plain";

export interface TokenGridColumn<Row> {
  key: string;
  label: string;
  mobileLabel?: string;
  width?: string;
  sortable?: boolean;
  align?: "left" | "right";
  valueMode?: ColumnValueMode;
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
  searchLabel?: string;
  virtualizationThreshold?: number;
  rowHeight?: number;
  mobileMode?: "reflow" | "table";
  virtualizationMode?: "auto" | "fixed" | "off";
  showToolbar?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  sortOptions?: TokenSortOption[];
  sortKey?: string;
  onSortKeyChange?: (sortKey: string) => void;
  sortDirection?: TokenSortDirection;
  onSortDirectionChange?: (direction: TokenSortDirection) => void;
}

interface TokenDocsToolbarProps {
  idPrefix: string;
  query: string;
  onQueryChange: (query: string) => void;
  sortOptions: TokenSortOption[];
  sortKey: string;
  onSortKeyChange: (sortKey: string) => void;
  sortDirection: TokenSortDirection;
  onSortDirectionChange: (direction: TokenSortDirection) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  visibleCount?: number;
  totalCount?: number;
  className?: string;
}

function classNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function getAriaSort(
  active: boolean,
  direction: TokenSortDirection,
): "ascending" | "descending" | "none" {
  if (!active) {
    return "none";
  }

  return direction === "asc" ? "ascending" : "descending";
}

function valueModeForColumn<Row>(
  column: TokenGridColumn<Row>,
): ColumnValueMode {
  return column.valueMode ?? "pill";
}

function renderValueByMode(value: string, mode: ColumnValueMode): ReactNode {
  if (mode === "wrap") {
    return <code className="fd-tokendocs-value-wrap">{value}</code>;
  }

  if (mode === "plain") {
    return <span className="fd-tokendocs-value-plain">{value}</span>;
  }

  return <TokenValuePill value={value} />;
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

  const display =
    status === "idle" ? "Copy" : status === "copied" ? "Copied" : "Error";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="fd-tokendocs-copy"
      aria-label={`Copy ${label}`}
      data-state={status}
    >
      {display}
    </button>
  );
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
    <main className="fd-tokendocs-page">
      <div className="fd-tokendocs-container">
        <header className="fd-tokendocs-header">
          <h1 className="fd-tokendocs-title">{title}</h1>
          <p className="fd-tokendocs-subtitle">{subtitle}</p>
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
    <section className="fd-tokendocs-section">
      <div className="fd-tokendocs-sectionHeader">
        <h2 className="fd-tokendocs-sectionTitle">{title}</h2>
        <p className="fd-tokendocs-sectionDescription">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function TokenDocsToolbar({
  idPrefix,
  query,
  onQueryChange,
  sortOptions,
  sortKey,
  onSortKeyChange,
  sortDirection,
  onSortDirectionChange,
  searchPlaceholder = "Search token path or value",
  searchLabel = "Search tokens",
  visibleCount,
  totalCount,
  className,
}: TokenDocsToolbarProps) {
  const hasRowSummary =
    typeof visibleCount === "number" && typeof totalCount === "number";

  return (
    <div className={classNames("fd-tokendocs-toolbar", className)}>
      <div className="fd-tokendocs-toolbarTop">
        <div className="fd-tokendocs-field">
          <label htmlFor={`${idPrefix}-search`} className="fd-tokendocs-fieldLabel">
            Search
          </label>
          <input
            id={`${idPrefix}-search`}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder={searchPlaceholder}
            className="fd-tokendocs-input"
            aria-label={searchLabel}
          />
        </div>
        <div className="fd-tokendocs-sortControls">
          <div className="fd-tokendocs-field">
            <label htmlFor={`${idPrefix}-sort`} className="fd-tokendocs-fieldLabel">
              Sort By
            </label>
            <select
              id={`${idPrefix}-sort`}
              className="fd-tokendocs-select"
              value={sortKey}
              onChange={(event) => onSortKeyChange(event.currentTarget.value)}
              disabled={sortOptions.length === 0}
            >
              {sortOptions.map((option) => (
                <option key={`${idPrefix}-sort-${option.key}`} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="fd-tokendocs-field">
            <label htmlFor={`${idPrefix}-direction`} className="fd-tokendocs-fieldLabel">
              Direction
            </label>
            <button
              id={`${idPrefix}-direction`}
              type="button"
              className="fd-tokendocs-button"
              onClick={() =>
                onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")
              }
            >
              {sortDirection === "asc" ? "Ascending" : "Descending"}
            </button>
          </div>
        </div>
      </div>
      {hasRowSummary ? (
        <p className="fd-tokendocs-count">
          {visibleCount} / {totalCount} rows
        </p>
      ) : null}
    </div>
  );
}

export function TokenPathText({ value }: { value: string }) {
  return <code className="fd-tokendocs-path">{value}</code>;
}

export function TokenValuePill({ value }: { value: string }) {
  return (
    <code className="fd-tokendocs-value-pill" title={value}>
      {value}
    </code>
  );
}

export function ColorValueCell({ value }: { value: string }) {
  return (
    <div className="fd-tokendocs-colorCell">
      <span
        className="fd-tokendocs-swatch"
        style={{ backgroundColor: value }}
        aria-hidden="true"
      />
      <TokenValuePill value={value} />
    </div>
  );
}

export function ScaleBarCell({
  value,
  widthPx,
}: {
  value: string;
  widthPx: number;
}) {
  return (
    <div className="fd-tokendocs-scaleCell">
      <span
        className="fd-tokendocs-scaleBar"
        style={{ width: `${Math.max(4, widthPx)}px` }}
        aria-hidden="true"
      />
      <TokenValuePill value={value} />
    </div>
  );
}

export function TokenDataGrid<Row extends TokenGridRowBase>({
  gridLabel,
  columns,
  groups,
  searchPlaceholder = "Search token path or value",
  searchLabel = "Search tokens",
  mobileMode = "reflow",
  showToolbar = true,
  query,
  onQueryChange,
  sortOptions,
  sortKey,
  onSortKeyChange,
  sortDirection,
  onSortDirectionChange,
}: TokenDataGridProps<Row>) {
  const sortableColumns = columns.filter((column) => column.sortable !== false);
  const defaultSortOptions: TokenSortOption[] = sortableColumns.map((column) => ({
    key: column.key,
    label: column.label,
  }));
  const availableSortOptions =
    sortOptions && sortOptions.length > 0 ? sortOptions : defaultSortOptions;

  const initialSortKey = availableSortOptions[0]?.key ?? columns[0]?.key ?? "path";

  const isQueryControlled = query !== undefined;
  const isSortKeyControlled = sortKey !== undefined;
  const isSortDirectionControlled = sortDirection !== undefined;
  const usesExternalControls =
    isQueryControlled ||
    isSortKeyControlled ||
    isSortDirectionControlled ||
    onQueryChange !== undefined ||
    onSortKeyChange !== undefined ||
    onSortDirectionChange !== undefined;

  const [localQuery, setLocalQuery] = useState("");
  const [localSortKey, setLocalSortKey] = useState(initialSortKey);
  const [localSortDirection, setLocalSortDirection] =
    useState<TokenSortDirection>("asc");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        groups.map((group) => [group.id, !group.defaultCollapsed]),
      ),
  );

  const queryValue = isQueryControlled ? query ?? "" : localQuery;
  const sortKeyValue = isSortKeyControlled ? sortKey ?? initialSortKey : localSortKey;
  const sortDirectionValue = isSortDirectionControlled
    ? sortDirection ?? "asc"
    : localSortDirection;

  const setQueryValue = isQueryControlled
    ? (onQueryChange ?? (() => {}))
    : setLocalQuery;
  const setSortKeyValue = isSortKeyControlled
    ? (onSortKeyChange ?? (() => {}))
    : setLocalSortKey;
  const setSortDirectionValue = isSortDirectionControlled
    ? (onSortDirectionChange ?? (() => {}))
    : setLocalSortDirection;

  useEffect(() => {
    if (sortKey !== undefined) {
      return;
    }

    const hasSortKey = availableSortOptions.some(
      (option) => option.key === localSortKey,
    );
    if (!hasSortKey) {
      setLocalSortKey(initialSortKey);
    }
  }, [availableSortOptions, initialSortKey, localSortKey, sortKey]);

  useEffect(() => {
    setExpandedGroups((state) => {
      const next: Record<string, boolean> = {};
      for (const group of groups) {
        next[group.id] = state[group.id] ?? !group.defaultCollapsed;
      }
      return next;
    });
  }, [groups]);

  const allowedSortKeys = useMemo(
    () => new Set(availableSortOptions.map((option) => option.key)),
    [availableSortOptions],
  );

  const activeSortColumn = columns.find((column) => column.key === sortKeyValue);
  const normalizedQuery = normalizeFilterQuery(queryValue);
  const shouldRenderToolbar = showToolbar && !usesExternalControls;

  const processedGroups = useMemo(() => {
    return groups.map((group) => {
      const filteredRows =
        normalizedQuery.length === 0
          ? group.rows
          : group.rows.filter((row) => {
              const values = columns.map((column) => column.getValue(row));
              const haystack = normalizeSearchText(
                row.path,
                ...values,
                row.searchText ?? "",
              );
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
        return sortDirectionValue === "asc" ? compare : -compare;
      });

      return {
        ...group,
        rows: sortedRows,
      };
    });
  }, [
    activeSortColumn,
    columns,
    groups,
    normalizedQuery,
    sortDirectionValue,
  ]);

  const visibleCount = processedGroups.reduce(
    (count, group) => count + group.rows.length,
    0,
  );
  const totalCount = groups.reduce(
    (count, group) => count + group.rows.length,
    0,
  );

  const gridTemplateColumns = columns
    .map((column) => column.width ?? "minmax(220px, 1fr)")
    .join(" ");

  function toggleSort(columnKey: string) {
    if (!allowedSortKeys.has(columnKey)) {
      return;
    }

    if (sortKeyValue === columnKey) {
      setSortDirectionValue(sortDirectionValue === "asc" ? "desc" : "asc");
      return;
    }

    setSortKeyValue(columnKey);
    setSortDirectionValue("asc");
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((state) => ({
      ...state,
      [groupId]: !state[groupId],
    }));
  }

  function renderCellValue(column: TokenGridColumn<Row>, row: Row): ReactNode {
    const raw = column.getValue(row);

    if (column.render) {
      return column.render(row);
    }

    return renderValueByMode(raw, valueModeForColumn(column));
  }

  function renderDesktopRow(row: Row) {
    return (
      <div
        key={row.id}
        role="row"
        className="fd-tokendocs-row"
        style={{
          gridTemplateColumns,
        }}
      >
        {columns.map((column) => {
          const raw = column.getValue(row);
          const copyValue = column.copyValue ? column.copyValue(row) : raw;
          const valueMode = valueModeForColumn(column);

          return (
            <div
              key={`${row.id}:${column.key}`}
              role="cell"
              className={classNames(
                "fd-tokendocs-cell",
                column.align === "right" ? "is-right" : "is-left",
              )}
            >
              <div
                className={classNames(
                  "fd-tokendocs-cellBody",
                  valueMode === "wrap" && "is-wrap",
                )}
              >
                {renderCellValue(column, row)}
              </div>
              {copyValue ? (
                <CopyButton text={copyValue} label={`${column.label} ${row.path}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  function renderMobileRows(rows: Row[]) {
    if (mobileMode !== "reflow") {
      return null;
    }

    return (
      <div className="fd-tokendocs-mobileList" role="list">
        {rows.map((row) => (
          <article key={row.id} className="fd-tokendocs-mobileRow" role="listitem">
            {columns.map((column) => {
              const raw = column.getValue(row);
              const copyValue = column.copyValue ? column.copyValue(row) : raw;
              const valueMode = valueModeForColumn(column);

              return (
                <div
                  key={`${row.id}:${column.key}:mobile`}
                  className="fd-tokendocs-mobileField"
                >
                  <span className="fd-tokendocs-mobileKey">
                    {column.mobileLabel ?? column.label}
                  </span>
                  <div className="fd-tokendocs-mobileValue">
                    <div
                      className={classNames(
                        "fd-tokendocs-mobileValueBody",
                        valueMode === "wrap" && "is-wrap",
                      )}
                    >
                      {renderCellValue(column, row)}
                    </div>
                    {copyValue ? (
                      <CopyButton text={copyValue} label={`${column.label} ${row.path}`} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="fd-tokendocs-grid">
      {shouldRenderToolbar ? (
        <TokenDocsToolbar
          idPrefix={gridLabel}
          query={queryValue}
          onQueryChange={setQueryValue}
          sortOptions={availableSortOptions}
          sortKey={sortKeyValue}
          onSortKeyChange={setSortKeyValue}
          sortDirection={sortDirectionValue}
          onSortDirectionChange={setSortDirectionValue}
          searchPlaceholder={searchPlaceholder}
          searchLabel={searchLabel}
          visibleCount={visibleCount}
          totalCount={totalCount}
        />
      ) : null}

      <div className="fd-tokendocs-groups">
        {processedGroups.map((group) => {
          const expanded = expandedGroups[group.id] ?? true;
          const contentId = `${gridLabel}-${group.id}-rows`;

          return (
            <section key={group.id} className="fd-tokendocs-group">
              <button
                type="button"
                className="fd-tokendocs-groupToggle"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={expanded}
                aria-controls={contentId}
              >
                <span>
                  <span className="fd-tokendocs-groupLabel">{group.label}</span>
                  {group.description ? (
                    <span className="fd-tokendocs-groupDescription">
                      {group.description}
                    </span>
                  ) : null}
                </span>
                <span className="fd-tokendocs-groupCount">{group.rows.length} rows</span>
              </button>

              {expanded ? (
                <div id={contentId} className="fd-tokendocs-groupPanel">
                  {group.rows.length === 0 ? (
                    <p className="fd-tokendocs-empty">
                      No matching rows for current filter.
                    </p>
                  ) : (
                    <>
                      <div className="fd-tokendocs-desktop">
                        <div className="fd-tokendocs-tableScroll">
                          <div
                            role="table"
                            aria-label={`${gridLabel} ${group.label}`}
                            className="fd-tokendocs-table"
                          >
                            <div
                              role="row"
                              className="fd-tokendocs-headRow"
                              style={{ gridTemplateColumns }}
                            >
                              {columns.map((column) => {
                                const active = column.key === sortKeyValue;
                                const ariaSort = getAriaSort(active, sortDirectionValue);
                                const canSort =
                                  column.sortable !== false &&
                                  allowedSortKeys.has(column.key);

                                return (
                                  <div
                                    key={`${group.id}:${column.key}`}
                                    role="columnheader"
                                    aria-sort={ariaSort}
                                    className={classNames(
                                      "fd-tokendocs-headCell",
                                      column.align === "right" ? "is-right" : "is-left",
                                    )}
                                  >
                                    {canSort ? (
                                      <button
                                        type="button"
                                        className="fd-tokendocs-sortButton"
                                        onClick={() => toggleSort(column.key)}
                                      >
                                        <span>{column.label}</span>
                                        {active ? (
                                          <span aria-hidden="true">
                                            {sortDirectionValue === "asc" ? "↑" : "↓"}
                                          </span>
                                        ) : null}
                                      </button>
                                    ) : (
                                      <span>{column.label}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div role="rowgroup">
                              {group.rows.map((row) => renderDesktopRow(row))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="fd-tokendocs-mobile">{renderMobileRows(group.rows)}</div>
                    </>
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

export function ReferenceTables({
  title = "Reference Tables",
  hint = "Expand for exact token path/value lookup.",
  children,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <details className="fd-tokendocs-reference">
      <summary className="fd-tokendocs-referenceSummary">
        <span className="fd-tokendocs-referenceTitle">{title}</span>
        <span className="fd-tokendocs-referenceHint">{hint}</span>
      </summary>
      <div className="fd-tokendocs-referenceBody">{children}</div>
    </details>
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
    <article className="fd-tokendocs-metricCard">
      <p className="fd-tokendocs-metricLabel">{label}</p>
      <p className="fd-tokendocs-metricValue">{value}</p>
      <p className="fd-tokendocs-metricDescription">{description}</p>
    </article>
  );
}
