# Phase 2 Reporting Task Breakdown

## Execution mode

- now: release-critical
- next: accepted if capacity allows
- backlog: deferred

## Now set (release sequence)

1. [now][S] Add reporting module directories and docs shell
   - Create `/Users/fabiencampana/Documents/Fodmap-reporting-plan/etl/phase2/reporting/...` structure.
2. [now][S] Author `reporting_snapshot_policy.yaml` with exact/recursive baseline allowlist
   - Include `contracts/baselines/**/*.json`.
   - Include strict baseline update path lock.
3. [now][M] Author schemas
   - `reporting_run.schema.json`
   - `figure_payloads.schema.json`
   - `parser_scope.schema.json`
   - `semantic_compare_fields.yaml`
4. [now][M] Author generated stage contract artifact
   - `contracts/generated/stage_contracts.generated.yaml` built from repo-relative inputs.
5. [now][M] Add now-set baseline payload
   - `contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json`
6. [now][M] Add PR smoke fixtures for now-set
   - `tests/fixtures/now-set/query-results/*.json`
7. [now][M] Add `.github/workflows/phase2-reporting.yml`
   - Split PR smoke lane and main/manual full lane.
   - Ensure PR uses fixture mode.
   - Ensure semantic baseline compare is included in both lanes.
8. [now][M] Add dedicated lint + collector/comparator implementation scripts
   - `contract_lint.py`
   - `collect_reporting.py` with `--source fixture|db`
   - `compare_baselines.py` with `--compare-scope semantic|full`
9. [now][M] Add SQL extractor set for DB full-lane collection
   - `p01`..`e04` extractor SQL files
10. [now][M] Add reporting module README and plan cross-links
   - execution notes for run modes and manual refresh process.
11. [now][M] Add acceptance checklist
   - parser fail-loud coverage (unknown source/missing scalar/empty now row)
   - Q-03 reviewed-snapshot scope non-empty
   - E-04 frozen mode + source stage fields fixed.
12. [now][M] Split baseline refresh governance into two controlled modes
   - `baseline_update` for generated contracts + baseline JSON only
   - `render_baseline_update` for render baseline assets only (`svg/html/render-manifest json`)
   - enforce mutual exclusion at workflow level
13. [now][S] Add review/self-reflection gate before CI/manual runs
   - author `docs/plans/phase2-reporting-review-checkpoint.md`
   - include findings dispositions, residual risks, and exact verification commands/outcomes
14. [now][M] Phase 4 delivery hardening (post-remediation)
   - materialize deterministic stage contracts into DB snapshot table for full lane
   - remove static stage constants from `p01/p02` SQL extractors
   - add figure-level semantic fail-loud checks in `collect_reporting.py`
   - enforce fixture source hash freshness checks
   - add fixture/baseline semantic parity tests + optional DB parity gate
   - align docs with blocking full lane and split baseline update modes

## Next set (deferred)

- `P-04_status_funnel` — M
- `Q-01_assertion_health_matrix` — M (high parser maintenance risk)
- `E-01_evidence_tier_confidence_profile` — M
- `E-02_source_provenance_by_subtype` — M
- `U-01_swap_quality_overview` — M
- `U-02_swap_ordering_compliance` — S
- `U-03_freshness_badge_panel` — S
- `U-05_bilingual_instruction_completeness` — S

## Backlog

- `Q-05_ci_contract_coverage_map` — M
- `E-05_method_comparator_mix_monitor` — M
- `U-04_uncertainty_disclosure_card` — S (messaging risk)
- `contract_lint.py` migration from deprecated `jsonschema.RefResolver` to `referencing` APIs — S

## Dependencies

- `P-01`/`P-02` require `stage_contracts.generated.yaml` and check-script anchors.
- `Q-02` requires phase2 replay + phase3 rollup contract anchors.
- `Q-03` requires snapshot drift checks from phase3 activation script and scope non-empty rule.
- `Q-04` requires phase2 quarantine status + API rank2 exclusion tests.
- `E-03` requires threshold provenance checks from phase3 rollup checks.
- `E-04` requires post-batch10 frozen snapshot contract semantics.

## Risks and mitigation

- Baseline values may require regeneration once reporting parser is implemented.
- Parser scope will fail hard on any ad-hoc SQL parsing if input files change format.
- If phase2/phase3 contracts change, baseline refresh process must be run explicitly and approved (`baseline_update_confirmed=true` plus approver id).
