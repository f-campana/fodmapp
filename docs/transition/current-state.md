# Current Transition State

Last updated: 2026-03-08

## Current Repo Baseline

- `main` is the protected integration branch and must stay clean in
  `/Users/fabiencampana/Documents/fodmapp`.
- The documentation foundation canon is now merged:
  - `docs/foundation/project-definition.md`
  - `docs/foundation/documentation-personas.md`
- The repo frontdoor and docs index now route by audience and task rather than historical doc
  families.
- Active product and platform surfaces on `main` remain:
  - Phase 2 and Phase 3 ETL workflows
  - read-only API v0 and generated type contracts
  - shared UI, token, and Storybook foundations
  - app and mobile scaffolds or prototypes
  - CI, worktree, and public-repo governance contracts

## Active Delivery Tracks

The current active-track view is pulled from `docs/ops/worktree-status.md` as of 2026-03-08.

- Frontend and design-system delivery:
  - `codex/ui-lib-batch-g-composed`
  - `codex/color-remediation-core`
  - `codex/color-remediation-reporting`
- Mobile delivery and research:
  - `codex/mobile-api-p0-mainline`
  - `codex/mobile-app-p1-mainline`
  - `codex/mobile-app-p1-mainline-r2`
  - `codex/mobile-implementation-track`
  - `codex/mobile-prototype-alt-prototype-v3`
  - `codex/mobile-research-realignment`
  - `codex/mobile-research-docs-extract`
- Reporting, data, and research operations:
  - `codex/phase2-reporting-phase4-delivery`
  - `codex/unknown-fodmap-research`
  - `codex/revolut-research-report`
- CI, tooling, and governance hardening:
  - `codex/changesets-preflight-403-hotfix`
  - `codex/ci-skill-policy-gate`
  - `codex/ci-automation-audit`
  - `codex/deterministic-changeset-gate-fix`
  - `codex/turbo-audit-remediation`
  - `codex/design-system-skill-pilot`
  - `codex/public-readiness-docs-targeted`

Use `docs/ops/worktree-status.md` for the full live inventory, scope, and blockers.

## Current Cross-Track Constraints And Gates

- Do feature work in dedicated worktrees only, with one initiative per worktree.
- Update `docs/ops/worktree-status.md` whenever branch intent, scope, or blockers change.
- Run `./.github/scripts/quality-gate.sh --full` before requesting merge.
- Keep Conventional Commit messages and semantic PR titles.
- Treat `docs/foundation/*`, `README.md`, and `docs/README.md` as the canonical identity and
  routing layer for the repository.
- For Phase 3 swap batches and activations, keep the existing gate flow intact:
  generation or draft materialization, review CSV update, activation apply, then post-activation
  checks.

## Active Transition References

- [`docs/transition/risk-register.md`](./risk-register.md): active repo-level transition risks.
- [`docs/ops/worktree-status.md`](../ops/worktree-status.md): live worktree inventory and
  blockers.
- [`docs/ops/worktree-playbook.md`](../ops/worktree-playbook.md): worktree creation and cleanup
  flow.

## Historical Context

Older transition plans, sequencing notes, and dated snapshots now live only in
[`docs/archive/transition/`](../archive/transition/).
