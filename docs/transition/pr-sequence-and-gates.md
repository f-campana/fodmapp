# PR Sequence And Gates

This sequence reflects current discussions and the need to keep architecture work isolated from ongoing data-engine delivery.

## Track Principle

- Use dedicated worktrees.
- Keep PRs narrow and reversible.
- Avoid ETL/schema/API behavior changes in frontend foundation PRs.

## Recommended Next Architecture Sequence

1. PR-2: Shared UI Foundation + Storybook (isolated)
- Scope: `packages/ui`, `apps/storybook`, workspace/CI wiring for UI checks.
- Gate: build/typecheck/unit+a11y/storybook checks green.

2. PR-3: Token Package + Tailwind Shared Package Finalization
- Scope: establish `packages/design-tokens` and `packages/tailwind-config` contracts and consumption by `packages/ui`.
- Gate: deterministic token build outputs + UI consumes semantic tokens only.

3. PR-4: App Skeleton(s) That Consume UI And Types
- Scope: start with one real app shell (likely `apps/app`) using `@fodmap/ui` and `@fodmap/types`.
- Gate: public SSR route stubs + gated area stubs + i18n/monitoring/auth placeholders compile.

4. PR-5: DB Migration Track Introduction (`dbmate`) when first schema change is needed
- Scope: migration baseline + CI smoke apply.
- Gate: fresh DB migration apply success, canonical schema sync policy documented.

5. PR-6: Rollup Publish/Swap Hardening before user-facing traffic
- Scope: replace drop/recreate refresh with publish/swap pattern.
- Gate: no API contract break; rollup refresh remains atomic.

## Notes On Timing

- If a schema-affecting architecture change appears before PR-4, move migration tooling earlier.
- If frontend product timeline accelerates, PR-3 and PR-4 can be combined as one sprint.
- Keep data-engine milestones independent; do not block them on frontend scaffolding.

## Merge Gate Checklist (Every Architecture PR)

- `./.github/scripts/quality-gate.sh`
- Relevant workspace checks (`pnpm` build/typecheck/test for changed packages)
- API non-regression check when touching shared CI/workspace files:
  - `pytest -m "not integration" api/tests`
