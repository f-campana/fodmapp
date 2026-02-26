# Frontend Strategy And Ownership

## Goal

Enable frontend delivery in parallel with data-engine work, without changing API/runtime behavior prematurely.

## Ownership Split

- Architecture agent track (this repo workflow):
  - Workspace setup, CI contracts, package boundaries, API type contracts.
- Frontend team track (wife + agents):
  - Design language, tokens, components, blocks/pages, mocks, validation, query hooks, tests.

## What Frontend Team Can Start Immediately

1. Token system and semantic naming.
2. Core primitives and shadcn-based component layer.
3. Storybook stories and interaction/a11y tests.
4. Mock-driven UI flows with FR-first copy.
5. Zod schemas, API query hooks, state contracts against OpenAPI types.

## Inputs Required From Platform Side

1. Stable OpenAPI source of truth:

- `api/openapi/v0.yaml`
- generated package: `packages/types`

2. Package conventions:

- `@fodmap/ui` export strategy
- token package contracts
- shared Tailwind CSS contract

3. Non-functional expectations:

- FR-first, EN-ready i18n model
- accessibility baseline
- monitoring/error boundaries integration points

## Delivery Boundaries

- Frontend work should not change ETL/sql gate logic.
- Frontend can advance with mocked data and generated types before full product app rollout.
- Shared UI should remain app-agnostic and avoid product-specific logic.
