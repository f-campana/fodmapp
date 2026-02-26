# PR Sequence And Gates

This document tracks what is already landed and what remains as the next gated options.

## Track Principle

- Use dedicated worktrees for concurrent tracks.
- Keep PRs narrow and reversible.
- Avoid ETL/schema/API behavior changes in frontend foundation PRs unless explicitly intended.

## Completed Sequence (Merged)

1. Path portability + health readiness landed.
2. Monorepo bootstrap + OpenAPI type contract + stale-check landed.
3. UI foundation/token track landed (`packages/ui`, `packages/design-tokens`, `packages/tailwind-config`, `apps/storybook`).
4. Data-engine coverage and swap expansion landed through Batch C closeout:
   - PR #30, #31, #32, #51.

## Current Gate State

- Data-engine expansion is currently constrained by second-review availability:
  - deferred rows: 56 (issue #26)
  - Batch04 feasibility after Batch C: 10 candidates, 0 single-review eligible
- No next sprint is locked in this document; planning is intentionally paused.

## Next Options (When Planning Resumes)

1. Reviewer-unblock path (non-code + activation pass)

- Scope: resolve issue #26 by completing required second reviews and running batch activation checks.
- Gate: deferred approvals activate cleanly with snapshot and second-review invariants.

2. Product/frontend path (with current 30 active rules)

- Scope: start first app shell/flow consuming `@fodmap/types` and API v0.
- Gate: agreed first persona + flow spec; route-level integration tests green.

3. Platform hardening path

- Scope: rollup publish/swap hardening (`phase3_rollups_compute.sql`) before user-facing traffic.
- Gate: atomic refresh behavior with no API contract break.

4. Migration path (`dbmate`) on first schema-change sprint

- Scope: migration baseline + CI migration smoke apply.
- Gate: fresh DB migration apply success; canonical schema sync policy documented.

## Merge Gate Checklist (Default)

- `./.github/scripts/quality-gate.sh`
- Relevant workspace checks (`pnpm` build/typecheck/test for changed packages)
- API non-regression check when touching shared CI/workspace files:
  - `pytest -m "not integration" api/tests`
