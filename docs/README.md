# FODMAP Documentation Index

Last updated: 2026-03-08

This `/docs` tree is the operational and architectural source of truth for this repository.
It includes active guidance, accepted/implemented decisions, and archived historical material.

## How To Read This

- `Implemented`: landed on `main`.
- `Accepted`: approved direction, not fully landed.
- `In progress`: active in a dedicated worktree/branch.
- `Planned`: deferred or queued for a later pass.
- `Archived`: historical reference only.

## Structure

- `foundation/`
  - Project definition and documentation-system governance canon.
- `architecture/`
  - ADRs, decision register, and cross-layer contracts.
- `ops/`
  - CI hardening, worktree operations, cutover guidance, and maintainer runbooks.
- `transition/`
  - Active transition guidance and currently canonical transition artifacts.
- `frontend/`
  - UI/design system strategy and implementation references.
- `plans/`
  - Near-term execution plans and deferred backlog notes.
- `research/`
  - Research summaries that inform implementation decisions.
- `references/`
  - External references and context.
- `archive/`
  - Historical/superseded documents retained for traceability.

## Canonicalization Rule

For duplicated transition artifacts, `docs/transition/*` is the canonical active source.
Archived copies in `docs/archive/transition/*` are explicitly marked as historical/superseded.

## Public Repository Notes

- Project identity and documentation-governance canon live in:
  - `docs/foundation/README.md`
- Public-facing repository policy and intake guidance live in:
  - `README.md`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `docs/ops/public-repo-maintainer-runbook.md`
- Full documentation IA rewrite is intentionally deferred and tracked in:
  - `docs/plans/docs-full-rewrite-backlog.md`
