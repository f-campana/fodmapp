# Frontend Delegation Handoff Kit

This brief is for the delegated frontend team (human + agents) to start in parallel with architecture/data-engine tracks.

## Mission

Build the design system and frontend foundation that can consume existing API contracts without blocking on backend rewrites.

## What They Can Start Now

1. Define tokens and semantic primitives.
2. Build core components and atomic building blocks.
3. Compose blocks/page sections with mocked data.
4. Define Zod schemas for forms/query params.
5. Build API hooks/queries/state from OpenAPI-generated types.
6. Write stories, unit tests, integration tests, and E2E tests.

## What We Must Provide To Them

1. Contract and architecture docs:

- `docs/architecture/boundaries-and-contracts.md`
- `docs/architecture/decision-register.md`

2. API contract source:

- `api/openapi/v0.yaml`
- `packages/types`

3. Delivery conventions:

- isolated worktree usage
- branch naming (`codex/*`)
- CI gates and quality checks

4. Product constraints:

- FR-first, EN-ready
- accessibility baseline
- deterministic API contract consumption

## Requested Deliverables Per Sprint

1. Design deliverables:

- token spec update
- component spec delta

2. Code deliverables:

- PR with scoped package/app changes
- stories/tests included

3. Validation deliverables:

- local command results
- CI status
- known gaps and follow-up list

## Integration Rules

- No backend runtime changes in frontend-only PRs.
- No schema/ETL modifications unless explicitly scoped and reviewed cross-track.
- Keep app code separate from reusable UI package code.
