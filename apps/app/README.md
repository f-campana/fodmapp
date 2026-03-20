# @fodmapp/app

Status: Implemented
Audience: Contributor or engineer; Product or design collaborator
Scope: Current live app slice, runtime integrations, local validation, and zero-credential behavior contract.
Related docs: [docs/foundation/project-definition.md](../../docs/foundation/project-definition.md), [docs/foundation/documentation-personas.md](../../docs/foundation/documentation-personas.md), [docs/README.md](../../docs/README.md)
Last reviewed: 2026-03-20

Next.js product app for the first live web slice.

## Current Scope

1. Public routes:
   - `/`
   - `/aliments`
   - `/aliments/[slug]`
   - `/decouvrir`
   - `/espace`
   - `/espace/suivi` (local preview auth or runtime auth only)
2. FR-first product copy with EN-ready field support from the API contract.
3. Server-rendered public read flows for:
   - food search
   - food detail
   - swap results
   - safe-harbor browse
4. Auth-gated account flows for:
   - consent and rights management in `/espace`
   - tracking history, weekly summary, and write actions in `/espace/suivi`
5. Typed public API client consumption from `@fodmapp/types`.
6. `@fodmapp/ui/server` and `@fodmapp/ui/client` consumption for App Router-safe rendering.
7. Env-gated cross-cutting seams:
   - auth (`Clerk`) runtime adapter
   - monitoring (`Sentry`) runtime adapter
   - analytics (`Plausible`) runtime adapter
   - consent (`Axeptio`) deferred no-op adapter
8. Product route tests covering:
   - search results and no-match states
   - detail pages with swaps
   - zero-swap recovery to `/decouvrir`
   - safe-harbor browse states
   - `/espace` and `/espace/suivi` auth/preview fallback states

## Out Of Scope

1. Full production auth flows and consent policy orchestration, including app-hosted `/sign-in` or `/sign-up` pages.
2. Mobile UI, offline-first local persistence, and bowel-tracking surfaces.
3. Predictive, diagnostic, or causal interpretation of meals and symptoms.
4. Additional API endpoints or ETL/schema changes beyond the current tracking and food contracts.
5. Food subtypes/traits panels and broader personalization features.

## Local Validation

Use the local validation runbook for install, seed, API startup, frontend startup, and manual route checks:

- [`docs/frontend/local-app-validation.md`](../../docs/frontend/local-app-validation.md)

Important runtime note:

- `NEXT_PUBLIC_API_BASE_URL` must be an absolute API origin for server-rendered app routes (for example `http://localhost:8000`).
- Local validation of `/espace` and `/espace/suivi` can use preview auth by setting `APP_AUTH_PREVIEW_USER_ID=11111111-1111-4111-8111-111111111111` in `apps/app/.env.local`.

## Runtime Integration Matrix

| Provider  | Adapter mode                                                 | Implemented now                                                                                                                                                    | Account/paid constraints                                                                                                                                 |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clerk     | Env-gated runtime (`@clerk/nextjs`) + local preview fallback | Yes, when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` are set; local preview auth is also available in non-production with `APP_AUTH_PREVIEW_USER_ID` | Requires Clerk account and keys to activate runtime auth context and `/espace` protection. Preview mode is development-only and not real authentication. |
| Sentry    | Env-gated runtime (`@sentry/nextjs`)                         | Yes, server (`SENTRY_DSN_APP`) and client (`NEXT_PUBLIC_SENTRY_DSN_APP`) instrumentation are wired                                                                 | Requires Sentry project/DSN to send events; app remains no-op without DSN.                                                                               |
| Plausible | Env-gated runtime script + event API                         | Yes, when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and consent gate are enabled                                                                                              | Can run with hosted or self-hosted script; no paid plan required for baseline usage.                                                                     |
| Axeptio   | Deferred no-op adapter                                       | No (deferred)                                                                                                                                                      | Deferred until account-level Axeptio project setup and consent taxonomy/legal validation are available.                                                  |

## Zero-Credential Behavior Contract

1. Missing env keys must never break build/start/tests.
2. Adapters switch to `disabled` or `deferred-noop` modes by default.
3. Plausible script injection requires consent gate (`NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED=true`) until Axeptio runtime activation.
4. Manual consent override is hard-disabled in production even if `NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED=true`.
5. Public routes remain renderable without provider accounts or paid subscriptions.
6. If `NEXT_PUBLIC_API_BASE_URL` is missing, public read routes must degrade to handled error or empty states rather than crash.
7. `/espace` and `/espace/suivi` must not render dead `/sign-in` links when runtime auth is unavailable; local validation uses preview auth instead.
