# Architecture Decision Register

Status: Implemented
Audience: Reviewer or auditor; Maintainer or operator; Contributor or engineer
Scope: Current decision status for repo-wide architecture, platform, and operations choices.
Related docs: [docs/foundation/project-definition.md](../foundation/project-definition.md), [docs/foundation/documentation-personas.md](../foundation/documentation-personas.md), [docs/README.md](../README.md)
Last reviewed: 2026-03-21

Status definitions:

- `Implemented`: landed on `main`.
- `Accepted`: agreed direction, pending implementation.
- `In progress`: active in dedicated worktree but not merged.
- `Planned`: accepted target direction.
- `Open`: unresolved timing or choice.

## Decision Table

| ID       | Decision                                                                                                              | Status      | Notes                                                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-001  | Keep 3-layer separation: evidence, knowledge, serving                                                                 | Planned     | Concept is agreed; physical folder split deferred                                                                                                                                                        |
| ADR-002  | Keep FastAPI as serving runtime for now; ETL stays Python                                                             | Implemented | No serving rewrite in current transition phase                                                                                                                                                           |
| ADR-003  | Monorepo bootstrap with `pnpm` + Turborepo                                                                            | Implemented | Landed in `main` (`package.json`, `pnpm-workspace.yaml`, `turbo.json`)                                                                                                                                   |
| ADR-004  | OpenAPI generated TS contract under `packages/types` + CI stale-check                                                 | Implemented | Landed in `main` (`openapi-types` CI job)                                                                                                                                                                |
| ADR-005  | Root environment contract: `.env.example` + `infra/ci/ENVIRONMENT.md`                                                 | Implemented | Landed in `main`                                                                                                                                                                                         |
| ADR-006  | Path portability in Phase2/Phase3 scripts (repo-relative)                                                             | Implemented | Landed via replay/seed script updates                                                                                                                                                                    |
| ADR-007  | `/v0/health` must reflect DB readiness                                                                                | Implemented | Returns `503` on DB outage                                                                                                                                                                               |
| ADR-008  | Use `dbmate` for SQL-first migration workflow                                                                         | In progress | Baseline migration lane, repo commands, and smoke validation are active in `codex/dbmate-neon-bootstrap`; merge pending.                                                                                 |
| ADR-009  | Neon branch policy (`main` prod, `staging`, `pr-*`)                                                                   | Planned     | Still blocked on dbmate landing and later hosted-environment activation work.                                                                                                                            |
| ADR-010  | Next.js app + Astro marketing/research split                                                                          | Implemented | `apps/app`, `apps/marketing`, and `apps/research` scaffolds are merged on `main`                                                                                                                         |
| ADR-011  | Clerk (EU), Sentry, Plausible, Axeptio as cross-cutting frontend stack                                                | In progress | Env-gated runtime baseline landed for Clerk/Sentry/Plausible; Axeptio remains deferred/no-op pending activation readiness                                                                                |
| ADR-012  | Start UI library from shadcn/ui primitives and iterate                                                                | Implemented | `packages/ui` + Storybook foundations are merged on `main`                                                                                                                                               |
| ADR-013  | Tailwind v4 strategy uses both `design-tokens` and Tailwind shared package                                            | Implemented | `design-tokens` and `tailwind-config` packages are merged and consumed                                                                                                                                   |
| ADR-014  | Keep strict second-review policy (no waiver)                                                                          | Implemented | Enforced by batch activation SQL checks; deferred queue tracked in issue #26                                                                                                                             |
| ADR-015  | Architecture track should avoid collisions with data-engine track                                                     | Accepted    | Worktree isolation and scoped PRs                                                                                                                                                                        |
| ADR-016  | Data-engine pause after Batch C due second-review bottleneck                                                          | Implemented | Batch04 probe shows 0 single-review candidates; issue #26 remains sole open blocker                                                                                                                      |
| ADR-017  | Security & encryption architecture for mobile offline/online architecture                                             | Implemented | Source-of-truth backend with encrypted local store concepts, signed offline queue contracts, and deletion/export workflow controls now implemented in production-facing paths                            |
| ADR-017b | Security launch-blocking implementation spec for consent evidence, export/delete, and queue integrity                 | Implemented | Adds production-grade API + DB contracts for immutable consent ledger, deletion/export proofs, queue replay/tamper defenses, and P1 evidence gating                                                      |
| ADR-018  | Documentation-first hardening and public cutover (`Fodmap` -> `fodmapp`)                                              | Implemented | PR-1 merged (#177), PR-2 merged (#178), remote cutover executed; residual manual step: migrate `VERCEL_*` values to environment scope and delete repo-level copies.                                      |
| ADR-019  | Frontend styling contract: apps import Tailwind foundation directly; UI keeps compiled code and explicit CSS surfaces | Accepted    | Refines ADR-013 with explicit consumer rules: no direct app import of raw token CSS, no hidden Tailwind foundation inside UI CSS exports, phased path from explicit full bundle to segmented UI surfaces |

## Open Timing Decisions

1. When to introduce `dbmate`:

- Trigger option A: first schema change needed in long-lived environments.
- Trigger option B: proactive setup before first change.
- Current state: proactive bootstrap is active in `codex/dbmate-neon-bootstrap`; merge pending.

2. When to move from scaffolds to first product flow:

- Trigger when first persona/route flow is locked and can be delivered on `apps/app` without coupling to blocked data-engine activations.

3. When to convert rollup refresh to publish/swap:

- Must happen before live traffic depends on uninterrupted refresh windows.
