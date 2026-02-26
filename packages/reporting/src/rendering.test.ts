import { describe, expect, it } from "vitest";

import {
  parseReportingRun,
  renderDashboardFragment,
  renderScientificSvgBundle,
  sampleReportingRun,
  SCIENTIFIC_FIGURE_ORDER,
} from "./index";

describe("reporting renderer package", () => {
  it("parses the sample run and enforces core invariants", () => {
    const run = parseReportingRun(sampleReportingRun);
    const q03 = run.figures.find(
      (figure) => figure.figure_id === "Q-03_snapshot_lock_drift_panel",
    );
    const e04 = run.figures.find(
      (figure) => figure.figure_id === "E-04_rank2_quarantine_case_study",
    );

    expect(q03).toBeDefined();
    expect(
      (q03?.metrics as { reviewed_snapshot_rows: number })
        .reviewed_snapshot_rows,
    ).toBeGreaterThanOrEqual(1);
    expect((e04?.metrics as { mode: string }).mode).toBe("frozen_case_study");
  });

  it("renders 8 deterministic scientific figures", () => {
    const run = parseReportingRun(sampleReportingRun);
    const bundle = renderScientificSvgBundle(run, {});

    expect(Object.keys(bundle).sort()).toEqual(
      [...SCIENTIFIC_FIGURE_ORDER].sort(),
    );
    expect(bundle["fig_A_pipeline_progression.svg"]).toContain(
      "Pipeline Progression",
    );
    expect(bundle["fig_H_quarantine_impact.svg"]).toContain(
      "Frozen Quarantine Case Study",
    );
  });

  it("renders deterministic dashboard fragment", () => {
    const run = parseReportingRun(sampleReportingRun);
    const html = renderDashboardFragment(run, {
      title: "Reporting contractuel Phase 2",
      subtitle: "fixture",
    });

    expect(html).toContain("Reporting contractuel Phase 2");
    expect(html).toContain("Rank2 Exclusion Audit");
    expect(html).toContain("Frozen Quarantine Case Study");
  });
});
