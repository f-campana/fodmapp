# Architecture Scaffolding Sprint Plan

Last updated: 2026-02-24

## Sprint Goal

Deliver mergeable, architecture-only app scaffolds by landing `apps/app` first as the integration baseline for `@fodmap/ui` and `@fodmap/types`, then extending the same contracts to `apps/marketing` and `apps/research`.

## Hard Requirements

1. Keep architecture track isolated from ETL/data-engine and schema work.
2. Keep `api/openapi/v0.yaml` as the only API contract source of truth.
3. Land `apps/app` before `apps/marketing` and `apps/research`.
4. Keep PRs small, reversible, and CI-gated.
5. Do not couple this sprint to barcode backend/schema branch changes.

## Planning Assumptions

1. Next.js is used for `apps/app`; Astro is used for `apps/marketing` and `apps/research`.
2. PR-1 defers real auth/monitoring/analytics providers and ships deterministic placeholders only.
3. Existing reserved env keys (`SENTRY_DSN_APP`, Clerk keys) remain placeholders until PR-2 wiring.
4. Shared UI/tokens/types packages stay the only cross-app dependencies introduced in this sprint.

## Optional Enhancements

1. Add lightweight smoke tests for app shell routes if CI time budget allows.
2. Add preview deploy workflow for app scaffolds once branch protection is stable.
3. Add `dbmate` planning notes only; no migration tooling implementation in this sprint.

## PR Sequence And Dependencies

1. PR-1 `feat(app): scaffold apps/app shell` (no runtime integrations)
2. PR-2 `feat(app): add cross-cutting frontend stubs` (depends on PR-1)
3. PR-3 `feat(marketing,research): scaffold Astro content apps` (depends on PR-1; can run parallel with PR-2 after PR-1 merges)

Dependency logic:

1. PR-1 establishes workspace/app contract and compile baseline.
2. PR-2 reuses PR-1 shell to add provider integration seams without changing business logic.
3. PR-3 reuses shared package contracts and CI patterns established in PR-1.

## PR-1: `apps/app` Minimal Scaffold

Scope:

1. Add a minimal Next.js app shell.
2. Prove `@fodmap/ui` and `@fodmap/types` consumption in one route.
3. Add FR-first i18n, auth, and monitoring placeholders (stub-only, no external provider wiring).
4. Add app-focused CI job and workspace scripts.

Exact file touch map:

1. New: `apps/app/package.json`
2. New: `apps/app/tsconfig.json`
3. New: `apps/app/next-env.d.ts`
4. New: `apps/app/next.config.ts`
5. New: `apps/app/app/globals.css`
6. New: `apps/app/app/layout.tsx`
7. New: `apps/app/app/page.tsx`
8. New: `apps/app/app/espace/page.tsx`
9. New: `apps/app/lib/i18n.ts`
10. New: `apps/app/lib/auth.ts`
11. New: `apps/app/lib/monitoring.ts`
12. New: `apps/app/tests/setup.ts`
13. New: `apps/app/tests/routes.test.tsx`
14. New: `apps/app/vitest.config.ts`
15. New: `apps/app/README.md`
16. Update: `package.json` (root scripts for app convenience)
17. Update: `.github/workflows/ci.yml` (app scaffold job)
18. Update: `.gitignore` (`.next/`)
19. Update: `packages/types/package.json` (types-only package exports)
20. Update: `packages/types/README.md` (types-only usage contract)
21. Update: `pnpm-lock.yaml` (workspace dependency graph with Next.js app)
22. Update: `docs/README.md` (index reference to this sprint plan)

CI and validation commands:

1. `./.github/scripts/quality-gate.sh`
2. `pnpm install --frozen-lockfile`
3. `pnpm openapi:check`
4. `pnpm --filter @fodmap/ui build`
5. `pnpm --filter @fodmap/app test`
6. `pnpm --filter @fodmap/app typecheck`
7. `pnpm --filter @fodmap/app build`
8. `pytest -m "not integration" api/tests`

Risks and mitigations:

1. Risk: workspace package resolution for `@fodmap/types` in Next app.
   Mitigation: explicit package exports in `packages/types/package.json` and CI typecheck gate.
2. Risk: CSS baseline drift between app and UI package.
   Mitigation: app imports `@fodmap/ui/styles.css` and avoids app-specific token duplication.
3. Risk: accidental coupling with backend feature work.
   Mitigation: limit touches to `apps/*`, workspace metadata, and CI wiring only.

Acceptance criteria:

1. `apps/app` tests, builds, and typechecks in CI and locally.
2. Home route renders shared UI components with FR-first copy.
3. A gated-area stub route exists at `/espace` with placeholder auth state.
4. A compile-time type from `@fodmap/types` is used in app code.
5. Route smoke tests cover `/` and `/espace` placeholder rendering.
6. No ETL, schema SQL, or API runtime behavior files are changed.

## PR-2: `apps/app` Cross-Cutting Bootstrap

Scope:

1. Add Sentry/Clerk/Plausible/Axeptio integration seams as non-blocking stubs.
2. Add runtime env parsing contract for `apps/app`.
3. Keep business flows mocked/no-op.

Exact file touch map:

1. New: `apps/app/instrumentation.ts`
2. New: `apps/app/proxy.ts`
3. New: `apps/app/lib/env.client.ts`
4. New: `apps/app/lib/env.server.ts`
5. New: `apps/app/lib/analytics.ts`
6. New: `apps/app/lib/consent.ts`
7. New: `apps/app/lib/sentry.ts`
8. New: `apps/app/lib/clerk.ts`
9. Update: `apps/app/app/layout.tsx`
10. Update: `apps/app/README.md`
11. Update: `.env.example` (only if newly required variables are introduced)
12. Update: `infra/ci/ENVIRONMENT.md` (same keys as `.env.example`)
13. Update: `.github/workflows/ci.yml` (if additional app checks are required)

CI and validation commands:

1. `./.github/scripts/quality-gate.sh`
2. `pnpm install --frozen-lockfile`
3. `pnpm openapi:check`
4. `pnpm --filter @fodmap/app typecheck`
5. `pnpm --filter @fodmap/app build`
6. `pytest -m "not integration" api/tests`

Risks and mitigations:

1. Risk: env contract drift between docs and code.
   Mitigation: require same-PR updates to `.env.example` and `infra/ci/ENVIRONMENT.md`.
2. Risk: vendor SDK setup introduces flaky CI.
   Mitigation: keep integration seams behind no-op adapters and mock-safe defaults.

Acceptance criteria:

1. Cross-cutting modules compile with no runtime dependency on real credentials.
2. App build succeeds with placeholder/default env values.
3. Any newly required env key is documented in both contract files.
4. No ETL/schema/API behavior changes are introduced.

## PR-3: `apps/marketing` + `apps/research` Astro Scaffolds

Scope:

1. Scaffold both Astro apps with shared content and i18n conventions.
2. Wire minimal build/typecheck scripts and CI checks.
3. Keep these apps static/content-first (no backend coupling).

Exact file touch map:

1. New: `apps/marketing/package.json`
2. New: `apps/marketing/astro.config.mjs`
3. New: `apps/marketing/tsconfig.json`
4. New: `apps/marketing/src/pages/index.astro`
5. New: `apps/marketing/src/layouts/BaseLayout.astro`
6. New: `apps/marketing/src/content/config.ts`
7. New: `apps/research/package.json`
8. New: `apps/research/astro.config.mjs`
9. New: `apps/research/tsconfig.json`
10. New: `apps/research/src/pages/index.astro`
11. New: `apps/research/src/layouts/BaseLayout.astro`
12. New: `apps/research/src/content/config.ts`
13. New: `packages/content-config/package.json`
14. New: `packages/content-config/src/i18n.ts`
15. Update: `package.json` (root convenience scripts)
16. Update: `.github/workflows/ci.yml` (Astro scaffold job)

CI and validation commands:

1. `./.github/scripts/quality-gate.sh`
2. `pnpm install --frozen-lockfile`
3. `pnpm openapi:check`
4. `pnpm --filter @fodmap/marketing build`
5. `pnpm --filter @fodmap/research build`
6. `pnpm --filter @fodmap/marketing typecheck`
7. `pnpm --filter @fodmap/research typecheck`
8. `pytest -m "not integration" api/tests`

Risks and mitigations:

1. Risk: duplicate content/i18n logic across Astro apps.
   Mitigation: shared `packages/content-config` contract from first scaffold commit.
2. Risk: CI runtime inflation.
   Mitigation: scope checks to changed apps and keep smoke-level build/typecheck only.

Acceptance criteria:

1. Both Astro apps build and typecheck in CI.
2. FR-first content baseline exists with explicit EN-ready structure.
3. No runtime coupling to API backend or schema code.
4. No ETL/schema/API behavior changes are included.

## Explicit Out Of Scope

1. ETL Phase2/Phase3 logic, scoring, gate flow, or activation changes.
2. SQL schema redesign or product-layer SQL rewrites.
3. Barcode backend/schema branch changes.
4. FastAPI runtime feature changes beyond non-regression checks.
5. Migration tooling (`dbmate`) implementation in this sprint.
