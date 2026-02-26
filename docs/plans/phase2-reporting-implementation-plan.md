# Phase 2 Reporting Implementation Plan v4

## Scope and intent

- Objective: implement deterministic reporting for the finalized now-set and establish the execution skeleton for next/backlog items.
- Worktree target: `/Users/fabiencampana/Documents/Fodmap-reporting-plan`
- Branch target: `codex/phase2-reporting-implementation-plan`
- Reporting now-set scope: `P-01`, `P-02`, `P-03`, `Q-02`, `Q-03`, `Q-04`, `E-03`, `E-04`

## Architecture summary

`etl/phase2/reporting` is the module boundary for:

- contracts and generated artifacts (`contracts/`)
- script stubs and future collectors (`scripts/`)
- query SQL manifests (`sql/`) and static config stubs (`config/`)
- schemas (`contracts/schema/`)
- SQL contract binders and view snapshots (`contracts/baselines/`)
- smoke fixtures (`tests/fixtures/`)
- workflow outputs (`out/`)
- CI entrypoint (`.github/workflows/phase2-reporting.yml`)

The design is **contract-first and parser-hard**:
- Parser can only consume allowlisted source files/patterns.
- Report outputs must validate against JSON schemas.
- Baselines are committed so PR review can detect drift on deterministic values.
- Runtime artifacts are ephemeral under `out/`.

## File map (to create in this worktree)

- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/docs/plans/phase2-reporting-implementation-plan.md`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/docs/plans/phase2-reporting-task-breakdown.md`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/generated/stage_contracts.generated.yaml`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/reporting_snapshot_policy.yaml`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/schema/reporting_run.schema.json`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/schema/figure_payloads.schema.json`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/schema/parser_scope.schema.json`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/schema/semantic_compare_fields.yaml`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/config/.gitkeep`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/p01_stage_progression.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/p02_candidate_pool_split.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/p03_gap_completion_matrix.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/q02_critical_contract_scorecard.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/q03_snapshot_lock_drift.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/q04_rank2_exclusion_audit.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/e03_threshold_provenance.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/sql/e04_frozen_case_study.sql`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/scripts/collect_reporting.py`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/scripts/compare_baselines.py`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/scripts/contract_lint.py`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/scripts/replay_seed.py`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/scripts/publish_run.py`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/scripts/refresh_baselines.py`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/tests/fixtures/now-set/query-results/`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/tests/fixtures/now-set/README.md`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/out/.gitkeep`
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/.github/workflows/phase2-reporting.yml`

## 1) Parser scope: lock to deterministic stage/wave inputs

The parser allowlist must include all stage-contract and now-set evidence inputs, all repo-relative:

- `etl/phase2/POD_WAVES_RUNBOOK.md`
- `etl/phase2/decisions/phase2_wave_manifest.csv`
- `etl/phase2/sql/phase2_scaffold_views.sql`
- `etl/phase2/sql/phase2_replay_final_checks.sql`
- `etl/phase2/sql/phase2_post_batch10_checks.sql`
- `etl/phase2/sql/phase2_post_quarantine_checks.sql`
- `etl/phase2/sql/phase2_fructan_wave01_checks.sql`
- `etl/phase2/sql/phase2_fructan_wave02_checks.sql`
- `etl/phase2/sql/phase2_gos_wave01_checks.sql`
- `etl/phase2/sql/phase2_gos_wave02_checks.sql`
- `etl/phase2/sql/phase2_polyol_wave01_checks.sql`
- `etl/phase2/sql/phase2_polyol_wave02_checks.sql`
- `etl/phase3/PRODUCT_LAYER_RUNBOOK.md`
- `etl/phase3/sql/phase3_swap_activation_apply.sql`
- `etl/phase3/sql/phase3_rollups_6subtype_checks.sql`
- `api/app/sql.py`
- `api/tests/test_swaps.py`
- `api/openapi/v0.yaml`

Any file outside this allowlist is a hard parse failure.

Parse fail-loud rules:

- unknown file
- unknown metric key
- missing expected scalar for now-set figure
- duplicate row in scalar extraction
- null/empty scalar value

## 2) Baseline governance and allowlist

`/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/contracts/reporting_snapshot_policy.yaml`

- Committed artifacts:
  - `contracts/generated/*.generated.yaml`
  - `contracts/baselines/**/*.json`
  - `contracts/schema/*`
  - `contracts/reporting_snapshot_policy.yaml`
- Non-committed artifacts:
  - `out/**`

Baseline pattern requirement:

- `contracts/baselines/**/*.json`

Exact baseline files for now-set (explicit allowlist):

- `contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json`

Optional strict list field: `exact_baseline_file_allowlist`.

Baseline drift policy:

- integer fields are exact
- floats use tolerance `1e-6`
- missing required field is hard fail
- status flips to `warn` or `fail` for now-set figures are hard fail

## 3) Baseline refresh mode

`workflow_dispatch` input `baseline_update=true` enables controlled baseline refresh.

Hard guardrails:
- `--` clean tree required before any file write.
- `--` approval inputs required:
  - `baseline_update_confirmed` (boolean, explicit reviewer ack)
  - `baseline_update_approved_by` (name or ticket ID)
- baseline-update lane executes replay+seed+DB collect before refresh (no log-only refresh path).
- writable-only path scope:
  - `etl/phase2/reporting/contracts/generated/*.generated.yaml`
  - `etl/phase2/reporting/contracts/baselines/**/*.json`
- schema and workflow files are blocked from edits in baseline-refresh mode.
- Baseline refresh must emit a run log with:
  - `schema_version`
  - `source_file_hashes`
  - `run_id`

## 4) Canonical JSON schemas

### `etl/phase2/reporting/contracts/schema/figure_payloads.schema.json`

Defines strict payload shape for now-set figures:

- `P-01_stage_progression_contract_curve`
  - `baseline_resolved`, `baseline_unresolved`
  - per-stage `executed`, `resolved_rows`, `unresolved_rows`, `delta_resolved_rows`, `expected_*`
- `P-02_candidate_pool_split_by_stage`
  - per-stage `with_candidates_rows`, `without_candidates_rows`, `pool_closure_rate`
- `P-03_gap_completion_matrix`
  - per-bucket `bucket`, `priority_rows`, `resolved_rows`, `completed_rows`, `unresolved_rows`, `pending_measurement_rows`
- `Q-02_critical_contract_scorecard`
  - phase2 tuple, phase3 tuple, swap status tuple, pass flags
- `Q-03_snapshot_lock_drift_panel`
  - `reviewed_snapshot_rows` must be `>= 1`
- `Q-04_rank2_exclusion_audit`
  - DB/API rank2 exclusion counts and pass status
- `E-03_threshold_provenance_completeness`
  - invalid threshold source count, missing default citation count, default threshold share
- `E-04_rank2_quarantine_case_study`
  - `mode` + `source_stage` constraints

### `etl/phase2/reporting/contracts/schema/reporting_run.schema.json`

Run-level schema covering:
- `run_id`
- `schema_version`
- `generated_at_utc`
- `git_sha`
- `source_db_ref` (redacted: `fixture://now-set` or `db://<host>/<database>`)
- optional `source_db_meta` (`kind`, `host`, `database`, `redacted`)
- `contract_version`
- per-figure payload objects
- parser and baseline contract refs

### `etl/phase2/reporting/contracts/schema/parser_scope.schema.json`

Machine schema for parser scope configuration:
- exact files list
- glob patterns
- allow/deny semantics
- fail-loud action map

## 5) CI split and trigger strategy

Workflow: `.github/workflows/phase2-reporting.yml`

### PR / default-manual lane

Jobs:
1. `contract-lint`
2. `figure-collect-smoke` (fixture-based)
3. `baseline-compare-now-only`
4. upload now-set artifacts + baseline diff

No replay or seed in this lane.

PR trigger path filters:
- `etl/phase2/**`
- `etl/phase3/**`
- `api/**`
- `schema/**`
- `.github/workflows/phase2-reporting.yml`
- `.github/workflows/api.yml`
- `.github/workflows/ci.yml`

`workflow_dispatch` with both `baseline_update=false` and `force_full_run=false` also executes this same smoke lane.

### main / manual full lane

Jobs:
1. `contract-lint`
2. `full-run-ramp`:
   - replay + seed
   - full now-set collect from DB SQL extractors
   - semantic baseline compare (`continue-on-error: true` during ramp)
   - upload full-run artifacts

`workflow_dispatch` input `force_full_run=true` (or push to `main`) executes replay + seed.  
`workflow_dispatch` input `baseline_update=true` executes controlled baseline mutation with strict path restrictions.

## 6) Smoke fixture contract

PR and default `workflow_dispatch` smoke mode uses:
- `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/tests/fixtures/now-set/query-results/*.json`

Each fixture MUST include:
- `source_file_hashes` map
- query payload for the target figure only
- scalar completeness for now-set figure.

No live DB reads in PR smoke mode.

## 7) now-set figure extraction anchors (deterministic)

- `P-01` and stage semantics:
  - stage progression and wave order anchored to `etl/phase2/POD_WAVES_RUNBOOK.md` (`etl/phase2/decisions/phase2_wave_manifest.csv`)
  - historical expected values from execution checks at each wave
- `P-02`:
  - candidate split values from unresolved ranks and `v_phase2_resolution_candidates`
- `P-03`:
  - `pending_measurement_rows` from `v_phase2_gap_completion` and `ffm.is_current = TRUE` in `etl/phase2/sql/phase2_scaffold_views.sql:74`
- `Q-02`:
  - phase2 tuple checks in `etl/phase2/sql/phase2_replay_final_checks.sql:92`
  - threshold and API-level checks in rollup/quality contracts
- `Q-03`:
  - snapshot lock fields in `etl/phase3/sql/phase3_swap_activation_apply.sql:216`
  - non-empty reviewed scope enforced
- `Q-04`:
  - rank2 exclusion from API SQL and tests (`api/app/sql.py:236`, `api/tests/test_swaps.py:111`)
  - reporting SQL mirrors API `active_rules` semantics (active-only + rank2 exclusion + score floor)
- `E-03`:
  - threshold provenance from `etl/phase3/sql/phase3_rollups_6subtype_checks.sql:104`
- `E-04`:
  - frozen case-study contract anchored to batch10 quarantine checks (`etl/phase2/sql/phase2_post_quarantine_checks.sql:142`, `etl/phase2/sql/phase2_post_quarantine_checks.sql:157`)

## 8) Reporting snapshot and run artifacts

- run artifacts:
  - `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/out/runs/<run_id>/`
  - includes uncommitted JSON payload files + summary log
  - DB targets are persisted in redacted form only; replay manifests do not persist full stdout/stderr blobs
- committed baselines:
  - `etl/phase2/reporting/contracts/baselines/**/*.json`

Policy: committed baseline changes are the only durable output for drift review; run artifacts are for CI run traceability.

## 9) Test plan

### Schema + contract
- JSON schema validation for reporting_run + per-figure payloads
- parser scope validation using strict allowlist

### Baseline + drift
- exact integer comparison
- epsilon float compare with `1e-6`
- hard fail if `Q-03` reviewed scope is empty

### Behavioral
- frozen case-study hard checks:
  - `mode == frozen_case_study`
  - `source_stage == post_batch10`
- no runtime recompute path for `E-04` mode

## 10) Milestones and sequencing

- Now (in execution order):
  1. create contract/schemas/baselines/fixtures/docs
  2. add workflow split + smoke/full gating
  3. add parser allowlist enforcement and baseline policy
  4. wire now-set baseline compare gates
- Next:
  - `P`/`Q`/`E`/`U` next-tier visuals and supporting schema extensions
- Backlog:
  - governance-only or user-comms-heavy visuals with uncertain interpretation

## 11) Open questions and decision log

- **Resolved decision 1:** baseline refresh is explicit, controlled mode only and requires explicit confirmation plus approver id (`baseline_update_confirmed`, `baseline_update_approved_by`) in `baseline_update` lane.
- **Resolved decision 2:** PR lane uses fixture-based smoke only and must not run replay/seed.
- **Resolved decision 3:** parser allowlist for now-set includes manifest and all wave check SQL inputs in addition to existing phase2/phase3/API contract files.
- **Resolved decision 4:** reporting baseline policy is repo-local and explicit with nested baseline glob (`contracts/baselines/**/*.json`) plus exact now-set file allowlist.
- **Resolved decision 5:** `E-04` is permanently frozen case-study semantics (`mode=frozen_case_study`, `source_stage=post_batch10`) with no runtime recompute path accepted.

Open questions: none for the now-set implementation scope.
