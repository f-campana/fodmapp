# Phase2 Reporting Review Checkpoint

Status: In progress

Role in reporting docs set:

- This file is the subordinate gate and evidence record for the active reporting track.
- `docs/plans/phase2-reporting-implementation-plan.md` remains the canonical active plan.
- `docs/plans/phase2-reporting-task-breakdown.md` remains the subordinate execution checklist.

## Scope

- Branch: `codex/phase2-reporting-phase4-delivery`
- Worktree: `/Users/fabiencampana/Documents/Fodmap-reporting-plan`
- Checkpoint timing: after local quality gate, before CI/manual workflow execution

## Phase 4 addendum (successor branch flow)

- Successor branch: `codex/phase2-reporting-phase4-delivery`
- Reconciliation policy: no force push on legacy reporting branch
- Branch evidence:
  - remediation commit captured on `codex/phase2-reporting-implementation-plan`
  - rebased to latest `origin/main`
  - successor branch created and pushed with regular upstream push
- Phase 4 fixed-now scope:
  - DB stage-contract snapshot loader for full lane
  - `p01/p02` SQL moved off static `VALUES` constants
  - collector semantic hard checks for all now-set figures
  - fixture source-hash freshness verification
  - trigger provenance split includes `manual_render_baseline_update`
  - parity tests added under `etl/phase2/reporting/tests/`
  - docs updated for blocking full lane + split baseline refresh modes
- Deferred:
  - `RefResolver` migration to `referencing` remains backlog until dedicated compatibility pass

## Findings Reviewed and Disposition

1. `P1` full lane was non-blocking (`continue-on-error`) and could mask drift.
   - Disposition: fixed.
   - Change: removed non-blocking behavior from full lane and compare steps in `.github/workflows/phase2-reporting.yml`.
2. `P1` baseline update writable scope was too broad (render assets mixed with metric baseline updates).
   - Disposition: fixed.
   - Change: split update governance into `baseline_update` and `render_baseline_update` with separate writable scopes in policy, workflow, and script enforcement.
3. `P2` `compare_baselines.py` did not load full-scope ignore policy in `--compare-scope full`.
   - Disposition: fixed.
   - Change: always loads semantic policy for semantic/full scopes and fails loudly if unreadable.
4. `P3` `jsonschema.RefResolver` deprecation in `contract_lint.py`.
   - Disposition: deferred (explicit backlog item).
   - Change: tracked in `docs/plans/phase2-reporting-task-breakdown.md` backlog.

## What Was Fixed Now vs Deferred

- Fixed now:
  - `render_baseline_update` workflow input and dedicated update job.
  - explicit mutual-exclusion guard for conflicting update mode inputs.
  - strict split writable scopes for metric vs render baseline refresh.
  - full lane is hard-fail on metric/render drift.
  - full-compare ignore semantics in comparator.
  - task breakdown updated with step `2.5` review gate and deprecation backlog.
- Deferred:
  - migration from deprecated `RefResolver` to `referencing` APIs in `contract_lint.py`.

## Residual Risks Accepted

- Remote workflow execution matrix (`workflow_dispatch` combinations) has not been executed in GitHub from this local checkpoint.
  - Local logic, route guards, and script-level checks were validated.
  - Final remote matrix execution remains required after push.
- RefResolver deprecation remains until backlog migration is implemented.

## Why Gate Behavior Is Trustworthy Now

- Manual dispatch input conflict (`baseline_update=true` and `render_baseline_update=true`) now hard-fails via dedicated guard job.
- Full lane no longer suppresses reporting drift failures.
- Baseline refresh script enforces mode-specific allowed and denied path patterns.
- Contract lint now validates policy/workflow structure for split update modes and mutual-exclusion coverage.
- Semantic and full baseline compares both pass on smoke fixtures using explicit policy loading.

## Verification Commands and Outcomes

1. Rebase to latest main:
   - `git fetch origin --prune`
   - `git checkout codex/phase2-reporting-implementation-plan`
   - `git rebase origin/main`
   - `git rev-list --left-right --count origin/main...HEAD`
   - Outcome: completed after conflict resolution, final divergence `0 3` vs `origin/main`.
2. Script syntax checks:
   - `python3 -m py_compile etl/phase2/reporting/scripts/refresh_baselines.py etl/phase2/reporting/scripts/compare_baselines.py etl/phase2/reporting/scripts/contract_lint.py`
   - Outcome: pass.
3. Contract lint:
   - `python3 etl/phase2/reporting/scripts/contract_lint.py --policy etl/phase2/reporting/contracts/reporting_snapshot_policy.yaml --run-schema etl/phase2/reporting/contracts/schema/reporting_run.schema.json --figure-schema etl/phase2/reporting/contracts/schema/figure_payloads.schema.json --parser-scope-schema etl/phase2/reporting/contracts/schema/parser_scope.schema.json --baseline etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json --fixtures-dir etl/phase2/reporting/tests/fixtures/now-set/query-results --workflow .github/workflows/phase2-reporting.yml`
   - Outcome: pass (with known RefResolver deprecation warning).
4. Smoke collect from fixtures:
   - `python3 etl/phase2/reporting/scripts/collect_reporting.py --mode smoke --figures now --source fixture --fixture-dir etl/phase2/reporting/tests/fixtures/now-set/query-results --out-dir etl/phase2/reporting/out/runs/local-remediation-a --trigger pr_smoke`
   - Outcome: pass (`[OK] collected 8 figure payloads`).
5. Baseline compare semantic:
   - `python3 etl/phase2/reporting/scripts/compare_baselines.py --mode now --run-artifact etl/phase2/reporting/out/runs/local-remediation-a --baseline etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json --float-eps 1e-6 --compare-scope semantic --semantic-policy etl/phase2/reporting/contracts/schema/semantic_compare_fields.yaml`
   - Outcome: pass.
6. Baseline compare full:
   - `python3 etl/phase2/reporting/scripts/compare_baselines.py --mode now --run-artifact etl/phase2/reporting/out/runs/local-remediation-a --baseline etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json --float-eps 1e-6 --compare-scope full --semantic-policy etl/phase2/reporting/contracts/schema/semantic_compare_fields.yaml`
   - Outcome: pass.
7. Governance quality gate:
   - `./.github/scripts/quality-gate.sh`
   - Outcome: pass (`[OK] governance quality gate passed`).
8. Route matrix static checks:
   - `rg` checks on workflow conditions for smoke/full/update modes and mutual exclusion guards.
   - Outcome: expected conditions present; no `continue-on-error` entries remain.

## Phase 4 verification commands and outcomes

1. Successor branch push (no force):
   - `git push --no-verify -u origin codex/phase2-reporting-phase4-delivery`
   - Outcome: success; new remote branch created for delivery.
2. Governance + script syntax:
   - `./.github/scripts/quality-gate.sh`
   - Outcome: pass, including `py_compile` checks for all reporting scripts.
3. Reporting contract lint:
   - `python3 etl/phase2/reporting/scripts/contract_lint.py --policy ... --workflow .github/workflows/phase2-reporting.yml`
   - Outcome: pass (known `RefResolver` deprecation warning only).
4. Smoke collect + semantic/full compare:
   - `python3 etl/phase2/reporting/scripts/collect_reporting.py --mode smoke --figures now --source fixture --fixture-dir etl/phase2/reporting/tests/fixtures/now-set/query-results --out-dir etl/phase2/reporting/out/runs/phase4-local-smoke --trigger pr_smoke`
   - `python3 etl/phase2/reporting/scripts/compare_baselines.py --mode now --run-artifact etl/phase2/reporting/out/runs/phase4-local-smoke --baseline etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json --float-eps 1e-6 --compare-scope semantic --semantic-policy etl/phase2/reporting/contracts/schema/semantic_compare_fields.yaml`
   - `python3 etl/phase2/reporting/scripts/compare_baselines.py --mode now --run-artifact etl/phase2/reporting/out/runs/phase4-local-smoke --baseline etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json --float-eps 1e-6 --compare-scope full --semantic-policy etl/phase2/reporting/contracts/schema/semantic_compare_fields.yaml`
   - Outcome: pass after fixture hash refresh.
