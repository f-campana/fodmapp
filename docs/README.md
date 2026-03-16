# FODMAPP Documentation Index

Last updated: 2026-03-13

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
| Reviewer or auditor                      | [`docs/architecture/decision-register.md`](./architecture/decision-register.md)               | ADRs, [`docs/architecture/boundaries-and-contracts.md`](./architecture/boundaries-and-contracts.md), [`docs/transition/current-state.md`](./transition/current-state.md), [`docs/transition/risk-register.md`](./transition/risk-register.md)                                                                                                       |
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
- [`docs/frontend/storybook-component-taxonomy-contract.md`](./frontend/storybook-component-taxonomy-contract.md):
  component taxonomy contract.
- [`apps/app/README.md`](../apps/app/README.md): current app scaffold scope and runtime
  boundaries.
- [`packages/ui/README.md`](../packages/ui/README.md): shared UI contract and exports.
- [`apps/mobile-prototype/README.md`](../apps/mobile-prototype/README.md): speed-first mobile
  prototype scope.
- [`docs/plans/mobile-onboarding-prd-fr-v1.md`](./plans/mobile-onboarding-prd-fr-v1.md): current
  high-signal product PRD for France-first mobile onboarding.
- [`docs/plans/safe-harbor-food-categories-prd-fr-v1.md`](./plans/safe-harbor-food-categories-prd-fr-v1.md):
  Safe-Harbor V1 PRD aligned to the implemented composition-zero contract.
- [`docs/plans/symptoms-tracking-v1-prd.md`](./plans/symptoms-tracking-v1-prd.md): product scope for
  the first tracking lane across web and mobile.
- [`docs/research/safe-harbor-evidence-pack-v1.md`](./research/safe-harbor-evidence-pack-v1.md):
  rights-first evidence pack + copy guardrails for Safe-Harbor V1.

### Ops and repository governance

- [`docs/ops/ci-workflow-hardening.md`](./ops/ci-workflow-hardening.md): CI gate and workflow
  contract.
- [`infra/ci/ENVIRONMENT.md`](../infra/ci/ENVIRONMENT.md): environment-variable contract.
- [`docs/ops/worktree-status.md`](./ops/worktree-status.md): live worktree or branch intent and
  status.
- [`docs/ops/worktree-playbook.md`](./ops/worktree-playbook.md): worktree creation, validation,
  and cleanup flow.
- [`docs/ops/consent-chain-repair.md`](./ops/consent-chain-repair.md): targeted operational
  repair runbook.
- [`docs/eslint-policy.md`](./eslint-policy.md): linting policy.

### Transition, planning, and research

- [`docs/transition/current-state.md`](./transition/current-state.md): current active transition
  baseline across the repo.
- [`docs/transition/risk-register.md`](./transition/risk-register.md): current repo-level
  transition risks.
- [`docs/research/mobile-original-instruction-tracker.md`](./research/mobile-original-instruction-tracker.md):
  canonical locked-decision register for active mobile research and implementation.
- [`docs/research/mobile-implementation-control-plan.md`](./research/mobile-implementation-control-plan.md):
  decision-locked mobile execution control.
- [`docs/research/alignment-v1-2026-02-26.md`](./research/alignment-v1-2026-02-26.md): alignment
  baseline for controlled mobile execution.
- [`docs/research/safe-harbor-mode-framing-2026-03-13.md`](./research/safe-harbor-mode-framing-2026-03-13.md):
  discussion note on strict vs guided safe-harbor product framing.
- [`docs/plans/symptoms-tracking-v1-prd.md`](./plans/symptoms-tracking-v1-prd.md): draft PRD for the
  tracking lane (manual-first, account-backed, basic summaries only).
- [`docs/plans/mobile-onboarding-prd-fr-v1.md`](./plans/mobile-onboarding-prd-fr-v1.md): active
  France-first mobile onboarding PRD.
- [`docs/plans/safe-harbor-food-categories-prd-fr-v1.md`](./plans/safe-harbor-food-categories-prd-fr-v1.md):
  Safe-Harbor V1 PRD aligned to the implemented composition-zero contract.
- [`docs/research/safe-harbor-evidence-pack-v1.md`](./research/safe-harbor-evidence-pack-v1.md):
  rights-first evidence pack + copy guardrails for Safe-Harbor V1.
- [`docs/plans/phase2-reporting-implementation-plan.md`](./plans/phase2-reporting-implementation-plan.md):
  canonical active reporting plan.
- [`docs/plans/phase2-reporting-task-breakdown.md`](./plans/phase2-reporting-task-breakdown.md):
  subordinate reporting execution checklist.
- [`docs/plans/phase2-reporting-review-checkpoint.md`](./plans/phase2-reporting-review-checkpoint.md):
  subordinate gate and evidence record for the active reporting track.
- [`docs/plans/docs-full-rewrite-backlog.md`](./plans/docs-full-rewrite-backlog.md): deferred IA
  rewrite backlog.

### Archive

- [`docs/archive/README.md`](./archive/README.md): historical material retained for traceability.

## What Belongs Where

- Root `README.md`: repo identity, quick start, and first routing decisions.
- `docs/foundation/`: project definition and documentation-system governance canon.
- `/docs`: repo-wide architecture, governance, planning, transition, and canonical navigation.
- `docs/transition/`: current baseline and active transition risks only.
- `docs/plans/`: active plans, task breakdowns, and gate notes tied to live work.
- `docs/research/`: current evidence or locked-decision records tied to active tracks.
- Code-adjacent READMEs and runbooks: subsystem setup, execution, tests, and local contracts.
- `docs/archive/`: the only historical home for superseded material.

## Canonicalization Rules

- One workflow topic should have one canonical home.
- A canonical document may live outside `/docs` when execution is subsystem-local.
- Project identity and documentation governance canon live in `docs/foundation/*`.
- Historical docs live only in `docs/archive/*`; active directories should not keep archive
  mirrors or archived stubs.
- Research stays active only when it supports an active track or a locked decision set.
- If a document serves no clear persona and no clear task, it should be merged, demoted, or
  archived.

## Structure

- `foundation/`: project definition and documentation-system governance canon.
- `architecture/`: ADRs, decision register, and cross-layer contracts.
- `ops/`: CI hardening, maintainer runbooks, worktree operations, and repo governance.
- `transition/`: current baseline and active transition risk artifacts.
- `frontend/`: UI or design system strategy and implementation contracts.
- `plans/`: active execution plans, task breakdowns, and checkpoint notes.
- `research/`: active evidence and locked-decision records for live tracks.
- `references/`: external references and supporting context.
- `archive/`: historical and superseded material retained for traceability.
