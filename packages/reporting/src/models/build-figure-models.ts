import type {
  BaseFigurePayload,
  E03Metrics,
  E04Metrics,
  FigureId,
  FigureModels,
  P01Metrics,
  P02Metrics,
  P03Metrics,
  Q02Metrics,
  Q03Metrics,
  Q04Metrics,
  ReportingRun,
} from "../contracts";

function requireFigure<TMetrics>(
  byId: Map<FigureId, BaseFigurePayload<unknown>>,
  figureId: FigureId,
): BaseFigurePayload<TMetrics> {
  const figure = byId.get(figureId);
  if (!figure) {
    throw new Error(`missing required figure ${figureId}`);
  }
  return figure as BaseFigurePayload<TMetrics>;
}

export function buildFigureModels(run: ReportingRun): FigureModels {
  const byId = new Map(
    run.figures.map((figure) => [
      figure.figure_id,
      figure as BaseFigurePayload<unknown>,
    ]),
  );

  const models: FigureModels = {
    P01: requireFigure<P01Metrics>(
      byId,
      "P-01_stage_progression_contract_curve",
    ),
    P02: requireFigure<P02Metrics>(byId, "P-02_candidate_pool_split_by_stage"),
    P03: requireFigure<P03Metrics>(byId, "P-03_gap_completion_matrix"),
    Q02: requireFigure<Q02Metrics>(byId, "Q-02_critical_contract_scorecard"),
    Q03: requireFigure<Q03Metrics>(byId, "Q-03_snapshot_lock_drift_panel"),
    Q04: requireFigure<Q04Metrics>(byId, "Q-04_rank2_exclusion_audit"),
    E03: requireFigure<E03Metrics>(
      byId,
      "E-03_threshold_provenance_completeness",
    ),
    E04: requireFigure<E04Metrics>(byId, "E-04_rank2_quarantine_case_study"),
  };

  return models;
}
