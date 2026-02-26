# AGENTS.md

## Scope

Apply these instructions to the whole repository root.

## Skill Routing

- Use `$repo-git-hygiene-bootstrap` when initializing or auditing repository governance files, workflows, branch flow, and commit/PR conventions.

## Collaboration Contract

- Use short-lived branches from `main`.
- Keep commits in Conventional Commit format.
- Keep PR titles semantic (Conventional Commit style).
- Keep PRs focused and small.
- Run the quality command before requesting merge:
  - `./.github/scripts/quality-gate.sh` (run with `--full` for full format/lint/tests/typecheck/build checks)
- A local `pre-push` Git hook is installed via `.githooks` and runs `./.github/scripts/quality-gate.sh --full` automatically on `git push` (requires `pnpm hook:install`/`pnpm prepare`, which runs during install).
- Watch for CI completion, when all green ask before merge

## Safety Rules

- Do not rewrite history on shared branches unless explicitly requested.
- Do not use destructive git commands (`reset --hard`, `clean -fd`) without explicit approval.
- Do not commit secrets or credentials.

## Worktree Operating Model

- Keep `/Users/fabiencampana/Documents/Fodmap` (main worktree) clean at all times.
- Do feature work only in dedicated worktrees on scoped branches.
- Keep one initiative per worktree; if scope expands, split to a new worktree/branch.
- Treat on-hold tracks as frozen; do not rebase, force-push, or resume without explicit approval.
- Keep live worktree/branch intent and blockers in:
  - `docs/ops/worktree-status.md`

## Phase 3 Data Contract

### Gate Flow (must follow)

For swap batches and activations, execute in this order:

1. generation/rescore
2. human review CSV update
3. activation apply
4. post-activation checks

### 3.1b Scoring / Eligibility Semantics

- Unknown endpoint handling is strict:
  - if `from_level='unknown'` or `to_level='unknown'`, set `fodmap_safety_score=0.000`
  - unknown endpoint rows are never auto-eligible
- Conservative eligibility requires all conditions:
  - non-unknown endpoints
  - non-worsening severity (`to <= from`)
  - non-worsening burden (`to_burden_ratio <= from_burden_ratio`)
  - `fodmap_safety_score >= 0.500`

### Snapshot Lock Contract

- Activation scripts must verify reviewed CSV snapshot fields against live DB values:
  - `scoring_version_snapshot`
  - `fodmap_safety_score_snapshot`
- If snapshot mismatch is detected, fail fast and do not apply status changes.

### Bilingual Rule Content

- Swap rules require bilingual instructions:
  - `instruction_fr` required
  - `instruction_en` required (or explicit deterministic fallback policy)

### Rank 2 Exclusion

- Rank 2 is excluded from swap graph references until explicitly re-verified.
- No rule may reference rank 2 as `from` or `to` in generation, apply, or activation phases.

### /v0/swaps API Contract

- Return only `active` rules.
- Deterministic sorting is mandatory:
  1. `fodmap_safety_score DESC`
  2. `overall_score DESC`
  3. `to_overall_level` severity ASC (`none`, `low`, `moderate`, `high`, `unknown`)
  4. `coverage_ratio DESC`
  5. `to_food_slug ASC`

### Additive-Only Batch Evolution

- Extend Phase 3 via new scoped batch artifacts.
- Do not destructively rewrite prior batch files/contracts.
- New batch SQL/data should coexist with previous artifacts and remain idempotent.

## Reporting

- State changed files and why.
- State validation commands run and results.
- State remaining risk or follow-up.
