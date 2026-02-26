# Near-Term Risk Register

## High Priority

1. Rollup refresh uses drop/recreate snapshots

- Why it matters: can create availability gaps or race windows during refresh cycles.
- Current status: unresolved.
- Mitigation: publish/swap refresh pattern before live frontend traffic.

2. No migration execution track for long-lived environments

- Why it matters: schema drift risk grows once staging/prod diverge.
- Current status: unresolved.
- Mitigation: introduce migration tool when first schema change is needed.

3. Architecture-data cross-contamination

- Why it matters: unrelated changes in same PR increase review risk and slow both tracks.
- Current status: controlled via worktrees, but requires discipline.
- Mitigation: strict PR scope and per-track ownership.

## Medium Priority

4. Token/theming drift across frontend workstreams

- Why it matters: inconsistent visuals and expensive refactors.
- Mitigation: central token package and semantic token naming policy.

5. OpenAPI consumer drift when frontend work starts rapidly

- Why it matters: runtime integration bugs.
- Mitigation: keep generated types as only client contract source.

6. Storybook/test runner CI instability

- Why it matters: flaky UI gates reduce trust.
- Mitigation: pin versions, deterministic build+test sequence, minimal baseline stories first.

## Low Priority For Now

7. Physical folder relocation to `services/` and `evidence/`

- Why it matters: cleaner topology.
- Why low now: mostly organizational; low direct user/runtime value.
