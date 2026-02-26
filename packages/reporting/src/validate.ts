import {
  type FigureId,
  type FigurePayload,
  NOW_FIGURE_IDS,
  type RenderBaselineManifest,
  type ReportingRun,
} from "./contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNumber(value: unknown, field: string): number {
  assert(
    typeof value === "number" && Number.isFinite(value),
    `${field} must be a finite number`,
  );
  return value;
}

function assertString(value: unknown, field: string): string {
  assert(
    typeof value === "string" && value.length > 0,
    `${field} must be a non-empty string`,
  );
  return value;
}

function assertStringArray(value: unknown, field: string): string[] {
  assert(
    Array.isArray(value) && value.length > 0,
    `${field} must be a non-empty array`,
  );
  const items = value.map((entry, idx) => {
    assert(
      typeof entry === "string" && entry.length > 0,
      `${field}[${idx}] must be a non-empty string`,
    );
    return entry;
  });
  return items;
}

function isFigureId(value: string): value is FigureId {
  return (NOW_FIGURE_IDS as readonly string[]).includes(value);
}

function assertFigurePayload(value: unknown, index: number): FigurePayload {
  assert(isRecord(value), `figures[${index}] must be an object`);
  const figureId = assertString(value.figure_id, `figures[${index}].figure_id`);
  assert(
    isFigureId(figureId),
    `figures[${index}].figure_id is not a supported now-set figure`,
  );

  assertString(value.schema_version, `figures[${index}].schema_version`);
  assertString(value.payload_version, `figures[${index}].payload_version`);
  assert(
    value.status === "pass" ||
      value.status === "warn" ||
      value.status === "fail",
    `figures[${index}].status invalid`,
  );
  assert(
    value.hard_gate === "pass" || value.hard_gate === "fail",
    `figures[${index}].hard_gate invalid`,
  );
  assertStringArray(value.contract_refs, `figures[${index}].contract_refs`);

  assert(
    isRecord(value.metrics),
    `figures[${index}].metrics must be an object`,
  );
  assert(
    isRecord(value.validation),
    `figures[${index}].validation must be an object`,
  );
  assert(
    typeof value.validation.ok === "boolean",
    `figures[${index}].validation.ok must be boolean`,
  );

  assert(
    isRecord(value.artifact),
    `figures[${index}].artifact must be an object`,
  );
  assertString(value.artifact.path, `figures[${index}].artifact.path`);
  assertString(value.artifact.sha256, `figures[${index}].artifact.sha256`);
  assertNumber(
    value.artifact.row_count,
    `figures[${index}].artifact.row_count`,
  );

  return value as unknown as FigurePayload;
}

function assertRunInvariants(run: ReportingRun): void {
  const byId = new Map(run.figures.map((figure) => [figure.figure_id, figure]));
  for (const requiredId of NOW_FIGURE_IDS) {
    assert(
      byId.has(requiredId),
      `missing required now-set figure: ${requiredId}`,
    );
  }

  const q03 = byId.get("Q-03_snapshot_lock_drift_panel");
  assert(isRecord(q03?.metrics), "Q-03 metrics missing");
  const reviewedRows = assertNumber(
    q03.metrics.reviewed_snapshot_rows,
    "Q-03.reviewed_snapshot_rows",
  );
  assert(reviewedRows >= 1, "Q-03.reviewed_snapshot_rows must be >= 1");

  const e04 = byId.get("E-04_rank2_quarantine_case_study");
  assert(isRecord(e04?.metrics), "E-04 metrics missing");
  assert(
    e04.metrics.mode === "frozen_case_study",
    "E-04.mode must be frozen_case_study",
  );
  assert(
    e04.metrics.source_stage === "post_batch10",
    "E-04.source_stage must be post_batch10",
  );
}

export function parseReportingRun(input: unknown): ReportingRun {
  assert(isRecord(input), "reporting run must be an object");

  const runId = assertString(input.run_id, "run_id");
  const schemaVersion = assertString(input.schema_version, "schema_version");
  const generatedAtUtc = assertString(
    input.generated_at_utc,
    "generated_at_utc",
  );
  const gitSha = assertString(input.git_sha, "git_sha");
  const sourceDbRef = assertString(input.source_db_ref, "source_db_ref");
  const contractVersion = assertString(
    input.contract_version,
    "contract_version",
  );

  const figuresRaw = input.figures;
  assert(
    Array.isArray(figuresRaw) && figuresRaw.length > 0,
    "figures must be a non-empty array",
  );
  const figures = figuresRaw.map((figure, index) =>
    assertFigurePayload(figure, index),
  );

  if ("source_db_meta" in input) {
    assert(
      isRecord(input.source_db_meta),
      "source_db_meta must be an object when present",
    );
    assert(
      input.source_db_meta.kind === "fixture" ||
        input.source_db_meta.kind === "db",
      "source_db_meta.kind must be fixture or db",
    );
    if (input.source_db_meta.host !== null) {
      assertString(input.source_db_meta.host, "source_db_meta.host");
    }
    if (input.source_db_meta.database !== null) {
      assertString(input.source_db_meta.database, "source_db_meta.database");
    }
    assert(
      typeof input.source_db_meta.redacted === "boolean",
      "source_db_meta.redacted must be boolean",
    );
  }

  const run: ReportingRun = {
    run_id: runId,
    schema_version: schemaVersion,
    generated_at_utc: generatedAtUtc,
    git_sha: gitSha,
    source_db_ref: sourceDbRef,
    source_db_meta: input.source_db_meta as ReportingRun["source_db_meta"],
    contract_version: contractVersion,
    trigger: input.trigger as ReportingRun["trigger"],
    source_file_hashes: isRecord(input.source_file_hashes)
      ? (input.source_file_hashes as Record<string, string>)
      : undefined,
    figures,
    summary: isRecord(input.summary)
      ? (input.summary as ReportingRun["summary"])
      : undefined,
    artifact: isRecord(input.artifact)
      ? {
          out_path: String(input.artifact.out_path ?? ""),
          sha256: String(input.artifact.sha256 ?? ""),
        }
      : undefined,
  };

  assertRunInvariants(run);
  return run;
}

export function parseRenderBaselineManifest(
  input: unknown,
): RenderBaselineManifest {
  assert(isRecord(input), "render manifest must be an object");
  assert(
    input.schema_version === "phase2-render-baseline-manifest-v1",
    "render manifest schema_version must be phase2-render-baseline-manifest-v1",
  );
  assertString(input.generated_at_utc, "render manifest generated_at_utc");

  assert(
    isRecord(input.source_run),
    "render manifest source_run must be an object",
  );
  assertString(input.source_run.run_id, "render manifest source_run.run_id");
  assertString(input.source_run.git_sha, "render manifest source_run.git_sha");
  assertString(
    input.source_run.source_db_ref,
    "render manifest source_run.source_db_ref",
  );
  assertString(
    input.source_run.contract_version,
    "render manifest source_run.contract_version",
  );

  assertStringArray(input.contract_refs, "render manifest contract_refs");

  assert(
    Array.isArray(input.scientific),
    "render manifest scientific must be an array",
  );
  for (let idx = 0; idx < input.scientific.length; idx += 1) {
    const row = input.scientific[idx];
    assert(isRecord(row), `render scientific[${idx}] must be object`);
    assertString(row.figure_id, `render scientific[${idx}].figure_id`);
    assertString(row.file, `render scientific[${idx}].file`);
    assertString(row.title, `render scientific[${idx}].title`);
    assertString(row.sha256, `render scientific[${idx}].sha256`);
  }

  assert(
    Array.isArray(input.public),
    "render manifest public must be an array",
  );
  for (let idx = 0; idx < input.public.length; idx += 1) {
    const row = input.public[idx];
    assert(isRecord(row), `render public[${idx}] must be object`);
    assertString(row.artifact_id, `render public[${idx}].artifact_id`);
    assertString(row.file, `render public[${idx}].file`);
    assertString(row.title, `render public[${idx}].title`);
    assertString(row.sha256, `render public[${idx}].sha256`);
  }

  return input as unknown as RenderBaselineManifest;
}

export function stableSortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
