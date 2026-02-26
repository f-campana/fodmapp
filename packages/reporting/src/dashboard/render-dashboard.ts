import { buildFigureModels } from "../models/build-figure-models";
import type { ReportingRun } from "../contracts";

export interface DashboardRenderOptions {
  title?: string;
  subtitle?: string;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fmt(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}`;
  }
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export const REPORTING_THEME_CSS = `
.fd-reporting-root{--fd-reporting-color-canvas:var(--fd-semantic-color-background-canvas,#f8fafc);--fd-reporting-color-surface:var(--fd-semantic-color-surface-default,#fff);--fd-reporting-color-surface-muted:var(--fd-semantic-color-surface-muted,#f1f5f9);--fd-reporting-color-border:var(--fd-semantic-color-border-default,#cbd5e1);--fd-reporting-color-border-subtle:var(--fd-semantic-color-border-subtle,#e2e8f0);--fd-reporting-color-text:var(--fd-semantic-color-text-primary,#0f172a);--fd-reporting-color-text-muted:var(--fd-semantic-color-text-muted,#475569);--fd-reporting-color-success-bg:var(--fd-semantic-color-status-success-bg,#10b981);--fd-reporting-color-success-fg:var(--fd-semantic-color-status-success-fg,#f0fdf4);--fd-reporting-color-danger-bg:var(--fd-semantic-color-status-danger-bg,#ef4444);--fd-reporting-color-danger-fg:var(--fd-semantic-color-status-danger-fg,#fef2f2);font-family:var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);color:var(--fd-reporting-color-text);background:var(--fd-reporting-color-canvas);padding:var(--fd-base-space-6,1.5rem);border-radius:var(--fd-semantic-radius-container,1rem);}
.fd-reporting-header{display:flex;justify-content:space-between;gap:var(--fd-base-space-4,1rem);align-items:flex-start;margin-bottom:var(--fd-base-space-5,1.25rem);}
.fd-reporting-title{margin:0;color:var(--fd-reporting-color-text);font:var(--fd-base-typography-font-weight-bold,700) var(--fd-base-typography-font-size-3xl,1.875rem)/var(--fd-base-typography-line-height-tight,1.2) var(--fd-semantic-typography-font-family-display,'Cormorant Garamond',serif);}
.fd-reporting-subtitle{margin:var(--fd-base-space-1-5,.375rem) 0 0;color:var(--fd-reporting-color-text-muted);font:var(--fd-base-typography-font-weight-medium,500) var(--fd-base-typography-font-size-sm,.875rem)/var(--fd-base-typography-line-height-relaxed,1.625) var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);}
.fd-reporting-meta{display:grid;grid-template-columns:repeat(2,minmax(132px,1fr));gap:var(--fd-base-space-2,.5rem);}
.fd-reporting-pill{background:var(--fd-reporting-color-surface);border:1px solid var(--fd-reporting-color-border);border-radius:var(--fd-semantic-radius-control,.75rem);padding:var(--fd-base-space-2-5,.625rem) var(--fd-base-space-3,.75rem);}
.fd-reporting-pill-label{color:var(--fd-reporting-color-text-muted);text-transform:uppercase;letter-spacing:var(--fd-base-typography-letter-spacing-wider,.025em);font:var(--fd-base-typography-font-weight-semibold,600) var(--fd-base-typography-font-size-xs,.75rem)/var(--fd-base-typography-line-height-tight,1.2) var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);}
.fd-reporting-pill-value{color:var(--fd-reporting-color-text);font:var(--fd-base-typography-font-weight-bold,700) var(--fd-base-typography-font-size-xl,1.25rem)/var(--fd-base-typography-line-height-snug,1.35) var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);}
.fd-reporting-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--fd-base-space-3-5,.875rem);}
.fd-reporting-card{background:var(--fd-reporting-color-surface);border:1px solid var(--fd-reporting-color-border);border-radius:var(--fd-semantic-radius-control,.75rem);padding:var(--fd-base-space-3-5,.875rem);overflow-x:auto;}
.fd-reporting-card h2{margin:0 0 var(--fd-base-space-2,.5rem);color:var(--fd-reporting-color-text);font:var(--fd-base-typography-font-weight-bold,700) var(--fd-base-typography-font-size-lg,1.125rem)/var(--fd-base-typography-line-height-snug,1.35) var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);}
.fd-reporting-card p{margin:var(--fd-base-space-1,.25rem) 0;color:var(--fd-reporting-color-text-muted);font:var(--fd-base-typography-font-weight-medium,500) var(--fd-base-typography-font-size-sm,.875rem)/var(--fd-base-typography-line-height-normal,1.5) var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);}
.fd-reporting-table{width:100%;border-collapse:collapse;margin-top:var(--fd-base-space-2,.5rem);}
.fd-reporting-table th,.fd-reporting-table td{border-bottom:1px solid var(--fd-reporting-color-border-subtle);padding:var(--fd-base-space-1-5,.375rem) var(--fd-base-space-1,.25rem);text-align:left;font:var(--fd-base-typography-font-weight-medium,500) var(--fd-base-typography-font-size-sm,.875rem)/var(--fd-base-typography-line-height-normal,1.5) var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);}
.fd-reporting-table th{color:var(--fd-reporting-color-text-muted);font-weight:var(--fd-base-typography-font-weight-bold,700);text-transform:uppercase;letter-spacing:var(--fd-base-typography-letter-spacing-wider,.025em);font-size:var(--fd-base-typography-font-size-xs,.75rem);}
.fd-reporting-kv{display:grid;grid-template-columns:1fr auto;row-gap:var(--fd-base-space-1-5,.375rem);column-gap:var(--fd-base-space-2,.5rem);}
.fd-reporting-kv dt{margin:0;color:var(--fd-reporting-color-text-muted);font:var(--fd-base-typography-font-weight-semibold,600) var(--fd-base-typography-font-size-sm,.875rem)/var(--fd-base-typography-line-height-normal,1.5) var(--fd-semantic-typography-font-family-body,'Source Sans 3',Arial,sans-serif);}
.fd-reporting-kv dd{margin:0;color:var(--fd-reporting-color-text);font:var(--fd-base-typography-font-weight-semibold,600) var(--fd-base-typography-font-size-sm,.875rem)/var(--fd-base-typography-line-height-normal,1.5) var(--fd-base-typography-font-family-mono,'JetBrains Mono',monospace);}
.fd-reporting-flag-pass{color:var(--fd-reporting-color-success-fg);background:var(--fd-reporting-color-success-bg);border:1px solid var(--fd-reporting-color-success-bg);border-radius:var(--fd-semantic-radius-pill,9999px);padding:var(--fd-base-space-0-5,.125rem) var(--fd-base-space-2,.5rem);font-size:var(--fd-base-typography-font-size-xs,.75rem);font-weight:var(--fd-base-typography-font-weight-bold,700);}
.fd-reporting-flag-fail{color:var(--fd-reporting-color-danger-fg);background:var(--fd-reporting-color-danger-bg);border:1px solid var(--fd-reporting-color-danger-bg);border-radius:var(--fd-semantic-radius-pill,9999px);padding:var(--fd-base-space-0-5,.125rem) var(--fd-base-space-2,.5rem);font-size:var(--fd-base-typography-font-size-xs,.75rem);font-weight:var(--fd-base-typography-font-weight-bold,700);}
@media (max-width:960px){.fd-reporting-grid{grid-template-columns:1fr;}.fd-reporting-header{flex-direction:column;}.fd-reporting-meta{grid-template-columns:repeat(2,minmax(0,1fr));width:100%;}}
`;

export function renderDashboardFragment(
  run: ReportingRun,
  options: DashboardRenderOptions = {},
): string {
  const models = buildFigureModels(run);
  const title = options.title ?? "FODMAP Phase 2 Reporting";
  const subtitle =
    options.subtitle ??
    `Run ${run.run_id} | contract ${run.contract_version} | source ${run.source_db_ref}`;

  const p01Rows = models.P01.metrics.stages
    .map(
      (stage) => `
        <tr>
          <td>${escapeHtml(stage.stage_id)}</td>
          <td>${stage.resolved_rows}</td>
          <td>${stage.unresolved_rows}</td>
          <td>${stage.expected_resolved_rows}/${stage.expected_unresolved_rows}</td>
        </tr>`,
    )
    .join("\n");

  const p03Rows = models.P03.metrics.bucket_rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.bucket)}</td>
          <td>${row.priority_rows}</td>
          <td>${row.resolved_rows}</td>
          <td>${row.completed_rows}</td>
          <td>${row.unresolved_rows}</td>
          <td>${row.pending_measurement_rows}</td>
        </tr>`,
    )
    .join("\n");

  const gapRows = models.Q02.metrics.phase2_gap_tuples
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.bucket)}</td>
          <td>${row.tuple.total}</td>
          <td>${row.tuple.resolved}</td>
          <td>${row.tuple.unresolved}</td>
          <td>${row.ok ? "ok" : "fail"}</td>
        </tr>`,
    )
    .join("\n");

  const passClass = models.Q04.metrics.overall_pass
    ? "fd-reporting-flag-pass"
    : "fd-reporting-flag-fail";

  return `
<section class="fd-reporting-root">
  <header class="fd-reporting-header">
    <div>
      <h1 class="fd-reporting-title">${escapeHtml(title)}</h1>
      <p class="fd-reporting-subtitle">${escapeHtml(subtitle)}</p>
    </div>
    <div class="fd-reporting-meta">
      <div class="fd-reporting-pill"><div class="fd-reporting-pill-label">Phase2 Total</div><div class="fd-reporting-pill-value">${models.Q02.metrics.phase2_priority_tuple.total}</div></div>
      <div class="fd-reporting-pill"><div class="fd-reporting-pill-label">Resolved</div><div class="fd-reporting-pill-value">${models.Q02.metrics.phase2_priority_tuple.resolved}</div></div>
      <div class="fd-reporting-pill"><div class="fd-reporting-pill-label">Unresolved</div><div class="fd-reporting-pill-value">${models.Q02.metrics.phase2_priority_tuple.unresolved}</div></div>
      <div class="fd-reporting-pill"><div class="fd-reporting-pill-label">Rank2 Gate</div><div class="fd-reporting-pill-value"><span class="${passClass}">${models.Q04.metrics.overall_pass ? "PASS" : "FAIL"}</span></div></div>
    </div>
  </header>

  <div class="fd-reporting-grid">
    <article class="fd-reporting-card">
      <h2>A. Pipeline Progression</h2>
      <table class="fd-reporting-table">
        <thead><tr><th>Stage</th><th>Resolved</th><th>Unresolved</th><th>Expected</th></tr></thead>
        <tbody>
          <tr><td>Start</td><td>${models.P01.metrics.baseline_resolved}</td><td>${models.P01.metrics.baseline_unresolved}</td><td>-</td></tr>
          ${p01Rows}
        </tbody>
      </table>
    </article>

    <article class="fd-reporting-card">
      <h2>B. Candidate Pool Evolution</h2>
      <table class="fd-reporting-table">
        <thead><tr><th>Stage</th><th>With</th><th>Without</th><th>Closure</th></tr></thead>
        <tbody>
          ${models.P02.metrics.stages
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.stage_id)}</td>
                  <td>${row.with_candidates_rows}</td>
                  <td>${row.without_candidates_rows}</td>
                  <td>${fmt(row.pool_closure_rate)}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </article>

    <article class="fd-reporting-card">
      <h2>C. Gap Completion Matrix</h2>
      <table class="fd-reporting-table">
        <thead><tr><th>Bucket</th><th>Priority</th><th>Resolved</th><th>Completed</th><th>Unresolved</th><th>Pending</th></tr></thead>
        <tbody>${p03Rows}</tbody>
      </table>
      <p>completion_ratio=${fmt(models.P03.metrics.completion_ratio)} | readiness_gap=${models.P03.metrics.readiness_gap}</p>
    </article>

    <article class="fd-reporting-card">
      <h2>D. Critical Contract Scorecard</h2>
      <dl class="fd-reporting-kv">
        <dt>phase3_rollup_row_count</dt><dd>${models.Q02.metrics.phase3_rollup_row_count}</dd>
        <dt>swap_status.active</dt><dd>${models.Q02.metrics.swap_status_tuple.active}</dd>
        <dt>swap_status.draft</dt><dd>${models.Q02.metrics.swap_status_tuple.draft}</dd>
        <dt>phase2_ok</dt><dd>${models.Q02.metrics.contract_checks.phase2_ok}</dd>
        <dt>phase3_ok</dt><dd>${models.Q02.metrics.contract_checks.phase3_ok}</dd>
        <dt>rank2_api_ok</dt><dd>${models.Q02.metrics.contract_checks.rank2_api_ok}</dd>
      </dl>
      <table class="fd-reporting-table">
        <thead><tr><th>Bucket</th><th>Total</th><th>Resolved</th><th>Unresolved</th><th>OK</th></tr></thead>
        <tbody>${gapRows}</tbody>
      </table>
    </article>

    <article class="fd-reporting-card">
      <h2>E. Snapshot Lock Drift</h2>
      <dl class="fd-reporting-kv">
        <dt>reviewed_snapshot_rows</dt><dd>${models.Q03.metrics.reviewed_snapshot_rows}</dd>
        <dt>snapshot_mismatch_rows</dt><dd>${models.Q03.metrics.snapshot_mismatch_rows}</dd>
        <dt>auto_eligible_mismatch_rows</dt><dd>${models.Q03.metrics.auto_eligible_mismatch_rows}</dd>
        <dt>approve_for_ineligible_rows</dt><dd>${models.Q03.metrics.approve_for_ineligible_rows}</dd>
      </dl>
      <p>scoring_version_snapshot_actual=${escapeHtml(models.Q03.metrics.scoring_version_snapshot_actual ?? "")}</p>
      <p>fodmap_safety_score_snapshot_actual=${escapeHtml(models.Q03.metrics.fodmap_safety_score_snapshot_actual ?? "")}</p>
    </article>

    <article class="fd-reporting-card">
      <h2>F. Rank2 Exclusion Audit</h2>
      <dl class="fd-reporting-kv">
        <dt>phase2_rank2_current_target_measurements</dt><dd>${models.Q04.metrics.phase2_rank2_current_target_measurements}</dd>
        <dt>phase3_rules_touching_rank2</dt><dd>${models.Q04.metrics.phase3_rules_touching_rank2}</dd>
        <dt>api_rank2_leak_rows</dt><dd>${models.Q04.metrics.api_rank2_leak_rows}</dd>
      </dl>
      <p>overall_pass=<span class="${passClass}">${models.Q04.metrics.overall_pass ? "PASS" : "FAIL"}</span></p>
    </article>

    <article class="fd-reporting-card">
      <h2>G. Threshold Provenance</h2>
      <dl class="fd-reporting-kv">
        <dt>invalid_threshold_source_rows</dt><dd>${models.E03.metrics.invalid_threshold_source_rows}</dd>
        <dt>missing_default_threshold_citation_rows</dt><dd>${models.E03.metrics.missing_default_threshold_citation_rows}</dd>
        <dt>default_threshold_share</dt><dd>${fmt(models.E03.metrics.default_threshold_share)}</dd>
        <dt>invalid_rows_total</dt><dd>${models.E03.metrics.invalid_rows_total ?? 0}</dd>
      </dl>
    </article>

    <article class="fd-reporting-card">
      <h2>H. Frozen Quarantine Case Study</h2>
      <dl class="fd-reporting-kv">
        <dt>mode</dt><dd>${escapeHtml(models.E04.metrics.mode)}</dd>
        <dt>source_stage</dt><dd>${escapeHtml(models.E04.metrics.source_stage)}</dd>
        <dt>rank2_current_target_measurements_expected</dt><dd>${models.E04.metrics.rank2_current_target_measurements_expected}</dd>
        <dt>cohort_note_count</dt><dd>${models.E04.metrics.cohort_note_count}</dd>
        <dt>post_batch10_readiness_rows</dt><dd>${models.E04.metrics.post_batch10_readiness_rows}</dd>
      </dl>
    </article>
  </div>
</section>
  `.trim();
}

export function renderStandaloneDashboardHtml(
  run: ReportingRun,
  options: DashboardRenderOptions = {},
): string {
  const title = options.title ?? "FODMAP Phase 2 - Standalone Dashboard";
  const fragment = renderDashboardFragment(run, options);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${REPORTING_THEME_CSS}</style>
  </head>
  <body>
    ${fragment}
  </body>
</html>`;
}
