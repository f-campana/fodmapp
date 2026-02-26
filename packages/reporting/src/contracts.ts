export const NOW_FIGURE_IDS = [
  "P-01_stage_progression_contract_curve",
  "P-02_candidate_pool_split_by_stage",
  "P-03_gap_completion_matrix",
  "Q-02_critical_contract_scorecard",
  "Q-03_snapshot_lock_drift_panel",
  "Q-04_rank2_exclusion_audit",
  "E-03_threshold_provenance_completeness",
  "E-04_rank2_quarantine_case_study",
] as const;

export type FigureId = (typeof NOW_FIGURE_IDS)[number];

export interface BaseFigurePayload<TMetrics> {
  figure_id: FigureId;
  schema_version: string;
  payload_version: string;
  status: "pass" | "warn" | "fail";
  hard_gate: "pass" | "fail";
  contract_refs: string[];
  metrics: TMetrics;
  validation: {
    ok: boolean;
    error_count?: number;
    errors?: string[];
  };
  artifact: {
    path: string;
    sha256: string;
    row_count: number;
  };
}

export interface P01Stage {
  stage_id: string;
  executed: boolean;
  resolved_rows: number;
  unresolved_rows: number;
  expected_resolved_rows: number;
  expected_unresolved_rows: number;
  delta_resolved_rows?: number;
  delta_unresolved_rows?: number;
}

export interface P01Metrics {
  baseline_resolved: number;
  baseline_unresolved: number;
  contract_ref?: string;
  stages: P01Stage[];
}

export interface P02Stage {
  stage_id: string;
  unresolved_rows: number;
  with_candidates_rows: number;
  without_candidates_rows: number;
  pool_closure_rate: number;
}

export interface P02Metrics {
  stages: P02Stage[];
  total_with_candidates: number;
  total_without_candidates: number;
}

export interface P03Bucket {
  bucket: string;
  priority_rows: number;
  resolved_rows: number;
  completed_rows: number;
  unresolved_rows: number;
  pending_measurement_rows: number;
  completion_ratio?: number;
  readiness_gap?: number;
}

export interface P03Metrics {
  bucket_rows: P03Bucket[];
  completion_ratio: number;
  readiness_gap: number;
}

export interface Q02GapTuple {
  bucket: string;
  tuple: {
    total: number;
    resolved: number;
    unresolved: number;
  };
  ok: boolean;
}

export interface Q02Metrics {
  phase2_priority_tuple: {
    total: number;
    resolved: number;
    unresolved: number;
  };
  phase2_gap_tuples: Q02GapTuple[];
  phase3_rollup_row_count: number;
  swap_status_tuple: {
    active: number;
    draft: number;
  };
  contract_checks: {
    phase2_ok: boolean;
    phase3_ok: boolean;
    rank2_api_ok: boolean;
  };
}

export interface Q03Metrics {
  reviewed_snapshot_rows: number;
  snapshot_mismatch_rows: number;
  auto_eligible_mismatch_rows: number;
  approve_for_ineligible_rows: number;
  scoring_version_snapshot_actual?: string;
  fodmap_safety_score_snapshot_actual?: string;
}

export interface Q04Metrics {
  phase2_rank2_current_target_measurements: number;
  phase3_rules_touching_rank2: number;
  api_rank2_leak_rows: number;
  overall_pass: boolean;
}

export interface E03Metrics {
  invalid_threshold_source_rows: number;
  missing_default_threshold_citation_rows: number;
  default_threshold_share: number;
  invalid_rows_total?: number;
}

export interface E04Metrics {
  mode: "frozen_case_study";
  source_stage: "post_batch10";
  rank2_current_target_measurements_expected: number;
  cohort_note_count: number;
  post_batch10_readiness_rows: number;
}

export type FigurePayload =
  | BaseFigurePayload<P01Metrics>
  | BaseFigurePayload<P02Metrics>
  | BaseFigurePayload<P03Metrics>
  | BaseFigurePayload<Q02Metrics>
  | BaseFigurePayload<Q03Metrics>
  | BaseFigurePayload<Q04Metrics>
  | BaseFigurePayload<E03Metrics>
  | BaseFigurePayload<E04Metrics>;

export interface ReportingRun {
  run_id: string;
  schema_version: string;
  generated_at_utc: string;
  git_sha: string;
  source_db_ref: string;
  source_db_meta?: {
    kind: "fixture" | "db";
    host: string | null;
    database: string | null;
    redacted: boolean;
  };
  contract_version: string;
  trigger?: "pr_smoke" | "main_full" | "manual_full" | "manual_baseline_update";
  source_file_hashes?: Record<string, string>;
  figures: FigurePayload[];
  summary?: {
    now_set_ok?: boolean;
    now_set_fail_count?: number;
    now_set_warn_count?: number;
    snapshot_drift_count?: number;
  };
  artifact?: {
    out_path: string;
    sha256: string;
  };
}

export interface FigureModels {
  P01: BaseFigurePayload<P01Metrics>;
  P02: BaseFigurePayload<P02Metrics>;
  P03: BaseFigurePayload<P03Metrics>;
  Q02: BaseFigurePayload<Q02Metrics>;
  Q03: BaseFigurePayload<Q03Metrics>;
  Q04: BaseFigurePayload<Q04Metrics>;
  E03: BaseFigurePayload<E03Metrics>;
  E04: BaseFigurePayload<E04Metrics>;
}

export const SCIENTIFIC_FIGURE_ORDER = [
  "fig_A_pipeline_progression.svg",
  "fig_B_candidate_pool_evolution.svg",
  "fig_C_gap_completion_heatmap.svg",
  "fig_D_status_distribution.svg",
  "fig_E_evidence_quality.svg",
  "fig_F_serving_load_vs_thresholds.svg",
  "fig_G_source_provenance.svg",
  "fig_H_quarantine_impact.svg",
] as const;

export type ScientificFigureFile = (typeof SCIENTIFIC_FIGURE_ORDER)[number];

export interface RenderScientificArtifact {
  figure_id: FigureId;
  file: ScientificFigureFile;
  title: string;
  sha256: string;
}

export interface RenderPublicArtifact {
  artifact_id: "phase2_dashboard_html";
  file: "phase2_dashboard.html";
  title: string;
  sha256: string;
}

export interface RenderBaselineManifest {
  schema_version: "phase2-render-baseline-manifest-v1";
  generated_at_utc: string;
  source_run: {
    run_id: string;
    git_sha: string;
    source_db_ref: string;
    contract_version: string;
  };
  contract_refs: string[];
  scientific: RenderScientificArtifact[];
  public: RenderPublicArtifact[];
}
