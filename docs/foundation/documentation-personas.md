# FODMAPP Documentation Personas

Status: Implemented
Owner: Maintainer
Last reviewed: 2026-03-08

## Purpose

This document defines the readers of FODMAPP documentation.

These personas are documentation personas, not end users of the product itself.

Their job is to tell us:

- what belongs in the root README
- what belongs in the docs index
- what belongs in local README or runbook files
- what should be archived or de-emphasized

## Primary Documentation Personas

| Persona                                  | Why they arrive                                                       | Need in <5 minutes                                                                          | Canonical entry docs                                                                                                                                   | Should not be frontdoor                       |
| ---------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Maintainer or operator                   | Keep the repo healthy and changes mergeable                           | Quality gate, worktree rules, CI and env contracts, governance expectations                 | `README.md`, `CONTRIBUTING.md`, `docs/ops/ci-workflow-hardening.md`, `infra/ci/ENVIRONMENT.md`, `docs/ops/worktree-status.md`                          | Deep research notes, historical plans         |
| Contributor or engineer                  | Make or review changes safely                                         | What the repo is, how to install, how to run checks, where the relevant subsystem docs live | `README.md`, `docs/README.md`, local subsystem READMEs                                                                                                 | Archive material, resolved transition history |
| Data or workflow operator                | Run or understand Phase 2 and Phase 3 data flows                      | Execution order, invariants, schema or runbook references, gate rules                       | `etl/phase2/POD_WAVES_RUNBOOK.md`, `etl/phase3/PRODUCT_LAYER_RUNBOOK.md`, `schema/FR_SCHEMA_GUIDE.md`, `docs/architecture/boundaries-and-contracts.md` | Generic community docs, design-only docs      |
| Reviewer or auditor                      | Assess correctness, safety, and change impact                         | ADRs, system boundaries, repo rules, CI and environment contracts                           | `docs/architecture/decision-register.md`, ADRs, `docs/architecture/boundaries-and-contracts.md`, `CONTRIBUTING.md`                                     | Setup minutiae, prototypes unless relevant    |
| Public visitor or collaborator candidate | Understand the project and whether or how to engage                   | What the project is, contribution model, security and community posture                     | `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`                                                                                    | ETL runbooks, archived plans                  |
| Product or design collaborator           | Understand current product direction and where exploratory work lives | Product maturity, prototype location, future-facing PRDs, and guardrails                    | `README.md`, `apps/mobile-prototype/README.md`, selected PRDs and research docs, `apps/app/README.md`                                                  | CI internals, archive or history by default   |

## Persona Priority Order

For the root `README.md`, optimize in this order:

1. Contributor or engineer
2. Maintainer or operator
3. Reviewer or auditor
4. Public visitor or collaborator candidate

The root README is not primarily for:

- end-user consumers
- deep data operators
- archive or history readers

For `docs/README.md`, optimize in this order:

1. Contributor or engineer
2. Maintainer or operator
3. Data or workflow operator
4. Reviewer or auditor

For local README or runbook files, optimize only for the execution persona that already knows why
they are there.

## Frontdoor Contract

The root `README.md` must:

- define what FODMAPP is today, in current-reality terms
- distinguish active platform value from future product ambition
- give a short install or check baseline
- route readers to the correct canonical next document by task
- make the contribution and security posture clear
- avoid implying that scaffolded or prototype surfaces are fully launched products

The root `README.md` must not:

- duplicate full ETL, API, or CI runbooks
- carry long transition or history narrative
- compete with local subsystem docs for operational detail
- try to serve end-user patients directly
- make medical or launch-readiness claims that exceed current repo reality

## Docs Index Contract

`docs/README.md` must:

- act as the canonical map of the documentation system
- route by task and persona, not only by directory name
- clearly mark which areas are active, planned, in progress, or archived
- point to code-adjacent canonical docs when the real operating doc lives outside `/docs`
- make the archive boundary obvious

`docs/README.md` should be the answer to:

- “I know this repo exists, where do I go next?”

## Local Docs Contract

Code-adjacent READMEs and runbooks should:

- assume the reader already knows why they are in that subsystem
- focus on setup, run, test, contract, and boundaries
- avoid broad repo-level re-explanations
- link upward to the docs index or root README when context is needed

Examples:

- `api/README.md` should explain API setup, run, tests, and contracts.
- `apps/app/README.md` should explain app scope and runtime boundaries.
- `etl/...` runbooks should explain execution order and invariants.
- `packages/.../README.md` should explain package contract and usage.

## Archive Contract

Archived docs should:

- be clearly marked as archived or historical at the top
- never appear as the default answer for an active workflow
- remain discoverable for traceability
- be linked only through archive indexes or explicit historical references

Archived docs should not:

- compete with active docs in root routing
- appear equivalent to canonical active guidance

## Writing Rules By Persona

When writing for maintainers or operators:

- optimize for precision, commands, contracts, and failure modes

When writing for contributors or engineers:

- optimize for orientation, local setup, and next-step routing

When writing for reviewers or auditors:

- optimize for boundaries, decisions, acceptance criteria, and traceability

When writing for public visitors:

- optimize for clarity, honesty of current maturity, and engagement rules

When writing for product or design collaborators:

- optimize for current reality, prototype scope, and future-facing boundaries

## Canonical Routing Rules

If a topic is repo-wide and policy-like, it belongs in root docs or `/docs`.

If a topic is subsystem execution, it belongs near the code.

If a topic is historical, it belongs in archive.

If a topic serves no primary persona and no clear task, it should be demoted, merged, or
archived.

## Success Criteria

Our documentation system is working when:

- a contributor can find the right starting doc in under two clicks
- a maintainer can find the authoritative workflow contract quickly
- a reviewer can distinguish active guidance from historical context immediately
- a public visitor understands the project without being misled about maturity
- no major workflow has two competing source-of-truth documents
