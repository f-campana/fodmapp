# System Boundaries And Contracts

Status: Implemented  
Audience: Data or workflow operator; Reviewer or auditor; Contributor or engineer  
Scope: Cross-layer boundaries between evidence workflows, compiled knowledge, and serving surfaces.  
Related docs: [docs/foundation/project-definition.md](../foundation/project-definition.md), [docs/foundation/documentation-personas.md](../foundation/documentation-personas.md), [docs/README.md](../README.md)  
Last reviewed: 2026-03-08

## Context

The project serves two distinct concerns that must stay separated:

1. Scientific/evidence curation workflow.
2. Product serving/backend/frontend delivery.

The transition objective is to preserve scientific rigor while making serving layers easier to scale and iterate.

## Layer Model

| Layer     | Purpose                                          | Current Location                                                  | Contract                                                                    |
| --------- | ------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Evidence  | Research sources, review packets, gate decisions | `etl/phase2/decisions`, `etl/phase3/decisions`, `etl/phase3/data` | Additive updates, explicit review traceability, gate-order compliance       |
| Knowledge | Compiled validated state in PostgreSQL           | `schema/fodmap_fr_schema.sql`, Phase2/Phase3 SQL pipelines        | Deterministic replay/seed, SQL contracts, no destructive historical rewrite |
| Serving   | Read models via API and later frontend consumers | `api/` (FastAPI), `api/openapi/v0.yaml`                           | OpenAPI contract is source of truth, read-only serving behavior             |

## Current Data/Serving Contracts (Implemented)

- Phase gate sequence is enforced (generation/rescore -> review CSV -> activation -> checks).
- Snapshot lock checks are enforced for activation safety.
- `/v0/swaps` contract invariants are documented in `AGENTS.md` and reflected in API tests/OpenAPI types.
- Health endpoint now checks DB readiness and returns `503` when DB is unavailable.
- API contract types are generated from `api/openapi/v0.yaml` into `packages/types` and checked in CI.

## Platform Boundary Rules

- Keep Python ETL and SQL replay logic independent from frontend scaffolding.
- Keep API contract generation independent from frontend implementation details.
- Do not tie evidence workflows to monorepo/package-manager concerns.
- Keep migration strategy explicit before long-lived env divergence.

## What Is Intentionally Deferred

- Physical move of `api/` and `etl/` into `services/`.
- Hono/Drizzle migration.
- Physical relocation of evidence CSV files.
