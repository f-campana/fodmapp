\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS reporting_stage_contract_snapshot (
  stage_order INTEGER PRIMARY KEY,
  stage_id TEXT NOT NULL UNIQUE,
  source_file TEXT NOT NULL,
  resolved_rows INTEGER NOT NULL CHECK (resolved_rows >= 0),
  unresolved_rows INTEGER NOT NULL CHECK (unresolved_rows >= 0),
  threshold_set_rows INTEGER NOT NULL CHECK (threshold_set_rows >= 0),
  with_candidates_rows INTEGER NOT NULL CHECK (with_candidates_rows >= 0),
  without_candidates_rows INTEGER NOT NULL CHECK (without_candidates_rows >= 0)
);

TRUNCATE TABLE reporting_stage_contract_snapshot;
