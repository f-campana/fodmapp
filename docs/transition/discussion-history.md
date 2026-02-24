# Discussion History (Condensed)

This timeline captures key points agreed during architecture planning and review.

## Phase 1: Separation Clarified

- The repo currently mixes scientific curation concerns with serving concerns.
- Agreement: keep both in one repo but enforce layer boundaries and explicit contracts.

## Phase 2: Initial PR Ladder (PR-1..PR-7)

- A full transition sequence was drafted (portability, migrations, monorepo scaffold, health, frontend skeletons, rollup hardening).
- This created a complete long-range path but prompted timing debate.

## Phase 3: Resequencing Debate

- A counter-view emphasized avoiding speculative scaffolding before product need.
- Strong agreement on near-term fixes with direct operational value (health, portability).
- Ongoing tension remained around when to introduce dbmate/Turborepo/frontend scaffolds.

## Phase 4: What Actually Landed

- Path portability landed.
- Health readiness landed.
- Monorepo bootstrap + OpenAPI type generation + CI stale-check landed.

## Phase 5: Frontend Track Reframed As Non-Colliding

- Data-engine work is handled by a separate agent.
- Architecture track can proceed in isolated worktrees on frontend foundations.
- Proposed immediate architecture focus: shared UI foundation + Storybook + token strategy.

## Phase 6: Tailwind v4 + shadcn Direction

- Tailwind v4 selected.
- shadcn/ui selected as accelerator for base primitives.
- Decision: use both token source package and shared Tailwind CSS package, not one or the other.
