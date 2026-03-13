#

# Historical Record

This file is archived for traceability only.
Former active path: `docs/transition/eslint-next-phase-plan.md`.
Link to this archive path directly when historical context is required.

# Phase Plan: ESLint Baseline Follow-up (Post Merge, PR #73)

## Status

- Baseline phase (`main`) is merged.
- This worktree is dedicated to implementing the next phase follow-up while keeping JS/TS baseline policy untouched.
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

## Proposed phase 1 (planning and baseline capture) ✅ COMPLETE

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

## Phase 1 completion update

- Confirmed Python tooling inventory and explicit `uv` lockfile usage were documented as in-scope.
- Added `ruff` as the Python baseline candidate with initial `tool.ruff` config in:
  - `api/pyproject.toml`
  - `etl/phase2/reporting/pyproject.toml`
- Added dependency entries and generated lock updates in `api/uv.lock` and `etl/phase2/reporting/uv.lock`.
- Added execution surfaces:
  - Root scripts: `python:lint:api`, `python:lint:reporting`, `python:lint`, `python:ci`.
  - CI job: `python-lint` in `.github/workflows/ci.yml` with `pnpm python:ci`.
- Baseline validation state: `pnpm python:ci` currently passes after import ordering and line-length normalization in targeted scripts.
