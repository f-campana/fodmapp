# CI Workflow Hardening Runbook

Last updated: 2026-02-28

## Scope

This runbook documents operations controls introduced by CI workflow hardening:

- deterministic required checks for branch protection
- staged enforcement for `Phase 2 Reporting` full-lane checks
- native `GITHUB_TOKEN` guardrails for `Changesets release`
- PR-scoped Turbo CI execution (`pr-scope`) for heavy jobs
- Turbo cache mode selection: remote cache when configured, `.turbo` restore/save fallback when not

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

## CI PR Scope and Turbo Cache Controls

The main `CI` workflow now uses a `pr-scope` job to compute execution booleans for heavy Turbo jobs:

- `design_tokens`
- `ui_foundation`
- `app_scaffold`
- `content_scaffolds`

`pr-scope` fallback behavior is intentionally fail-open for safety:

- non-PR events: all scoped jobs enabled
- invalid/missing PR SHAs: all scoped jobs enabled
- PR diff failures: all scoped jobs enabled
- changes to global build/workflow files (for example `package.json`, `turbo.json`, CI workflow): all scoped jobs enabled

Turbo cache behavior for scoped jobs:

- if both `TURBO_TEAM` and `TURBO_TOKEN` are present, Turbo remote caching is used
- otherwise, CI restores/saves local `.turbo` cache using `actions/cache/restore@v4` and `actions/cache/save@v4`

## Branch Protection Required Checks (`main`)

Configure `main` to require these checks:

1. `CI`
2. `API`
3. `Phase 2 Reporting Gate`
4. `Semantic PR Title`
5. `Changeset PR Gate`

## Manual Verification Checklist

1. Open a docs-only PR.
2. Confirm scoped Turbo jobs are skipped and `CI` still passes.
3. Open an app-only PR touching `apps/app/**` files.
4. Confirm `app-scaffold` runs while other scoped Turbo jobs stay skipped.
5. Open a PR touching global build/workflow files (for example `package.json`, `turbo.json`, `.github/workflows/ci.yml`).
6. Confirm all scoped Turbo jobs run.
7. Confirm required checks are present and pass without missing-status blockers.
8. Open a PR touching one or more scoped reporting files (for example `etl/phase2/**`).
9. Confirm `Phase 2 Reporting` scoped jobs execute and the `Phase 2 Reporting Gate` reflects lane success/failure.
10. Merge a PR to `main` and confirm:

- push runs are not canceled by concurrency
- superseded PR runs are canceled

11. Confirm the next eligible `Changesets release` run can create/update its PR using native token settings.
