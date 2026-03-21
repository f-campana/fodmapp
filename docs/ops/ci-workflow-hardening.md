# CI Workflow Hardening Runbook

Status: Implemented
Audience: Maintainer or operator; Reviewer or auditor
Scope: Repo-wide CI, branch-protection, and workflow hardening controls for the public repository.
Related docs: [docs/foundation/project-definition.md](../foundation/project-definition.md), [docs/foundation/documentation-personas.md](../foundation/documentation-personas.md), [docs/README.md](../README.md)
Last reviewed: 2026-03-21

Last updated: 2026-03-21

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
- API container smoke validation for the planned Git-driven Koyeb runtime
- dbmate smoke validation for the long-lived migration lane without weakening replay/seed CI
- explicit local Postgres `sslmode=disable` wiring for dbmate/API smoke jobs while hosted Neon keeps provider SSL settings
- manual Phase 3 promote smoke validation for the non-destructive persistent-db refresh lane
- initial Phase 3 bootstrap smoke validation for the first-time persistent-db load lane
- weekly docs hygiene drift audit with manual dispatch support and report artifacts
- deterministic lint prebuilds for dist-backed workspace packages consumed through package exports

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

### Local Full Gate Serialization Contract

`quality-gate.sh --full` now splits local work into two classes:

- read-only checks still run in parallel:
  - `pnpm format:check`
  - `pnpm python:ci`
  - changeset tests/lint/coverage checks
  - CI scope and docs hygiene unit tests
  - OpenAPI, design-token, and Tailwind style checks
- dist-backed or artifact-producing lanes now run sequentially after the parallel pool:
  1. dist-backed JS lint
  2. `ui scope (foundation)`
  3. `app scope`
  4. `content scope`

This prevents shared-worktree output races on local pre-push runs, especially around `packages/ui/dist`.

### Local Lint Import Contract

Local full-gate JS lint now mirrors CI's dist-import preparation before `pnpm lint:js:ci`:

- `pnpm exec turbo run build --filter=@fodmapp/ui`
- `pnpm exec turbo run build --filter=@fodmapp/reporting`

This keeps `eslint-plugin-import` resolution deterministic for workspace subpath imports during local `--full` runs.

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
- CI defaults to local `.turbo` cache restore/save (`actions/cache/restore@v5` and `actions/cache/save@v5`)
- if Turbo credentials are explicitly injected in the future, remote cache remains technically supported by the composite action

The composite action (`.github/actions/setup-js-workspace`) centralizes this selection logic and
exports `TURBO_TEAM` / `TURBO_TOKEN` into the workspace step environment when both values are
available, so downstream `turbo run` commands can use remote caching. The shared action now pins
Node 24-compatible JavaScript action runtimes for pnpm setup and Turbo cache restore.

Turbo command contract:

- Turbo-eligible CI commands must use `pnpm exec turbo run ...` to ensure local pinned Turbo resolution
- the `content-scaffolds` lane and matching local quality-gate content scope run `build` first, then `typecheck`,
  to avoid generated-artifact races in scaffold apps that write framework outputs during both phases
  (for example Next.js `.next/*` and Astro `.astro/*`)
- intentional non-Turbo exceptions remain direct:
  - `pnpm --filter @fodmapp/types openapi:check` (deterministic OpenAPI parity check; avoids Turbo cache ambiguity for this gate)
  - `pnpm --filter @fodmapp/storybook exec playwright install chromium` (runtime dependency install)
  - `pnpm --filter @fodmapp/reporting render:*` commands in `Phase 2 Reporting` lanes (run-id-scoped artifact flow)

Lint import contract:

- the `eslint` job must prebuild any internal workspace package whose published imports resolve from `dist`
- current required prebuilds before `pnpm lint:ci`:
  - `pnpm exec turbo run build --filter=@fodmapp/ui`
  - `pnpm exec turbo run build --filter=@fodmapp/reporting`
- this keeps `eslint-plugin-import` resolution deterministic on clean CI checkouts for apps that import workspace subpaths such as `@fodmapp/ui/*` and `@fodmapp/reporting/*`

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
- `api-container-smoke`: `timeout-minutes: 15`
- `dbmate-smoke`: `timeout-minutes: 15`
- `phase3-promote-smoke`: `timeout-minutes: 25`
- `api-integration-seeded`: `timeout-minutes: 25`
- `api-gate`: `timeout-minutes: 5`
- seeded workflow DB profile/default URLs: `fodmapp_api_ci`

Operational behavior:

- if container initialization or test execution stalls beyond these bounds, the job is force-failed by Actions
- `api-gate` remains authoritative and fails the required `API` check when either upstream job times out
- push-to-`main` API runs remain the source of truth after merge; stale PR runs should be canceled if still running

## API Container Smoke Contract

The `API` workflow now includes a dedicated `api-container-smoke` job for the planned Git-driven
Koyeb deployment path.

Contract:

- checks out the repo on GitHub-hosted Ubuntu
- runs `docker build -f api/Dockerfile api`
- fails the PR before merge if the committed container bootstrap is broken
- is included in the aggregate `API` required check

Semantics:

- this is a build-only validation lane, not a deploy workflow
- no cloud credentials, deploy secrets, or domain wiring are introduced here
- local `quality-gate.sh` stays unchanged; container build validation remains CI-only for portability

## API DBMate Smoke Contract

The `API` workflow now includes a dedicated `dbmate-smoke` job for the long-lived migration lane.

Contract:

- runs on a fresh Postgres 16 service database (`fodmapp_dbmate_ci`)
- installs workspace dependencies through `.github/actions/setup-js-workspace`
- installs `postgresql-client-16` so the dump path stays on the Postgres 16 major version; `scripts/dbmate.sh` normalizes minor-version header noise before checking `schema/dbmate/schema.sql`
- runs `pnpm db:migrate` against the empty database
- asserts presence of:
  - `foods`
  - `safe_harbor_cohorts`
  - `user_consent_ledger`
  - `publish_releases`
  - `published_food_rollups`
  - `api_publish_meta_current`
  - `schema_migrations`
- asserts the baseline version `20260321000000` is recorded
- asserts the publish-boundary migration version `20260321143000` is recorded
- asserts `pnpm db:status` is clean after migrate
- asserts `pnpm phase3:promote:check` fails on the schema-only database with the explicit bootstrap-out-of-scope message
- enforces that refresh-only promote cannot be used to create the first persistent publish release
- asserts no working-tree diff remains in `schema/dbmate/schema.sql`

Intent:

- prove dbmate can bootstrap a fresh long-lived-environment schema
- keep the existing destructive replay/seed path unchanged and authoritative for disposable CI/local databases
- enforce the split contract:
  - disposable DBs: `schema/fodmap_fr_schema.sql` + replay/seed scripts
  - persistent DBs: `schema/dbmate/` + `pnpm db:*`

## Phase 3 Bootstrap Smoke Contract

The `API` workflow now includes a dedicated `phase3-bootstrap-smoke` job for first-time persistent-db load.

Contract:

- runs on a fresh Postgres 16 service database (`fodmapp_bootstrap_ci`) after `pnpm db:migrate`
- proves `pnpm phase3:bootstrap:check` fails before CIQUAL files are present, then succeeds once explicit CIQUAL paths are available
- runs `pnpm phase3:bootstrap` once on the schema-only database
- asserts the bootstrap manifest and current views report:
  - `42` resolved Phase 2 priorities
  - `42` published rollups
  - `252` published subtype rows
  - `11` published swaps
  - `11` active / `1` draft MVP swap rules
  - a current `api_v0_phase3` publish release
- asserts a rerun of `pnpm phase3:bootstrap:check` fails with the schema-only-only guard once the database is loaded
- runs `pnpm phase3:promote:check` and one `pnpm phase3:promote` handoff after bootstrap
- asserts the second publish creates a new `publish_id` while counts stay stable
- asserts the worktree stays clean after bootstrap + promote, proving the new temp review-packet flow does not mutate tracked review CSVs or depend on git restore

Intent:

- prove the first persistent Neon load path is non-destructive
- prove bootstrap hands off cleanly to the refresh-only promote lane
- keep destructive replay/bootstrap limited to disposable CI/local databases

## Phase 3 Promote Smoke Contract

The `API` workflow now includes a dedicated `phase3-promote-smoke` job for the persistent-db refresh lane.

Contract:

- seeds a disposable Postgres 16 database with the existing replay + `phase3_seed_for_api_ci.sh` path first
- stamps the current dbmate migration versions into that replay-seeded disposable database before promote runs, so the preflight contract stays strict while replay/bootstrap remains the disposable setup lane
- captures the current `api_v0_phase3` `publish_id` plus published row counts and active/draft swap counts
- captures the active publishable-rule `scoring_version` distribution before the first promote run
- runs `pnpm phase3:promote` twice with JSON manifests
- asserts each run produces a new current `publish_id`
- asserts published rollup/subtype/swap counts stay stable across reruns
- asserts `swap_rules.status` counts stay unchanged across reruns
- asserts the active publishable-rule `scoring_version` distribution stays unchanged across reruns
- relies on the runner to recheck conservative active-rule eligibility before publish and to execute publish apply/checks inside one transaction
- asserts the repo worktree stays clean after promote, proving the runner does not depend on git restore or review-packet mutation

Intent:

- prove the new operator lane is non-destructive and publish-safe for already-loaded databases
- keep Gate A / Gate B review flows unchanged for human-reviewed batch work
- block hosted persistent-db activation until the refresh lane has explicit CI proof

## Seeded Publish-Boundary Contract

The seeded API lane now validates the serving boundary instead of reading compiler-owned latest views directly through the API.

Contract:

- `etl/phase3/scripts/phase3_seed_for_api_ci.sh` runs:
  - `etl/phase3/sql/phase3_publish_release_apply.sql`
  - `etl/phase3/sql/phase3_publish_release_checks.sql`
- `.github/scripts/ci-api-pr.sh` and `.github/workflows/api.yml` assert:
  - a current `api_v0_phase3` publish release exists
  - `api_food_rollups_current` exposes the expected `42` rollups
  - `api_food_subtypes_current` is populated
  - `api_swaps_current` matches the full active publishable swap source count, while the seeded MVP fixture itself still stays pinned at `11` active and `1` draft rows

Semantics:

- Phase 3 compute is unchanged and still rebuilds the transient `v_phase3_*_latest*` sources first.
- publish is a separate atomic layer that copies those sources into immutable `publish_id` tables and flips the `api_*_current` views.
- integration tests therefore exercise the same serving boundary that the hosted API will depend on later.

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
