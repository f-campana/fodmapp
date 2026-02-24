# Sprint Planning Handoff (Architecture And Scaffolding)

Last updated: 2026-02-24

## Purpose

This handoff is for the next Codex agent who will plan the next sprint.
Focus is architecture/scaffolding only, in parallel with ongoing data-engine work.

This is a planning handoff, not an implementation brief.

## Scope Guardrails

In scope for this sprint planning:

1. Frontend/app scaffolding sequence and PR breakdown.
2. Workspace/CI implications for scaffold work.
3. Package-level contracts (`@fodmap/ui`, `@fodmap/types`, token/tailwind packages).
4. Worktree/branch strategy to keep architecture track isolated.

Out of scope for this sprint planning:

1. ETL/Phase2/Phase3 data-engine changes.
2. SQL product-layer redesign (except planning dependencies).
3. Backend runtime feature work not required by scaffold boundaries.
4. Full barcode feature rollout planning (separate track, mixed scope today).

## Current Baseline (On `main`)

Architecture/scaffold work already merged:

1. Monorepo bootstrap: `pnpm` + Turborepo.
2. OpenAPI TS generation package and CI stale-check.
3. Root environment contract docs.
4. Shared frontend foundation:
   - `apps/storybook`
   - `packages/ui`
   - `packages/design-tokens`
   - `packages/tailwind-config`
5. Transition docs under `/docs`.

Important unresolved architecture items:

1. No app scaffolds yet for:
   - `apps/app`
   - `apps/marketing`
   - `apps/research`
2. No migration track (`dbmate`) yet in repo.
3. Rollup refresh publish/swap hardening still pending.

## Active Branch/Worktree Context

As of 2026-02-24:

1. Worktrees:
   - `/Users/fabiencampana/Documents/Fodmap` on `main`
   - `/Users/fabiencampana/Documents/Fodmap-barcode-v1` on `codex/barcode-feature-v1`
2. `codex/barcode-feature-v1` is ahead by 7 commits and mixes concerns:
   - architecture/workspace/package additions (barcode packages, storybook story, CI/env updates)
   - backend/schema changes (`api/**`, `schema/fodmap_fr_schema.sql`)

Planning implication:

- Do not couple sprint architecture plan to barcode backend/schema changes.
- Keep architecture scaffold PRs separable and reviewable.

## Locked Decisions To Respect

1. Architecture track and data-engine track should not collide.
2. Tailwind v4 is the frontend styling baseline.
3. UI library bootstraps from shadcn patterns and evolves incrementally.
4. Use token source package plus Tailwind shared package (not either/or).
5. OpenAPI contract source of truth remains `api/openapi/v0.yaml`.

## Recommended Sprint Planning Objective

Primary objective:

Plan scaffold rollout for real app consumption, starting with `apps/app`.

Reason:

`apps/app` is the first meaningful integration point for UI, generated API types, i18n/auth/monitoring stubs, and environment contract.

Secondary objective:

Prepare a follow-up scaffold plan for `apps/marketing` and `apps/research` as a combined content-site phase.

## Required Output From Planning Agent

Produce a sprint planning document that includes:

1. Sprint goal statement (single sentence).
2. PR-level breakdown (small, mergeable slices).
3. Exact file/folder touch map per PR.
4. CI and validation commands per PR.
5. Risk list and mitigations per PR.
6. Dependencies and sequencing logic.
7. Explicit out-of-scope list.
8. Acceptance criteria per PR.

The plan must clearly separate:

1. planning assumptions,
2. hard requirements,
3. optional enhancements.

## Suggested PR Skeleton For Planning

Use this as a planning baseline (adjust if needed):

1. PR-A: `apps/app` minimal scaffold
   - Next.js app shell only
   - consumption of `@fodmap/ui` and `@fodmap/types`
   - FR-first i18n scaffolding placeholders
   - no production auth/business logic yet
2. PR-B: `apps/app` cross-cutting bootstrap
   - error monitoring stub wiring
   - consent/analytics placeholders
   - env contract additions required by the app
3. PR-C: `apps/marketing` + `apps/research` Astro scaffolds
   - shared i18n/content conventions
   - basic build/test wiring

If the planning agent proposes a different sequence, it must justify why.

## Validation Baseline For Planned PRs

Minimum validation references to include in sprint plan:

1. `./.github/scripts/quality-gate.sh`
2. `pnpm install --frozen-lockfile`
3. `pnpm openapi:check`
4. package/app specific build/typecheck/test commands
5. `pytest -m "not integration" api/tests` when shared CI/workspace changes are touched

## Questions The Planning Agent Must Resolve Up Front

1. Should `apps/app` include auth framework wiring in first scaffold PR, or defer to next PR?
2. Which parts are strict placeholders vs immediately executable flows?
3. What minimum route set is needed to prove scaffold viability?
4. What env vars are required now vs reserved for later?
5. How to avoid coupling app scaffold PRs to barcode branch work?

## References The Planning Agent Must Read First

1. `/Users/fabiencampana/Documents/Fodmap/docs/architecture/boundaries-and-contracts.md`
2. `/Users/fabiencampana/Documents/Fodmap/docs/architecture/decision-register.md`
3. `/Users/fabiencampana/Documents/Fodmap/docs/transition/current-state-snapshot.md`
4. `/Users/fabiencampana/Documents/Fodmap/docs/transition/pr-sequence-and-gates.md`
5. `/Users/fabiencampana/Documents/Fodmap/docs/frontend/strategy.md`
6. `/Users/fabiencampana/Documents/Fodmap/docs/frontend/tailwind-v4-token-architecture.md`
7. `/Users/fabiencampana/Documents/Fodmap/docs/frontend/shadcn-bootstrap-plan.md`

## Definition Of Done (For Sprint Planning Task)

Planning handoff is complete only when:

1. A concrete PR sequence exists with explicit gates.
2. Each PR has bounded scope and test commands.
3. Coupling risks with data-engine and barcode tracks are addressed.
4. `apps/app` is treated as first-class next scaffold target.
5. Deferments are explicit, not implicit.
