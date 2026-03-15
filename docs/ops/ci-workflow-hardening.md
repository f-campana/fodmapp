# CI Workflow Hardening Runbook

Status: Implemented
Audience: Maintainer or operator; Reviewer or auditor
Scope: Repo-wide CI, branch-protection, and workflow hardening controls for the public repository.
Related docs: [docs/foundation/project-definition.md](../foundation/project-definition.md), [docs/foundation/documentation-personas.md](../foundation/documentation-personas.md), [docs/README.md](../README.md)
Last reviewed: 2026-03-11

Last updated: 2026-03-04

## Scope

This runbook documents operations controls introduced by CI workflow hardening:

- deterministic required checks for branch protection
- blocking enforcement for `Phase 2 Reporting` full-lane checks
- native `GITHUB_TOKEN` guardrails for `Changesets release`
- PR-scoped Turbo CI execution (`pr-scope`) for heavy jobs
- Turbo cache mode selection: remote cache when configured, `.turbo` restore/save fallback when not
- strict local Turbo binary invocation in CI via `pnpm exec turbo run ...`
- centralized workspace setup and cache orchestration through `.github/actions/setup-js-workspace`
- explicit setup-node cache-mode control (`enable-node-cache`) for jobs that intentionally skip dependency installation
- explicit non-Turbo exceptions for CI commands that are not Turbo-cache candidates
- path-scoped Storybook deployment to Vercel production lane on `main`
- API workflow job timeouts to fail fast on stalled runner container initialization
- weekly docs hygiene drift audit with manual dispatch support and report artifacts

## Preconditions

- Work from a dedicated worktree branched from the intended base branch.
- Sync repository dependencies before validation with `pnpm install`.
- When CI semantics or environment contracts change, update `infra/ci/ENVIRONMENT.md` in the same
  PR when applicable.
- Run `./.github/scripts/quality-gate.sh --full` before requesting merge.

## Post-Cutover Status (ADR-018)

`ADR-018` implementation status at this revision:

1. Completed in `PR-1`: decision record and documentation-first sequencing (`#177`).
2. Completed in `PR-2`: release preflight hardening + Storybook production-only workflow (`#178`).
3. Completed in remote operations:
   - repository renamed to `f-campana/fodmapp`
   - repository visibility set to `public`
   - default Actions workflow permission set to `read`
   - `Allow GitHub Actions to create and approve pull requests` remains enabled
   - branch protection applied on `main` with required checks (`CI`, `API`, `Changeset PR Gate`, `Semantic PR Title`)
   - repository `TURBO_TEAM` / `TURBO_TOKEN` deleted
   - `vercel-production` environment configured with required reviewer (`f-campana`) and protected-branch deployment policy
   - secret scanning, push protection, Dependabot security updates, and code scanning default setup enabled
4. Remaining manual cutover action:
   - rotate `VERCEL_TOKEN`, set `VERCEL_*` values in `vercel-production` environment secrets, validate deploy, then delete repo-level `VERCEL_*` secrets.

Sections below describe the effective post-cutover workflow contract.

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

1. `Settings > Actions > General > Workflow permissions`: set to **Read repository contents** (recommended) or **Read and write permissions**
2. `Settings > Actions > General > Workflow permissions`: enable **Allow GitHub Actions to create and approve pull requests**

The workflow preflight step now accepts either workflow default permission mode (`read` or `write`)
and fails loudly only when the setting is invalid or when PR approval creation is disabled.

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
Dependabot dependency-only PRs (manifest/lockfile-only changes) are auto-exempted from manual `.changeset` requirements.

Optional debug mode for local/CI diagnostics:

- set `CHANGESET_CHECK_DEBUG=1` when running `.github/scripts/check-pr-changesets.mjs`
- debug output includes resolved base/head refs, changed packages, changed changeset files, workspace package count, parsed changeset package names, unknown changeset package names, final missing package list, and final decision path

Local hook behavior:

- `.githooks/pre-push` still enforces `./.github/scripts/quality-gate.sh --full` for normal pushes
- delete-only pushes (for example `git push --delete`) skip the full gate
- pre-push now emits explicit failure scope (`dependency preflight`, `changeset coverage/lint`, or `lint/type/test phase`) when `--full` fails

### Local Dependency Preflight Contract

`quality-gate.sh --full` runs a dependency preflight before lint/test/typecheck:

- command: `pnpm install --frozen-lockfile --prefer-offline`
- failure behavior: stops immediately with actionable error:
  - `Workspace dependencies not in sync; run pnpm install and retry push.`

This prevents non-deterministic pre-push failures caused by stale worktree installs.

### Full Changeset Lint Contract

`quality-gate.sh --full` now runs:

- `pnpm changeset:ci:lint:all`

This validates every `.changeset/*.md` entry in `HEAD` (excluding `.changeset/README.md`):

- frontmatter must parse correctly
- each declared package must exist in workspace manifests (`apps/*/package.json`, `packages/*/package.json`)

Failure examples:

- unknown package name in changeset frontmatter
- malformed changeset frontmatter in any tracked changeset file

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

`pr-scope` intentionally skips dependency installation and now sets `enable-node-cache: "false"` in
`.github/actions/setup-js-workspace` to avoid setup-node cache path validation errors on lockfile-only PRs.

Turbo cache behavior for scoped jobs:

- repository `TURBO_TEAM` / `TURBO_TOKEN` are removed
- CI defaults to local `.turbo` cache restore/save (`actions/cache/restore@v4` and `actions/cache/save@v4`)
- if Turbo credentials are explicitly injected in the future, remote cache remains technically supported by the composite action

The composite action (`.github/actions/setup-js-workspace`) centralizes this selection logic and
exports `TURBO_TEAM` / `TURBO_TOKEN` into the workspace step environment when both values are
available, so downstream `turbo run` commands can use remote caching.

Turbo command contract:

- Turbo-eligible CI commands must use `pnpm exec turbo run ...` to ensure local pinned Turbo resolution
- intentional non-Turbo exceptions remain direct:
  - `pnpm --filter @fodmap/types openapi:check` (deterministic OpenAPI parity check; avoids Turbo cache ambiguity for this gate)
  - `pnpm --filter @fodmap/storybook exec playwright install chromium` (runtime dependency install)
  - `pnpm --filter @fodmap/reporting render:*` commands in `Phase 2 Reporting` lanes (run-id-scoped artifact flow)

## Storybook Deploy Workflow Contract

`Storybook Deploy` (`.github/workflows/storybook-deploy.yml`) publishes `apps/storybook`
to Vercel with deterministic trigger scope and explicit secret gating.

Trigger policy:

- `push` to `main` only (production lane)
- path-scoped to:
  - `apps/storybook/**`
  - `packages/ui/**`
  - `packages/design-tokens/**`
  - `packages/tailwind-config/**`
  - `packages/reporting/**`
  - root build contract files (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`)
  - workflow/action sources (`.github/workflows/storybook-deploy.yml`, `.github/actions/setup-js-workspace/action.yml`)

Secrets contract:

- required environment secrets in `vercel-production`:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- workflow fails fast with explicit error if any required environment secret is missing

Security contract:

- production deploy lane requires `vercel-production` environment approval before secret access
- deployment access policy is managed in Vercel project settings (Public)

UX contract:

- production lane writes deployment URL + commit SHA to workflow summary

## API Workflow Timeout Contract

`.github/workflows/api.yml` now enforces explicit job-level fail-fast bounds to prevent indefinite hangs during service-container bootstrap on GitHub-hosted runners:

- `api-tests`: `timeout-minutes: 15`
- `api-integration-seeded`: `timeout-minutes: 25`
- `api-gate`: `timeout-minutes: 5`

Operational behavior:

- if container initialization or test execution stalls beyond these bounds, the job is force-failed by Actions
- `api-gate` remains authoritative and fails the required `API` check when either upstream job times out
- push-to-`main` API runs remain the source of truth after merge; stale PR runs should be canceled if still running

## Docs Hygiene Audit Workflow Contract

`.github/workflows/docs-hygiene-audit.yml` provides a report-only documentation drift audit for the
tracked markdown surface of the repository.

Trigger policy:

- scheduled every Monday at `07:00` UTC
- `workflow_dispatch` for manual runs on demand or branch validation

Execution contract:

- uses Node `22` only
- runs `.github/scripts/docs-hygiene-audit.mjs` against tracked `*.md` and `*.mdx` files
- writes a Markdown summary and JSON report artifact for each run

Output contract:

- appends `docs-hygiene-report.md` to the Actions job summary
- uploads `docs-hygiene-report.md` and `docs-hygiene-report.json` as artifact
  `docs-hygiene-audit-${run_id}`

Semantics:

- findings do not fail the workflow in v1
- workflow failure is reserved for audit execution errors only
- current known canon drift is intentionally surfaced with no baseline or allowlist

## Branch Protection Required Checks (`main`)

Configure `main` to require these checks:

1. `CI`
2. `API`
3. `Semantic PR Title`
4. `Changeset PR Gate`

## Validation

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
14. Open a PR touching `apps/storybook/**` and confirm `Storybook Deploy` does not run (production-only trigger policy).
15. Merge a Storybook-impacting PR to `main` and confirm `Storybook Deploy` requests `vercel-production` environment approval, then publishes and writes URL in job summary.
16. Trigger `Docs Hygiene Audit` manually and confirm the job stays green while publishing both summary and artifact outputs when findings exist.
