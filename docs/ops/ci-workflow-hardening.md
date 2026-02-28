# CI Workflow Hardening Runbook

Last updated: 2026-02-27

## Scope

This runbook documents operations controls introduced by CI workflow hardening:

- deterministic required checks for branch protection
- staged enforcement for `Phase 2 Reporting` full-lane checks
- native `GITHUB_TOKEN` guardrails for `Changesets release`

## Repository Variable: `PHASE2_FULL_RUN_ENFORCE`

Controls whether `Phase 2 Reporting` full-lane compare failures block `main`.

- Variable name: `PHASE2_FULL_RUN_ENFORCE`
- Expected values:
  - `"false"`: non-blocking ramp mode (default)
  - `"true"`: blocking enforcement mode

In non-blocking mode, compare failures are visible but do not fail the full-lane job.
In blocking mode, compare failures fail the job and the `Phase 2 Reporting Gate`.

Rollout policy:

- Keep `PHASE2_FULL_RUN_ENFORCE=false` initially after merge.
- Flip to `true` only after 3 consecutive green `main` runs for `Phase 2 Reporting Gate`.

## Changesets Release Permissions

`Changesets release` intentionally uses native `GITHUB_TOKEN` only (no PAT/app fallback).

Required GitHub repository settings:

1. `Settings > Actions > General > Workflow permissions`: set to **Read and write permissions**
2. `Settings > Actions > General > Workflow permissions`: enable **Allow GitHub Actions to create and approve pull requests**

The workflow preflight step fails loudly with actionable errors if these settings are not enabled.

## Branch Protection Required Checks (`main`)

Configure `main` to require these checks:

1. `CI`
2. `API`
3. `Phase 2 Reporting Gate`
4. `Semantic PR Title`
5. `Changeset PR Gate`

## Manual Verification Checklist

1. Open a docs-only PR.
2. Confirm required checks are present and pass without missing-status blockers.
3. Open a PR touching one or more scoped reporting files (for example `etl/phase2/**`).
4. Confirm `Phase 2 Reporting` scoped jobs execute and the `Phase 2 Reporting Gate` reflects lane success/failure.
5. Merge a PR to `main` and confirm:
   - push runs are not canceled by concurrency
   - superseded PR runs are canceled
6. Confirm the next eligible `Changesets release` run can create/update its PR using native token settings.
