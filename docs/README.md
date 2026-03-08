# FODMAPP Documentation Index

Last updated: 2026-03-08

This `/docs` tree is the canonical routing layer for repository-wide documentation.
It does not contain every important document in the repo. Some canonical operating docs live next
to the code they describe in `api/`, `apps/`, `packages/`, `etl/`, `infra/`, and `schema/`.

Use this index when you know you need documentation, but do not yet know which surface owns it.

## Choose Your Path

| If you are...                            | Start here                                                                                    | Then go to                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contributor or engineer                  | [`README.md`](../README.md)                                                                   | [`CONTRIBUTING.md`](../CONTRIBUTING.md), [`docs/foundation/documentation-personas.md`](./foundation/documentation-personas.md), subsystem READMEs, and repo-wide contracts below                                                                                                                                                                    |
| Maintainer or operator                   | [`CONTRIBUTING.md`](../CONTRIBUTING.md)                                                       | [`docs/ops/ci-workflow-hardening.md`](./ops/ci-workflow-hardening.md), [`infra/ci/ENVIRONMENT.md`](../infra/ci/ENVIRONMENT.md), [`docs/ops/worktree-status.md`](./ops/worktree-status.md)                                                                                                                                                           |
| Data or workflow operator                | [`docs/architecture/boundaries-and-contracts.md`](./architecture/boundaries-and-contracts.md) | [`etl/phase2/POD_WAVES_RUNBOOK.md`](../etl/phase2/POD_WAVES_RUNBOOK.md), [`etl/phase3/PRODUCT_LAYER_RUNBOOK.md`](../etl/phase3/PRODUCT_LAYER_RUNBOOK.md), [`schema/FR_SCHEMA_GUIDE.md`](../schema/FR_SCHEMA_GUIDE.md)                                                                                                                               |
| Reviewer or auditor                      | [`docs/architecture/decision-register.md`](./architecture/decision-register.md)               | ADRs, [`docs/architecture/boundaries-and-contracts.md`](./architecture/boundaries-and-contracts.md), [`docs/transition/current-state-snapshot.md`](./transition/current-state-snapshot.md)                                                                                                                                                          |
| Product or design collaborator           | [`README.md`](../README.md)                                                                   | [`docs/foundation/project-definition.md`](./foundation/project-definition.md), [`docs/frontend/strategy.md`](./frontend/strategy.md), [`apps/app/README.md`](../apps/app/README.md), [`apps/mobile-prototype/README.md`](../apps/mobile-prototype/README.md), [`docs/plans/mobile-onboarding-prd-fr-v1.md`](./plans/mobile-onboarding-prd-fr-v1.md) |
| Public visitor or collaborator candidate | [`README.md`](../README.md)                                                                   | [`docs/foundation/project-definition.md`](./foundation/project-definition.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md), [`SECURITY.md`](../SECURITY.md), [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md)                                                                                                                                              |

## Status Key

- `Implemented`: landed on `main`.
- `Accepted`: approved direction, not fully landed.
- `In progress`: active in a dedicated worktree or branch.
- `Planned`: deferred or queued for a later pass.
- `Archived`: historical reference only.

## Canonical Routes

### Foundation canon

- [`docs/foundation/README.md`](./foundation/README.md): starting point for repo identity and
  documentation governance.
- [`docs/foundation/project-definition.md`](./foundation/project-definition.md): what FODMAPP is
  today, what it offers, and who it serves.
- [`docs/foundation/documentation-personas.md`](./foundation/documentation-personas.md): primary
  documentation readers, routing priorities, and placement rules.

### Repo frontdoor and collaboration

- [`README.md`](../README.md): what FODMAPP is today, quick start, and high-signal routing.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md): branch, commit, CI, changeset, and merge expectations.
- [`SECURITY.md`](../SECURITY.md): private security reporting expectations.
- [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md): community standards.
- [`docs/ops/public-repo-maintainer-runbook.md`](./ops/public-repo-maintainer-runbook.md):
  public repository intake and maintainer operations.

### Architecture and cross-layer contracts

- [`docs/architecture/decision-register.md`](./architecture/decision-register.md): current
  decision status across the repository.
- [`docs/architecture/boundaries-and-contracts.md`](./architecture/boundaries-and-contracts.md):
  evidence, knowledge, and serving layer boundaries.
- [`docs/architecture/adr-017-security-encryption-architecture.md`](./architecture/adr-017-security-encryption-architecture.md):
  mobile and offline or online security architecture.
- [`docs/architecture/adr-017b-security-launch-blocking-spec.md`](./architecture/adr-017b-security-launch-blocking-spec.md):
  launch-blocking consent, export or delete, and queue integrity contracts.
- [`docs/architecture/adr-018-public-repo-cutover.md`](./architecture/adr-018-public-repo-cutover.md):
  public repository cutover rationale and execution record.

### Data, API, and serving surfaces

- [`etl/phase2/POD_WAVES_RUNBOOK.md`](../etl/phase2/POD_WAVES_RUNBOOK.md): Phase 2 operational
  flow.
- [`etl/phase3/PRODUCT_LAYER_RUNBOOK.md`](../etl/phase3/PRODUCT_LAYER_RUNBOOK.md): Phase 3
  product-layer execution and invariants.
- [`api/README.md`](../api/README.md): API setup, run, test, and OpenAPI contract entry point.
- [`packages/types/README.md`](../packages/types/README.md): generated API type contract usage.
- [`schema/FR_SCHEMA_GUIDE.md`](../schema/FR_SCHEMA_GUIDE.md): schema guide and data-model
  orientation.

### Frontend and product delivery

- [`docs/frontend/strategy.md`](./frontend/strategy.md): frontend ownership split and delivery
  boundaries.
- [`docs/frontend/storybook-foundations-contract.md`](./frontend/storybook-foundations-contract.md):
  Storybook foundations baseline.
- [`docs/frontend/storybook-component-taxonomy-contract.md`](./frontend/storybook-component-taxonomy-contract.md):
  component taxonomy contract.
- [`apps/app/README.md`](../apps/app/README.md): current app scaffold scope and runtime
  boundaries.
- [`packages/ui/README.md`](../packages/ui/README.md): shared UI contract and exports.
- [`apps/mobile-prototype/README.md`](../apps/mobile-prototype/README.md): speed-first mobile
  prototype scope.
- [`docs/plans/mobile-onboarding-prd-fr-v1.md`](./plans/mobile-onboarding-prd-fr-v1.md): current
  high-signal product PRD for France-first mobile onboarding.

### Ops and repository governance

- [`docs/ops/ci-workflow-hardening.md`](./ops/ci-workflow-hardening.md): CI gate and workflow
  contract.
- [`infra/ci/ENVIRONMENT.md`](../infra/ci/ENVIRONMENT.md): environment-variable contract.
- [`docs/ops/worktree-status.md`](./ops/worktree-status.md): live worktree or branch intent and
  status.
- [`docs/ops/consent-chain-repair.md`](./ops/consent-chain-repair.md): targeted operational
  repair runbook.
- [`docs/eslint-policy.md`](./eslint-policy.md): linting policy.

### Transition, planning, and research

- [`docs/transition/current-state-snapshot.md`](./transition/current-state-snapshot.md): current
  baseline across the repo.
- [`docs/transition/pr-sequence-and-gates.md`](./transition/pr-sequence-and-gates.md): active
  gating and sequence context.
- [`docs/transition/risk-register.md`](./transition/risk-register.md): current repo-level
  transition risks.
- [`docs/transition/worktree-playbook.md`](./transition/worktree-playbook.md): worktree operating
  guidance.
- [`docs/research/mobile-implementation-control-plan.md`](./research/mobile-implementation-control-plan.md):
  decision-locked mobile execution control.
- [`docs/research/alignment-v1-2026-02-26.md`](./research/alignment-v1-2026-02-26.md): alignment
  baseline for controlled mobile execution.
- [`docs/plans/docs-full-rewrite-backlog.md`](./plans/docs-full-rewrite-backlog.md): deferred IA
  rewrite backlog.

### Archive

- [`docs/archive/README.md`](./archive/README.md): historical material retained for traceability.

## What Belongs Where

- Root `README.md`: repo identity, quick start, and first routing decisions.
- `docs/foundation/`: project definition and documentation-system governance canon.
- `/docs`: repo-wide architecture, governance, planning, transition, and canonical navigation.
- Code-adjacent READMEs and runbooks: subsystem setup, execution, tests, and local contracts.
- `docs/archive/`: historical material that should not compete with active guidance.

## Canonicalization Rules

- One workflow topic should have one canonical home.
- A canonical document may live outside `/docs` when execution is subsystem-local.
- Project identity and documentation governance canon live in `docs/foundation/*`.
- For duplicated transition artifacts, `docs/transition/*` is the canonical active source.
- Archived copies in `docs/archive/transition/*` are historical only and should be marked as
  such.
- If a document serves no clear persona and no clear task, it should be merged, demoted, or
  archived.

## Structure

- `foundation/`: project definition and documentation-system governance canon.
- `architecture/`: ADRs, decision register, and cross-layer contracts.
- `ops/`: CI hardening, maintainer runbooks, worktree operations, and repo governance.
- `transition/`: active transition guidance and canonical transition artifacts.
- `frontend/`: UI or design system strategy and implementation contracts.
- `plans/`: near-term execution plans and backlog notes.
- `research/`: research summaries that inform implementation.
- `references/`: external references and supporting context.
- `archive/`: historical and superseded material retained for traceability.
