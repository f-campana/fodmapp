# ESLint Next Phase Plan (Post-Baseline Remediation)

## Objective

- Lock in architecture governance decisions after ESLint baseline is stable.
- Keep JS/TS lint behavior strict while adding graph-level maintainability checks.
- Stage Python parity after the next phase lands cleanly in JS/TS and CI.

## Phase 4 Scope (current)

1. Complete architecture tooling decisions and baseline policy.
2. Define minimal implementation path for automated boundary enforcement.
3. Validate on CI and then begin Python parity as a separate phase.

## Repository fit / constraints

- Monorepo: `pnpm` workspace, not Nx.
- Languages in scope (now): JS/TS first, with Python already tracked separately.
- Preference: explicit dependency rules, deterministic checks, and low operational overhead.

## Recommended tool stack

Given the above constraints, start with:

1. `eslint-plugin-boundaries` for import-boundary shaping at lint time.
2. `dependency-cruiser` as long-lived architecture graph guardrail.
3. `tsarch` as an optional secondary add-on only if we need readable slice tests.

This is aligned with the decision rule:

- Nx workspace -> Nx boundaries (not this repo).
- Active graph governance + robust constraints -> dependency-cruiser.
- ESLint-first quick wins -> eslint-plugin-boundaries.
- Need explicit from/to layer tests -> add tsarch only as optional.

## Why Python is deferred

- Python parity is important, but should remain separate to avoid widening risk while ESLint baseline gates are still hardening.
- Keeping this phase JS/TS-only preserves CI clarity and avoids lockfile churn in multiple ecosystems at once.

## Proposed tasks

1. Add `dependency-cruiser` config and baseline rules.
2. Add script wrappers (for example `pnpm deps:graph` and `pnpm deps:check`).
3. Add `eslint-plugin-boundaries` config in `packages/eslint-config` if import contract patterns need lint-time enforcement.
4. Add CI job(s) with deterministic failures and output artifacts.
5. Run baseline gate matrix:
   - `pnpm lint`
   - `pnpm lint:ci`
   - `pnpm lint:llm` (if changed files include `apps/**` or `packages/ui`)
   - `pnpm exec dependency-cruiser --validate`
   - targeted architecture CI checks.
6. Once green:
   - Open dedicated Python parity follow-on branch.
   - Add `ruff`/`uv` parity, reporting scripts, and optional pre-commit hooks.

## Open questions before implementation

- Boundary contracts: enforce by package tags first, then layer-level granularity.
- Acceptable false-positive tolerance before strict mode in CI.
- Whether to include generated module graphs in baseline snapshots (yes, if drift control is needed).

## Exit criteria

- Phase 4 architecture checks have green CI on all existing JS/TS jobs.
- PR includes only docs/config/script additions for architecture tools.
- Python lint parity is intentionally deferred to a follow-up PR.
