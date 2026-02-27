# Contributing

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
   - `./.github/scripts/ci-api-pr.sh` for API changes needing seeded integration parity with CI

Tip: `pnpm install` (via `prepare`) configures local Git hooks, and pushes are now blocked until `./.github/scripts/quality-gate.sh --full` passes.

## Root Command Contract

- `pnpm lint`: formatting/lint baseline (`prettier --check`).
- `pnpm typecheck`: explicit package coverage (`content-config`, `types`, `ui`, `storybook`, `app`, `marketing`, `research`).
- `pnpm test`: fast deterministic unit test coverage (`ui`, `app`).
- `pnpm test:storybook`: browser-based Storybook interaction/a11y tests.
- `pnpm check:all`: full local CI mirror for governance + tokens + styles + UI + Storybook + scaffold apps.
- `./.github/scripts/ci-api-pr.sh`: API CI parity runner (contract/unit tests + seeded integration flow).

## Merge Policy

- Prefer squash merge unless release tooling requires otherwise.
- Keep `main` protected in GitHub settings.
