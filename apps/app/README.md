# @fodmap/app

Architecture-first Next.js scaffold for the product app.

## Scope In This PR

1. Minimal public route (`/`) and gated-area placeholder route (`/espace`).
2. FR-first copy with EN-ready dictionary structure.
3. `@fodmap/ui` component consumption.
4. `@fodmap/types` contract consumption (compile-time only).
5. Env-gated cross-cutting seams:
   - auth (`Clerk`) runtime adapter
   - monitoring (`Sentry`) runtime adapter
   - analytics (`Plausible`) runtime adapter
   - consent (`Axeptio`) deferred no-op adapter
6. Route smoke tests for `/` and `/espace`.

## Out Of Scope In This PR

1. Business logic and data-fetch flows.
2. Full production auth flows and consent policy orchestration.
3. ETL, SQL schema, or API runtime behavior changes.

## Runtime Integration Matrix

| Provider | Adapter mode | Implemented now | Account/paid constraints |
| --- | --- | --- | --- |
| Clerk | Env-gated runtime (`@clerk/nextjs`) | Yes, when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + server keys are set | Requires Clerk account and keys to activate runtime auth context/middleware. |
| Sentry | Env-gated runtime (`@sentry/nextjs`) | Yes, when `SENTRY_DSN_APP` is set | Requires Sentry project/DSN to send events; app remains no-op without DSN. |
| Plausible | Env-gated runtime script + event API | Yes, when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set | Can run with hosted or self-hosted script; no credentials required for local no-op path. |
| Axeptio | Deferred no-op adapter | No (deferred) | Deferred until account-level Axeptio project setup and consent taxonomy/legal validation are available. |

## Zero-Credential Behavior Contract

1. Missing env keys must never break build/start/tests.
2. Adapters switch to `disabled` or `deferred-noop` modes by default.
3. `/` and `/espace` remain renderable without provider accounts or paid subscriptions.
