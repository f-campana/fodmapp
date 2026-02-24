# @fodmap/app

Architecture-first Next.js scaffold for the product app.

## Scope In This PR

1. Minimal public route (`/`) and gated-area placeholder route (`/espace`).
2. FR-first copy with EN-ready dictionary structure.
3. `@fodmap/ui` component consumption.
4. `@fodmap/types` contract consumption (compile-time only).
5. Auth and monitoring stubs only (no provider SDK wiring).
6. Route smoke tests for `/` and `/espace`.

## Out Of Scope In This PR

1. Business logic and data-fetch flows.
2. Real auth, analytics, consent, and monitoring integrations.
3. ETL, SQL schema, or API runtime behavior changes.
