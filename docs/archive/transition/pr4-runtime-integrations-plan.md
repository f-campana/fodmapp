# Historical / Superseded Artifact

This file is archived for traceability only.
Canonical active source: [`docs/transition/pr4-runtime-integrations-plan.md`](../../transition/pr4-runtime-integrations-plan.md).

# PR-4 Runtime Integrations Plan (`apps/app`)

Last updated: 2026-02-24

## Scope

1. Implement env-gated runtime integration baseline in `apps/app` for Clerk, Sentry, Plausible, and Axeptio.
2. Keep app behavior stable with zero credentials and no paid subscriptions.
3. Keep work architecture/frontend-only.

## File Map

1. `apps/app/lib/clerk.ts` (runtime-gated Clerk adapter)
2. `apps/app/lib/auth.ts` (auth context from Clerk runtime when configured)
3. `apps/app/lib/sentry.ts` (runtime-gated Sentry init and event capture)
4. `apps/app/lib/monitoring.ts` (monitoring facade over Sentry runtime/no-op)
5. `apps/app/lib/analytics.ts` (runtime-gated Plausible bootstrap + tracking adapter)
6. `apps/app/lib/consent.ts` (Axeptio adapter with explicit deferred/no-op mode)
7. `apps/app/proxy.ts` (runtime Clerk middleware activation when configured)
8. `apps/app/instrumentation.ts` (Sentry runtime bootstrap registration)
9. `apps/app/app/layout.tsx` (runtime script bootstrap hooks)
10. `apps/app/tests/bootstrap.test.ts` (adapter gate tests)
11. `apps/app/tests/routes.test.tsx` (route rendering expectations)
12. `apps/app/package.json` (runtime SDK dependencies)
13. `.env.example` (frontend runtime env contract updates)
14. `infra/ci/ENVIRONMENT.md` (mirror env contract updates)
15. `apps/app/README.md` (integration matrix: implemented vs deferred)

## Risks

1. SDK runtime assumptions can break builds when env keys are absent.
   - Mitigation: dynamic imports and disabled-mode fallbacks.
2. Consent enforcement can be misread as production-ready without legal setup.
   - Mitigation: keep Axeptio explicitly in deferred/no-op mode with rationale in code and docs.
3. Middleware/auth changes can unintentionally alter route behavior.
   - Mitigation: keep `/` and `/espace` pass-through semantics and verify route tests.

## Acceptance Criteria

1. `apps/app` runs/tests/builds with zero credentials.
2. Clerk/Sentry/Plausible adapters expose runtime-capable paths behind env gates.
3. Axeptio remains explicit boilerplate/no-op with documented deferral rationale.
4. `.env.example` and `infra/ci/ENVIRONMENT.md` are updated consistently for used keys.
5. No changes under `etl/**`, `schema/**`, or `api/app/**`.
