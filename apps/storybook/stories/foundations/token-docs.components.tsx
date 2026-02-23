import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import "./token-docs.css";

type ColumnValueMode = "pill" | "wrap" | "plain";

export interface TokenGridColumn<Row> {
  key: string;
  label: string;
  mobileLabel?: string;
  width?: string;
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
  mobileMode?: "reflow" | "table";
}

function classNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function valueModeForColumn<Row>(column: TokenGridColumn<Row>): ColumnValueMode {
  return column.valueMode ?? "plain";
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
      // Fall through to deterministic fallback.
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

export function TokenDataGrid<Row extends TokenGridRowBase>({
  gridLabel,
  columns,
  groups,
  mobileMode = "reflow",
}: TokenDataGridProps<Row>) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, !group.defaultCollapsed])),
  );

  useEffect(() => {
    setExpandedGroups((state) => {
      const next: Record<string, boolean> = {};
      for (const group of groups) {
        next[group.id] = state[group.id] ?? !group.defaultCollapsed;
      }
      return next;
    });
  }, [groups]);

  const gridTemplateColumns = columns
    .map((column) => column.width ?? "minmax(220px, 1fr)")
    .join(" ");

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
              {copyValue ? <CopyButton text={copyValue} label={`${column.label} ${row.path}`} /> : null}
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
                <div key={`${row.id}:${column.key}:mobile`} className="fd-tokendocs-mobileField">
                  <span className="fd-tokendocs-mobileKey">{column.mobileLabel ?? column.label}</span>
                  <div className="fd-tokendocs-mobileValue">
                    <div
                      className={classNames(
                        "fd-tokendocs-mobileValueBody",
                        valueMode === "wrap" && "is-wrap",
                      )}
                    >
                      {renderCellValue(column, row)}
                    </div>
                    {copyValue ? <CopyButton text={copyValue} label={`${column.label} ${row.path}`} /> : null}
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
      <div className="fd-tokendocs-groups">
        {groups.map((group) => {
          const expanded = expandedGroups[group.id] ?? true;
          const groupSectionId = `${gridLabel}-${group.id}`;
          const contentId = `${groupSectionId}-rows`;

          return (
            <section key={group.id} id={groupSectionId} className="fd-tokendocs-group">
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
                    <span className="fd-tokendocs-groupDescription">{group.description}</span>
                  ) : null}
                </span>
                <span className="fd-tokendocs-groupCount">{group.rows.length} rows</span>
              </button>

              {expanded ? (
                <div id={contentId} className="fd-tokendocs-groupPanel">
                  {group.rows.length === 0 ? (
                    <p className="fd-tokendocs-empty">No rows available.</p>
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
                              {columns.map((column) => (
                                <div
                                  key={`${group.id}:${column.key}`}
                                  role="columnheader"
                                  className={classNames(
                                    "fd-tokendocs-headCell",
                                    column.align === "right" ? "is-right" : "is-left",
                                  )}
                                >
                                  <span>{column.label}</span>
                                </div>
                              ))}
                            </div>
                            <div role="rowgroup">{group.rows.map((row) => renderDesktopRow(row))}</div>
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
