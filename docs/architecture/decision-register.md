# Architecture Decision Register

Status definitions:

- `Implemented`: landed on `main`.
- `Accepted`: agreed direction, pending implementation.
- `In progress`: active in dedicated worktree but not merged.
- `Planned`: accepted target direction.
- `Open`: unresolved timing or choice.

## Decision Table

| ID | Decision | Status | Notes |
| --- | --- | --- | --- |
| ADR-001 | Keep 3-layer separation: evidence, knowledge, serving | Planned | Concept is agreed; physical folder split deferred |
| ADR-002 | Keep FastAPI as serving runtime for now; ETL stays Python | Implemented | No serving rewrite in current transition phase |
| ADR-003 | Monorepo bootstrap with `pnpm` + Turborepo | Implemented | Landed in `main` (`package.json`, `pnpm-workspace.yaml`, `turbo.json`) |
| ADR-004 | OpenAPI generated TS contract under `packages/types` + CI stale-check | Implemented | Landed in `main` (`openapi-types` CI job) |
| ADR-005 | Root environment contract: `.env.example` + `infra/ci/ENVIRONMENT.md` | Implemented | Landed in `main` |
| ADR-006 | Path portability in Phase2/Phase3 scripts (repo-relative) | Implemented | Landed via replay/seed script updates |
| ADR-007 | `/v0/health` must reflect DB readiness | Implemented | Returns `503` on DB outage |
| ADR-008 | Use `dbmate` for SQL-first migration workflow | Planned | Tool choice converged; timing remains gated |
| ADR-009 | Neon branch policy (`main` prod, `staging`, `pr-*`) | Planned | Not wired yet |
| ADR-010 | Next.js app + Astro marketing/research split | Planned | No app scaffolds merged yet |
| ADR-011 | Clerk (EU), Sentry, Plausible, Axeptio as cross-cutting frontend stack | Planned | To be wired during app skeleton phase |
| ADR-012 | Start UI library from shadcn/ui primitives and iterate | Accepted | Implementation currently in isolated PR-2 worktree |
| ADR-013 | Tailwind v4 strategy uses both `design-tokens` and Tailwind shared package | Accepted | `design-tokens` as source of truth; Tailwind package as adapter |
| ADR-014 | Keep strict second-review policy (no waiver) | Accepted | Data safety policy retained |
| ADR-015 | Architecture track should avoid collisions with data-engine track | Accepted | Worktree isolation and scoped PRs |

## Open Timing Decisions

1. When to introduce `dbmate`:
- Trigger option A: first schema change needed in long-lived environments.
- Trigger option B: proactive setup before first change.
- Current leaning: introduce when first schema migration is required by platform work.

2. When to scaffold frontend apps:
- Trigger after shared UI/token foundation is stable and API contract consumption is ready.

3. When to convert rollup refresh to publish/swap:
- Must happen before live traffic depends on uninterrupted refresh windows.
