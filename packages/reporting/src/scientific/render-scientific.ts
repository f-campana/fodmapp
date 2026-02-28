import { buildFigureModels } from "../models/build-figure-models";
import type { ReportingRun, ScientificFigureFile } from "../contracts";

export interface ScientificRenderOptions {
  width?: number;
  height?: number;
}

const scientificColor = {
  canvas:
    "var(--fd-reporting-color-canvas, var(--fd-semantic-color-background-canvas))",
  surface:
    "var(--fd-reporting-color-surface, var(--fd-semantic-color-surface-default))",
  border:
    "var(--fd-reporting-color-border, var(--fd-semantic-color-border-default))",
  borderSubtle:
    "var(--fd-reporting-color-border-subtle, var(--fd-semantic-color-border-subtle))",
  text: "var(--fd-reporting-color-text, var(--fd-semantic-color-text-primary))",
  textMuted:
    "var(--fd-reporting-color-text-muted, var(--fd-semantic-color-text-muted))",
  info: "var(--fd-reporting-color-info-bg, var(--fd-semantic-color-status-info-bg))",
  warning:
    "var(--fd-reporting-color-warning-bg, var(--fd-semantic-color-status-warning-bg))",
  success:
    "var(--fd-reporting-color-success-bg, var(--fd-semantic-color-status-success-bg))",
  successSoft:
    "var(--fd-reporting-color-surface-success-soft, var(--fd-semantic-color-status-success-fg))",
  danger:
    "var(--fd-reporting-color-danger-bg, var(--fd-semantic-color-status-danger-bg))",
  dangerStrong:
    "var(--fd-reporting-color-danger-strong, var(--fd-semantic-color-action-destructive-bg-hover))",
  dangerSoft:
    "var(--fd-reporting-color-surface-danger-soft, var(--fd-semantic-color-status-danger-fg))",
} as const;

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svgRoot(
  width: number,
  height: number,
  title: string,
  body: string,
): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">`,
    `<title>${escapeXml(title)}</title>`,
    `<defs>`,
    `<style><![CDATA[`,
    `.title{font:700 22px 'Source Sans 3',Arial,sans-serif;fill:${scientificColor.text};}`,
    `.subtitle{font:600 14px 'Source Sans 3',Arial,sans-serif;fill:${scientificColor.textMuted};}`,
    `.label{font:500 13px 'Source Sans 3',Arial,sans-serif;fill:${scientificColor.textMuted};}`,
    `.value{font:700 14px 'Source Sans 3',Arial,sans-serif;fill:${scientificColor.text};}`,
    `.muted{font:500 12px 'Source Sans 3',Arial,sans-serif;fill:${scientificColor.textMuted};}`,
    `.mono{font:500 12px 'JetBrains Mono',monospace;fill:${scientificColor.textMuted};}`,
    `.grid{stroke:${scientificColor.borderSubtle};stroke-width:1;}`,
    `.axis{stroke:${scientificColor.textMuted};stroke-width:1.2;}`,
    `]]></style>`,
    `</defs>`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${scientificColor.canvas}"/>`,
    body,
    `</svg>`,
  ].join("\n");
}

function fmt(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}`;
  }
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function renderFigureA(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const rows = [
    {
      label: "Start",
      resolved: models.P01.metrics.baseline_resolved,
      unresolved: models.P01.metrics.baseline_unresolved,
    },
    ...models.P01.metrics.stages.map((stage) => ({
      label: stage.stage_id,
      resolved: stage.resolved_rows,
      unresolved: stage.unresolved_rows,
    })),
  ];

  const width = 1200;
  const height = 520;
  const chartX = 72;
  const chartY = 86;
  const chartW = width - chartX - 32;
  const chartH = 360;
  const maxY = Math.max(
    ...rows.map((r) => Math.max(r.resolved, r.unresolved)),
    1,
  );

  const spacing = chartW / rows.length;
  const barWidth = Math.min(22, spacing / 3);

  const body: string[] = [];
  body.push(
    `<text class="title" x="24" y="36">A - Pipeline Progression (Resolved vs Unresolved)</text>`,
  );
  body.push(
    `<text class="subtitle" x="24" y="58">Source: P-01_stage_progression_contract_curve</text>`,
  );

  for (let tick = 0; tick <= maxY; tick += Math.max(1, Math.ceil(maxY / 6))) {
    const y = chartY + chartH - (tick / maxY) * chartH;
    body.push(
      `<line class="grid" x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}"/>`,
    );
    body.push(
      `<text class="muted" x="${chartX - 10}" y="${y + 4}" text-anchor="end">${tick}</text>`,
    );
  }

  body.push(
    `<line class="axis" x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartH}"/>`,
  );
  body.push(
    `<line class="axis" x1="${chartX}" y1="${chartY + chartH}" x2="${chartX + chartW}" y2="${chartY + chartH}"/>`,
  );

  rows.forEach((row, index) => {
    const cx = chartX + spacing * index + spacing / 2;
    const resolvedHeight = (row.resolved / maxY) * chartH;
    const unresolvedHeight = (row.unresolved / maxY) * chartH;

    body.push(
      `<rect x="${cx - barWidth - 2}" y="${chartY + chartH - resolvedHeight}" width="${barWidth}" height="${resolvedHeight}" fill="${scientificColor.info}"/>`,
    );
    body.push(
      `<rect x="${cx + 2}" y="${chartY + chartH - unresolvedHeight}" width="${barWidth}" height="${unresolvedHeight}" fill="${scientificColor.warning}"/>`,
    );

    body.push(
      `<text class="value" x="${cx - barWidth / 2 - 2}" y="${chartY + chartH - resolvedHeight - 6}" text-anchor="middle">${row.resolved}</text>`,
    );
    body.push(
      `<text class="value" x="${cx + barWidth / 2 + 2}" y="${chartY + chartH - unresolvedHeight - 6}" text-anchor="middle">${row.unresolved}</text>`,
    );

    body.push(
      `<text class="label" x="${cx}" y="${chartY + chartH + 16}" text-anchor="middle">${escapeXml(row.label)}</text>`,
    );
  });

  body.push(
    `<rect x="${width - 270}" y="${height - 80}" width="12" height="12" fill="${scientificColor.info}"/>`,
  );
  body.push(
    `<text class="label" x="${width - 252}" y="${height - 70}">Resolved</text>`,
  );
  body.push(
    `<rect x="${width - 170}" y="${height - 80}" width="12" height="12" fill="${scientificColor.warning}"/>`,
  );
  body.push(
    `<text class="label" x="${width - 152}" y="${height - 70}">Unresolved</text>`,
  );

  return svgRoot(
    width,
    height,
    "Figure A Pipeline Progression",
    body.join("\n"),
  );
}

function renderFigureB(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const rows = models.P02.metrics.stages;
  const width = 1200;
  const rowH = 54;
  const chartY = 96;
  const height = Math.max(340, chartY + rows.length * rowH + 100);
  const chartX = 180;
  const barW = width - chartX - 60;
  const maxValue = Math.max(...rows.map((row) => row.unresolved_rows), 1);

  const body: string[] = [];
  body.push(
    `<text class="title" x="24" y="36">B - Candidate Pool Evolution</text>`,
  );
  body.push(
    `<text class="subtitle" x="24" y="58">Source: P-02_candidate_pool_split_by_stage</text>`,
  );

  rows.forEach((row, index) => {
    const y = chartY + index * rowH;
    const withWidth =
      row.with_candidates_rows === 0
        ? 0
        : (row.with_candidates_rows / maxValue) * barW;
    const withoutWidth =
      row.without_candidates_rows === 0
        ? 0
        : (row.without_candidates_rows / maxValue) * barW;
    body.push(
      `<text class="label" x="${chartX - 10}" y="${y + 22}" text-anchor="end">${escapeXml(row.stage_id)}</text>`,
    );
    body.push(
      `<rect x="${chartX}" y="${y + 8}" width="${barW}" height="20" fill="${scientificColor.borderSubtle}" opacity="0.38"/>`,
    );
    body.push(
      `<rect x="${chartX}" y="${y + 9}" width="${withWidth}" height="18" fill="${scientificColor.success}"/>`,
    );
    body.push(
      `<rect x="${chartX + withWidth}" y="${y + 9}" width="${withoutWidth}" height="18" fill="${scientificColor.danger}"/>`,
    );
    body.push(
      `<text class="value" x="${chartX + Math.max(withWidth - 6, 16)}" y="${y + 22}" text-anchor="end">${row.with_candidates_rows}</text>`,
    );
    body.push(
      `<text class="value" x="${chartX + withWidth + withoutWidth + 8}" y="${y + 22}">${row.without_candidates_rows}</text>`,
    );
    body.push(
      `<text class="muted" x="${chartX + barW + 10}" y="${y + 22}">unresolved=${row.unresolved_rows}</text>`,
    );
  });

  body.push(
    `<rect x="${width - 280}" y="${height - 74}" width="12" height="12" fill="${scientificColor.success}"/>`,
  );
  body.push(
    `<text class="label" x="${width - 262}" y="${height - 64}">with candidates</text>`,
  );
  body.push(
    `<rect x="${width - 150}" y="${height - 74}" width="12" height="12" fill="${scientificColor.danger}"/>`,
  );
  body.push(
    `<text class="label" x="${width - 132}" y="${height - 64}">without candidates</text>`,
  );

  return svgRoot(
    width,
    height,
    "Figure B Candidate Pool Evolution",
    body.join("\n"),
  );
}

function renderFigureC(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const rows = models.P03.metrics.bucket_rows;
  const width = 1200;
  const startX = 230;
  const startY = 120;
  const cellW = 150;
  const cellH = 56;
  const height = Math.max(360, startY + rows.length * cellH + 120);

  const cols: Array<{ key: keyof (typeof rows)[number]; label: string }> = [
    { key: "priority_rows", label: "priority" },
    { key: "resolved_rows", label: "resolved" },
    { key: "completed_rows", label: "completed" },
    { key: "unresolved_rows", label: "unresolved" },
    { key: "pending_measurement_rows", label: "pending" },
  ];

  const body: string[] = [];
  body.push(
    `<text class="title" x="24" y="36">C - Gap Completion Matrix</text>`,
  );
  body.push(
    `<text class="subtitle" x="24" y="58">Source: P-03_gap_completion_matrix</text>`,
  );

  cols.forEach((col, idx) => {
    body.push(
      `<text class="label" x="${startX + idx * cellW + cellW / 2}" y="${startY - 14}" text-anchor="middle">${col.label}</text>`,
    );
  });

  rows.forEach((row, rowIndex) => {
    const y = startY + rowIndex * cellH;
    body.push(
      `<text class="label" x="${startX - 10}" y="${y + 32}" text-anchor="end">${escapeXml(row.bucket)}</text>`,
    );
    cols.forEach((col, colIndex) => {
      const value = Number(row[col.key] ?? 0);
      const color =
        col.key.includes("unresolved") || col.key.includes("pending")
          ? scientificColor.dangerSoft
          : scientificColor.successSoft;
      body.push(
        `<rect x="${startX + colIndex * cellW + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" fill="${color}" stroke="${scientificColor.border}"/>`,
      );
      body.push(
        `<text class="value" x="${startX + colIndex * cellW + cellW / 2}" y="${y + 33}" text-anchor="middle">${value}</text>`,
      );
    });
  });

  body.push(
    `<text class="mono" x="24" y="${height - 38}">completion_ratio=${fmt(models.P03.metrics.completion_ratio)} readiness_gap=${models.P03.metrics.readiness_gap}</text>`,
  );
  return svgRoot(
    width,
    height,
    "Figure C Gap Completion Matrix",
    body.join("\n"),
  );
}

function renderFigureD(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const width = 1200;
  const height = 520;
  const boxY = 110;
  const boxW = 250;
  const boxH = 120;

  const phase2 = models.Q02.metrics.phase2_priority_tuple;
  const swap = models.Q02.metrics.swap_status_tuple;
  const checks = models.Q02.metrics.contract_checks;

  const cards = [
    {
      label: "Phase2 Priority",
      lines: [
        `total=${phase2.total}`,
        `resolved=${phase2.resolved}`,
        `unresolved=${phase2.unresolved}`,
      ],
    },
    {
      label: "Swap Status",
      lines: [
        `active=${swap.active}`,
        `draft=${swap.draft}`,
        `rollups=${models.Q02.metrics.phase3_rollup_row_count}`,
      ],
    },
    {
      label: "Contract Checks",
      lines: [
        `phase2_ok=${checks.phase2_ok}`,
        `phase3_ok=${checks.phase3_ok}`,
        `rank2_api_ok=${checks.rank2_api_ok}`,
      ],
    },
  ];

  const body: string[] = [];
  body.push(
    `<text class="title" x="24" y="36">D - Critical Contract Scorecard</text>`,
  );
  body.push(
    `<text class="subtitle" x="24" y="58">Source: Q-02_critical_contract_scorecard</text>`,
  );

  cards.forEach((card, index) => {
    const x = 48 + index * (boxW + 40);
    body.push(
      `<rect x="${x}" y="${boxY}" width="${boxW}" height="${boxH}" fill="${scientificColor.surface}" stroke="${scientificColor.border}"/>`,
    );
    body.push(
      `<text class="subtitle" x="${x + 14}" y="${boxY + 24}">${escapeXml(card.label)}</text>`,
    );
    card.lines.forEach((line, row) => {
      body.push(
        `<text class="mono" x="${x + 14}" y="${boxY + 50 + row * 20}">${escapeXml(line)}</text>`,
      );
    });
  });

  let startY = 286;
  body.push(
    `<text class="subtitle" x="48" y="${startY}">Gap tuples by subtype</text>`,
  );
  startY += 20;
  models.Q02.metrics.phase2_gap_tuples.forEach((row) => {
    body.push(
      `<text class="mono" x="48" y="${startY}">${escapeXml(row.bucket)} -> (${row.tuple.total},${row.tuple.resolved},${row.tuple.unresolved}) ok=${row.ok}</text>`,
    );
    startY += 18;
  });

  return svgRoot(
    width,
    height,
    "Figure D Critical Contract Scorecard",
    body.join("\n"),
  );
}

function renderFigureE(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const metrics = models.Q03.metrics;
  const width = 1200;
  const height = 420;

  const rows = [
    {
      label: "reviewed_snapshot_rows",
      value: metrics.reviewed_snapshot_rows,
      color: scientificColor.info,
    },
    {
      label: "snapshot_mismatch_rows",
      value: metrics.snapshot_mismatch_rows,
      color: scientificColor.danger,
    },
    {
      label: "auto_eligible_mismatch_rows",
      value: metrics.auto_eligible_mismatch_rows,
      color: scientificColor.warning,
    },
    {
      label: "approve_for_ineligible_rows",
      value: metrics.approve_for_ineligible_rows,
      color: scientificColor.dangerStrong,
    },
  ];

  const max = Math.max(...rows.map((row) => row.value), 1);
  const chartX = 280;
  const barW = width - chartX - 80;
  const body: string[] = [];

  body.push(`<text class="title" x="24" y="36">E - Snapshot Lock Drift</text>`);
  body.push(
    `<text class="subtitle" x="24" y="58">Source: Q-03_snapshot_lock_drift_panel</text>`,
  );

  rows.forEach((row, idx) => {
    const y = 100 + idx * 58;
    const w = (row.value / max) * barW;
    body.push(
      `<text class="label" x="${chartX - 10}" y="${y + 18}" text-anchor="end">${row.label}</text>`,
    );
    body.push(
      `<rect x="${chartX}" y="${y + 2}" width="${w}" height="20" fill="${row.color}"/>`,
    );
    body.push(
      `<text class="value" x="${chartX + w + 8}" y="${y + 18}">${row.value}</text>`,
    );
  });

  body.push(
    `<text class="mono" x="24" y="${height - 44}">scoring_version_snapshot_actual=${escapeXml(metrics.scoring_version_snapshot_actual ?? "")}</text>`,
  );
  body.push(
    `<text class="mono" x="24" y="${height - 24}">fodmap_safety_score_snapshot_actual=${escapeXml(metrics.fodmap_safety_score_snapshot_actual ?? "")}</text>`,
  );

  return svgRoot(
    width,
    height,
    "Figure E Snapshot Lock Drift",
    body.join("\n"),
  );
}

function renderFigureF(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const metrics = models.Q04.metrics;
  const width = 1200;
  const height = 420;

  const rows = [
    {
      label: "phase2_rank2_current_target_measurements",
      value: metrics.phase2_rank2_current_target_measurements,
      color: scientificColor.danger,
    },
    {
      label: "phase3_rules_touching_rank2",
      value: metrics.phase3_rules_touching_rank2,
      color: scientificColor.warning,
    },
    {
      label: "api_rank2_leak_rows",
      value: metrics.api_rank2_leak_rows,
      color: scientificColor.dangerStrong,
    },
  ];
  const max = Math.max(...rows.map((row) => row.value), 1);

  const body: string[] = [];
  body.push(
    `<text class="title" x="24" y="36">F - Rank2 Exclusion Audit</text>`,
  );
  body.push(
    `<text class="subtitle" x="24" y="58">Source: Q-04_rank2_exclusion_audit</text>`,
  );

  rows.forEach((row, idx) => {
    const y = 104 + idx * 72;
    const widthPx = row.value === 0 ? 3 : (row.value / max) * 760;
    body.push(
      `<text class="label" x="40" y="${y + 18}">${escapeXml(row.label)}</text>`,
    );
    body.push(
      `<rect x="40" y="${y + 24}" width="${widthPx}" height="16" fill="${row.color}"/>`,
    );
    body.push(
      `<text class="value" x="${40 + widthPx + 8}" y="${y + 37}">${row.value}</text>`,
    );
  });

  body.push(
    `<rect x="40" y="330" width="560" height="56" fill="${scientificColor.surface}" stroke="${scientificColor.border}"/>`,
  );
  body.push(
    `<text class="subtitle" x="56" y="354">overall_pass=${metrics.overall_pass}</text>`,
  );
  body.push(
    `<text class="mono" x="56" y="376">Gate policy: no rank2 path in active API surface</text>`,
  );

  return svgRoot(
    width,
    height,
    "Figure F Rank2 Exclusion Audit",
    body.join("\n"),
  );
}

function renderFigureG(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const metrics = models.E03.metrics;
  const width = 1200;
  const height = 420;
  const rows = [
    {
      label: "invalid_threshold_source_rows",
      value: metrics.invalid_threshold_source_rows,
      color: scientificColor.danger,
    },
    {
      label: "missing_default_threshold_citation_rows",
      value: metrics.missing_default_threshold_citation_rows,
      color: scientificColor.warning,
    },
    {
      label: "invalid_rows_total",
      value: metrics.invalid_rows_total ?? 0,
      color: scientificColor.dangerStrong,
    },
  ];
  const max = Math.max(...rows.map((row) => row.value), 1);

  const body: string[] = [];
  body.push(
    `<text class="title" x="24" y="36">G - Threshold Provenance Completeness</text>`,
  );
  body.push(
    `<text class="subtitle" x="24" y="58">Source: E-03_threshold_provenance_completeness</text>`,
  );

  rows.forEach((row, idx) => {
    const y = 110 + idx * 62;
    const w = row.value === 0 ? 3 : (row.value / max) * 720;
    body.push(
      `<text class="label" x="36" y="${y + 18}">${escapeXml(row.label)}</text>`,
    );
    body.push(
      `<rect x="36" y="${y + 24}" width="${w}" height="16" fill="${row.color}"/>`,
    );
    body.push(
      `<text class="value" x="${36 + w + 8}" y="${y + 37}">${row.value}</text>`,
    );
  });

  body.push(
    `<text class="subtitle" x="36" y="346">default_threshold_share=${fmt(metrics.default_threshold_share)}</text>`,
  );
  return svgRoot(
    width,
    height,
    "Figure G Threshold Provenance",
    body.join("\n"),
  );
}

function renderFigureH(run: ReportingRun): string {
  const models = buildFigureModels(run);
  const metrics = models.E04.metrics;
  const width = 1200;
  const height = 420;

  const body: string[] = [];
  body.push(
    `<text class="title" x="24" y="36">H - Frozen Quarantine Case Study</text>`,
  );
  body.push(
    `<text class="subtitle" x="24" y="58">Source: E-04_rank2_quarantine_case_study</text>`,
  );

  body.push(
    `<rect x="36" y="96" width="540" height="260" fill="${scientificColor.surface}" stroke="${scientificColor.border}"/>`,
  );
  body.push(`<text class="subtitle" x="56" y="130">mode</text>`);
  body.push(
    `<text class="value" x="56" y="154">${escapeXml(metrics.mode)}</text>`,
  );
  body.push(`<text class="subtitle" x="56" y="190">source_stage</text>`);
  body.push(
    `<text class="value" x="56" y="214">${escapeXml(metrics.source_stage)}</text>`,
  );
  body.push(
    `<text class="subtitle" x="56" y="250">rank2_current_target_measurements_expected</text>`,
  );
  body.push(
    `<text class="value" x="56" y="274">${metrics.rank2_current_target_measurements_expected}</text>`,
  );
  body.push(
    `<text class="subtitle" x="56" y="310">post_batch10_readiness_rows=${metrics.post_batch10_readiness_rows}</text>`,
  );

  body.push(
    `<rect x="620" y="96" width="540" height="260" fill="${scientificColor.surface}" stroke="${scientificColor.border}"/>`,
  );
  body.push(`<text class="subtitle" x="640" y="130">cohort_note_count</text>`);
  body.push(
    `<text class="value" x="640" y="156">${metrics.cohort_note_count}</text>`,
  );
  body.push(
    `<text class="mono" x="640" y="194">This figure is intentionally frozen for auditability.</text>`,
  );
  body.push(
    `<text class="mono" x="640" y="214">No dynamic recompute against final DB state.</text>`,
  );

  return svgRoot(width, height, "Figure H Quarantine Impact", body.join("\n"));
}

export const FIGURE_FILE_BY_ID: Record<string, ScientificFigureFile> = {
  "P-01_stage_progression_contract_curve": "fig_A_pipeline_progression.svg",
  "P-02_candidate_pool_split_by_stage": "fig_B_candidate_pool_evolution.svg",
  "P-03_gap_completion_matrix": "fig_C_gap_completion_heatmap.svg",
  "Q-02_critical_contract_scorecard": "fig_D_status_distribution.svg",
  "Q-03_snapshot_lock_drift_panel": "fig_E_evidence_quality.svg",
  "Q-04_rank2_exclusion_audit": "fig_F_serving_load_vs_thresholds.svg",
  "E-03_threshold_provenance_completeness": "fig_G_source_provenance.svg",
  "E-04_rank2_quarantine_case_study": "fig_H_quarantine_impact.svg",
};

export const FIGURE_TITLE_BY_ID: Record<string, string> = {
  "P-01_stage_progression_contract_curve": "Pipeline Progression",
  "P-02_candidate_pool_split_by_stage": "Candidate Pool Evolution",
  "P-03_gap_completion_matrix": "Gap Completion Matrix",
  "Q-02_critical_contract_scorecard": "Critical Contract Scorecard",
  "Q-03_snapshot_lock_drift_panel": "Snapshot Lock Drift",
  "Q-04_rank2_exclusion_audit": "Rank2 Exclusion Audit",
  "E-03_threshold_provenance_completeness": "Threshold Provenance",
  "E-04_rank2_quarantine_case_study": "Quarantine Case Study",
};

export function renderScientificSvgBundle(
  run: ReportingRun,
  options: ScientificRenderOptions = {},
): Record<ScientificFigureFile, string> {
  void options;
  const content = {
    "fig_A_pipeline_progression.svg": renderFigureA(run),
    "fig_B_candidate_pool_evolution.svg": renderFigureB(run),
    "fig_C_gap_completion_heatmap.svg": renderFigureC(run),
    "fig_D_status_distribution.svg": renderFigureD(run),
    "fig_E_evidence_quality.svg": renderFigureE(run),
    "fig_F_serving_load_vs_thresholds.svg": renderFigureF(run),
    "fig_G_source_provenance.svg": renderFigureG(run),
    "fig_H_quarantine_impact.svg": renderFigureH(run),
  } as const;

  return content;
}
