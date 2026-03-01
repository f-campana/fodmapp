# CI Workflow Hardening Runbook

Last updated: 2026-03-01

## Scope

This runbook documents operations controls introduced by CI workflow hardening:

- deterministic required checks for branch protection
- blocking enforcement for `Phase 2 Reporting` full-lane checks
- native `GITHUB_TOKEN` guardrails for `Changesets release`
- PR-scoped Turbo CI execution (`pr-scope`) for heavy jobs
- Turbo cache mode selection: remote cache when configured, `.turbo` restore/save fallback when not
- strict local Turbo binary invocation in CI via `pnpm exec turbo run ...`
- explicit non-Turbo exceptions for CI commands that are not Turbo-cache candidates

## Phase 2 Reporting Gate Mode

`Phase 2 Reporting` full lane is always blocking.

- No ramp variable is used.
- Compare failures fail the full-lane job and fail the `Phase 2 Reporting Gate`.
- Baseline refresh remains manual and approval-gated through:
  - `workflow_dispatch baseline_update=true`
  - `workflow_dispatch render_baseline_update=true`
  - mutual exclusion (`baseline_update` and `render_baseline_update` cannot both be true)

## Changesets Release Permissions

`Changesets release` intentionally uses native `GITHUB_TOKEN` only (no PAT/app fallback).

Required GitHub repository settings:

1. `Settings > Actions > General > Workflow permissions`: set to **Read and write permissions**
2. `Settings > Actions > General > Workflow permissions`: enable **Allow GitHub Actions to create and approve pull requests**

The workflow preflight step fails loudly with actionable errors if these settings are not enabled.

## Changeset PR Gate Determinism

`Changeset PR Gate` validation now uses deterministic repository state only:

- changed files from `git diff BASE_SHA...HEAD_SHA`
- changed workspace package/app directories (`apps/*`, `packages/*`)
- changed `.changeset/*.md` files in the same range
- package names parsed from changeset frontmatter in those changed `.changeset` files
- workspace package names discovered from `apps/*/package.json` and `packages/*/package.json` at `HEAD_SHA`

The gate no longer relies on `pnpm changeset status` output for pass/fail decisions.
Changed `.changeset` entries that reference non-workspace package names now fail with explicit package/file diagnostics.
Root-only releasable file changes (with no workspace package/app changes) now pass without requiring a changeset.

Optional debug mode for local/CI diagnostics:

- set `CHANGESET_CHECK_DEBUG=1` when running `.github/scripts/check-pr-changesets.mjs`
- debug output includes resolved base/head refs, changed packages, changed changeset files, workspace package count, parsed changeset package names, unknown changeset package names, final missing package list, and final decision path

Local hook behavior:

- `.githooks/pre-push` still enforces `./.github/scripts/quality-gate.sh --full` for normal pushes
- delete-only pushes (for example `git push --delete`) skip the full gate

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

Turbo command contract:

- Turbo-eligible CI commands must use `pnpm exec turbo run ...` to ensure local pinned Turbo resolution
- intentional non-Turbo exceptions remain direct:
  - `pnpm --filter @fodmap/storybook exec playwright install chromium` (runtime dependency install)
  - `pnpm --filter @fodmap/reporting render:*` commands in `Phase 2 Reporting` lanes (run-id-scoped artifact flow)

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
12. Before merging any hotfix touching CI, reporting, release, or workflow logic, check for open mergeable changeset/release PRs and record disposition (merge, retarget, or intentionally defer).
13. After merging to `main`, watch these workflows to completion before closing the incident: `Phase 2 Reporting`, `API`, `CI`, `Changesets release`.
