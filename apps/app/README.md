# @fodmapp/app

Status: Implemented
Audience: Contributor or engineer; Product or design collaborator
Scope: Current live app slice, runtime integrations, local validation, and zero-credential behavior contract.
Related docs: [docs/foundation/project-definition.md](../../docs/foundation/project-definition.md), [docs/foundation/documentation-personas.md](../../docs/foundation/documentation-personas.md), [docs/README.md](../../docs/README.md)
Last reviewed: 2026-03-16

Next.js product app for the first live web slice.

## Current Scope

1. Public routes:
   - `/`
   - `/aliments`
   - `/aliments/[slug]`
   - `/decouvrir`
   - `/espace`
2. FR-first product copy with EN-ready field support from the API contract.
3. Server-rendered public read flows for:
   - food search
   - food detail
   - swap results
   - safe-harbor browse
4. Typed public API client consumption from `@fodmapp/types`.
5. `@fodmapp/ui/server` and `@fodmapp/ui/client` consumption for App Router-safe rendering.
6. Env-gated cross-cutting seams:
   - auth (`Clerk`) runtime adapter
   - monitoring (`Sentry`) runtime adapter
   - analytics (`Plausible`) runtime adapter
   - consent (`Axeptio`) deferred no-op adapter
7. Product route tests covering:
   - search results and no-match states
   - detail pages with swaps
   - zero-swap recovery to `/decouvrir`
   - safe-harbor browse states

## Out Of Scope

1. Full production auth flows and consent policy orchestration.
2. Write operations or account-backed product features beyond the existing `/me/*` consent surface.
3. Additional API endpoints or ETL/schema changes.
4. Food subtypes/traits panels and broader personalization features.

## Local Validation

Use the local validation runbook for install, seed, API startup, frontend startup, and manual route checks:

- [`docs/frontend/local-app-validation.md`](../../docs/frontend/local-app-validation.md)

Important runtime note:

- `NEXT_PUBLIC_API_BASE_URL` must be an absolute API origin for server-rendered app routes (for example `http://localhost:8000`).

## Runtime Integration Matrix

| Provider  | Adapter mode                         | Implemented now                                                                                    | Account/paid constraints                                                                                |
| --------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Clerk     | Env-gated runtime (`@clerk/nextjs`)  | Yes, when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` are set                         | Requires Clerk account and keys to activate runtime auth context and `/espace` protection.              |
| Sentry    | Env-gated runtime (`@sentry/nextjs`) | Yes, server (`SENTRY_DSN_APP`) and client (`NEXT_PUBLIC_SENTRY_DSN_APP`) instrumentation are wired | Requires Sentry project/DSN to send events; app remains no-op without DSN.                              |
| Plausible | Env-gated runtime script + event API | Yes, when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and consent gate are enabled                              | Can run with hosted or self-hosted script; no paid plan required for baseline usage.                    |
| Axeptio   | Deferred no-op adapter               | No (deferred)                                                                                      | Deferred until account-level Axeptio project setup and consent taxonomy/legal validation are available. |

## Zero-Credential Behavior Contract

1. Missing env keys must never break build/start/tests.
2. Adapters switch to `disabled` or `deferred-noop` modes by default.
3. Plausible script injection requires consent gate (`NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED=true`) until Axeptio runtime activation.
4. Manual consent override is hard-disabled in production even if `NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED=true`.
5. Public routes remain renderable without provider accounts or paid subscriptions.
6. If `NEXT_PUBLIC_API_BASE_URL` is missing, public read routes must degrade to handled error or empty states rather than crash.
