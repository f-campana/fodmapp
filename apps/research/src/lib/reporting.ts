import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  parseReportingRun,
  renderDashboardFragment,
  type ReportingRun,
} from "@fodmap/reporting";

const REPO_ROOT = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);
const BASELINE_RUN_PATH = resolve(
  REPO_ROOT,
  "etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json",
);

export function loadReportingBaselineRun(): ReportingRun {
  const payload = JSON.parse(
    readFileSync(BASELINE_RUN_PATH, "utf8"),
  ) as unknown;
  return parseReportingRun(payload);
}

export function renderReportingBaselineDashboard(run: ReportingRun): string {
  return renderDashboardFragment(run, {
    title: "Reporting contractuel Phase 2",
    subtitle: `Baseline ${run.run_id} | contrat ${run.contract_version}`,
  });
}
