# Historical Record

This file is archived for traceability only.
Former active path: `docs/transition/discussion-history.md`.
Link to this archive path directly when historical context is required.

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

## Phase 7: Data-Engine Expansion And Coverage Uplift

- Batch01/Batch02/Batch03 direct-swap pipelines were implemented and activated under strict human gates.
- Coverage uplift sprints A/B/C were executed with research-led evidence protocols and explicit audit artifacts.
- The global `known_subtypes_count=1` bucket was reduced from `21` to `0`.
- Batch03 added active rules, while preserving strict second-review policy.

## Phase 8: Ceiling Confirmation And Pause

- Batch04 feasibility probe (post Batch C) confirmed:
  - 10 candidates
  - 10 require second review
  - 0 single-review eligible
- Conclusion: data-engine expansion reached a policy ceiling without second-review capacity.
- Operational state is intentionally paused with one open blocker:
  - issue #26 (deferred activation requiring independent second reviewer).
