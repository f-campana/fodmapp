# Phase Plan: ESLint Baseline Follow-up (Post Merge, PR #73)

## Status
- Baseline phase (`main`) is merged.
- This worktree is dedicated to planning and preparing the next phase without affecting baseline policy.
- Branch: `codex/eslint-baseline-next-phase`
- Source base: `/Users/fabiencampana/Documents/Fodmap-eslint-next-phase`

## Next phase focus
Python quality tooling parity and enforcement consistency with the merged JS/TS baseline.

## Architecture testing decision (paused discussion resolution)
- Repo is a PnPM/Turbo monorepo, not Nx.
- Recommendation: adopt **dependency-cruiser** as the primary architecture policy engine.
- Keep **ts-arch** as a **targeted add-on** only when explicit slice-level / PlantUML readability checks are needed.
- Why this choice:
  - `dependency-cruiser` is actively maintained and supports CI-grade graph policy (`forbidden`/`required`/`allowed`).
  - Existing constraints are best enforced as graph-level contracts rather than only import-level heuristics.
  - `ts-arch` is useful for readability DSL, but lower ecosystem momentum makes it a weaker single source of truth.
- Optional local developer ergonomics:
  - `eslint-plugin-boundaries` can be added later if we need immediate import-boundary lint feedback in editor/PR checks.

### Proposed architecture rollout order (before implementation)
1. Define initial layer rules for JS/TS workspace (apps/packages) without changing behavior yet.
2. Run dependency-cruiser in report-only mode and capture findings.
3. Remediate or explicitly baseline acceptable legacy patterns.
4. Gate only after baseline is clean and policy is accepted.
5. Revisit ts-arch as optional supplementary checks if needed for explicit slice contracts.

## Working assumptions
- Keep JS/TS baseline unchanged unless required by cross-language toolchain constraints.
- Python scope is explicit and isolated to avoid destabilizing the lint rollout already merged.
- Gate behavior remains CI-first: warnings treated as failures in CI.
- Changes should be incrementally introduced to preserve recoverability.

## Proposed phase 1 (planning and baseline capture)
- Inventory current Python tooling, packaging, and script boundaries:
  - `uv`/`poetry`/`pip` usage, lockfile model, Python interpreter matrix.
  - Existing Python style checks and existing pre-commit or CI hooks.
- Define a single source of truth for Python style and lint policy:
  - `ruff` as lint + formatter baseline candidate.
  - `pyproject.toml` contract for line length, import ordering, unused checks, complexity bounds.
- Define command surfaces for parity with JS/TS:
  - local: `pnpm` workspace shim or `uv` task alias equivalent.
  - CI: dedicated job path and failure gating.
- Define allowed warning posture:
  - strict CI fail on warnings for new baseline checks.

## Proposed phase 2 (minimal viable parity)
- Add only essential Python checks:
  - `ruff check`
  - `ruff format --check`
- Wire into quality gate scripts and required CI jobs.
- Add one small pilot directory for validation (non-global if risk is high).
- Resolve existing drift-only findings before enforcing strict gate.

## Proposed phase 3 (incremental hardening)
- Add targeted rules for maintainability and readability parity:
  - import ordering normalization
  - ambiguous naming warnings
  - bounded function complexity/size where useful
- Add CI docs and prompt contract for AI-generated Python artifacts.
- Keep rule growth aligned to findings reduction and reviewer capacity.

## Out-of-scope for this phase
- Architecture graph policy tools (`dependency-cruiser` / `tsarch`) until explicit Phase 2 decision and scope sign-off.
- Major migration from `pip`/`pnpm` to `uv` as a prerequisite for rule adoption.
- Human-generated content refactors outside lint-policy touch points.

## Exit criteria
- Python checks run and pass on `main` in CI with no soft-fail tolerance.
- JS/TS baseline remains unchanged and green.
- Phase-2 and phase-3 decisions recorded in `docs/transition` with explicit risk log and migration notes.
