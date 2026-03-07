# Contributing

Status: Implemented
Audience: Contributor or engineer; Maintainer or operator
Scope: Branching, commit, PR, and local validation expectations for repository contributors.
Related docs: [README.md](./README.md), [docs/foundation/documentation-personas.md](./docs/foundation/documentation-personas.md), [docs/README.md](./docs/README.md)
Last reviewed: 2026-03-08

## Branching

- Branch from `main`.
- Name branches with intent prefixes:
  - `feat/*`
  - `fix/*`
  - `chore/*`
  - `docs/*`
  - `codex/*`

## Commits

Use Conventional Commits:

- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `perf`
- `test`
- `build`
- `ci`
- `chore`
- `revert`

Example:

```
feat(schema): add source confidence index
```

## Pull Requests

1. Use a semantic PR title.
2. Link the issue or context.
3. Explain behavior/contract impact.
4. Run and report:
   - `./.github/scripts/quality-gate.sh --full`
   - `pnpm lint:ci` for warning-fail-fast PR validation (already included in `--full`)
   - `pnpm lint:llm` for LLM-authored code (warnings as hard failures in CI for `lint:llm:ci`)
   - `pnpm changeset:ci:lint:all` to validate all `.changeset/*.md` frontmatter package names against workspace manifests
   - `./.github/scripts/ci-api-pr.sh` for API changes needing seeded integration parity with CI
5. Changesets policy:
   - Default: if `apps/*` or `packages/*` changed, include a `.changeset/*.md` entry.
   - Root-only note: if only releasable root files changed (for example `package.json`, `pnpm-lock.yaml`) and no workspace package/app changed, the gate skips changeset coverage requirements.
   - Exemption: allowlisted prototype packages may skip `.changeset` only with PR label `changeset-exempt`.
   - Current allowlist (`CHANGESET_EXEMPT_PACKAGES`): `@fodmap/mobile-prototype`.
   - Frontmatter package names in changed `.changeset/*.md` files must be valid workspace package names (`apps/*` / `packages/*`).
   - Local parity note: for exemption-path pushes before PR labeling, run `PR_LABELS=changeset-exempt git push`.
   - Debug note: run `CHANGESET_CHECK_DEBUG=1 pnpm changeset:ci:status:strict` for verbose diff/frontmatter/workspace diagnostics.
6. CI scope note:
   - Heavy Turbo jobs are PR-scoped via `pr-scope` and may show as `skipped`; the `CI` gate treats scoped `skipped` jobs as acceptable.

## Public Repository Intake Policy

- Issues are open for public feedback and bug reports.
- Pull request creation is restricted to approved collaborators.
- Non-collaborators should open an issue first; maintainers can invite a collaborator when code contribution is approved.

Tip: `pnpm install` (via `prepare`) configures local Git hooks, and pushes are blocked until `./.github/scripts/quality-gate.sh --full` passes (delete-only pushes are skipped).
After branch/worktree sync, run `pnpm install` before pushing.
The pre-push full quality gate runs monorepo-wide checks, not only changed-package scopes.

## Root Command Contract

- `pnpm lint`: formatting/lint baseline (`prettier --check`).
- `pnpm typecheck`: Turbo-orchestrated typecheck using `pnpm exec turbo run typecheck --only` with explicit filters for `content-config`, `types`, `ui`, `reporting`, `storybook`, `app`, `marketing`, and `research`.
- `pnpm test`: fast deterministic unit test coverage (`ui`, `app`).
- `pnpm test:storybook`: browser-based Storybook interaction/a11y tests.
- `pnpm check:all`: full local CI mirror for governance + tokens + styles + UI + Storybook + scaffold apps.
- `./.github/scripts/ci-api-pr.sh`: API CI parity runner (contract/unit tests + seeded integration flow).

Turbo command policy:

- Scripts that map to Turbo tasks should use `pnpm exec turbo run ...` for strict local binary resolution.
- Keep direct package commands only when Turbo orchestration is not the right fit (for example `app:dev`, `tokens:generate`, `openapi:generate`).

## Merge Policy

- Prefer squash merge unless release tooling requires otherwise.
- Keep `main` protected in GitHub settings.
