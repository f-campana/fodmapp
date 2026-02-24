# FODMAP Documentation Index

Last updated: 2026-02-21

This `/docs` tree captures what has been discussed and established so far for the platform transition, frontend foundation, and delivery process.

## How To Read This

- `Implemented` means already landed on `main`.
- `Accepted` means agreed direction, not yet merged.
- `In progress` means work exists in a dedicated worktree and is not merged yet.
- `Planned` means a decision is accepted but not yet implemented.
- `Open` means still under discussion or gated by another milestone.

## Structure

- `architecture/`
  - `boundaries-and-contracts.md`: system boundaries and layer contracts.
  - `decision-register.md`: locked decisions, open decisions, and status.
- `transition/`
  - `current-state-snapshot.md`: what is currently in the repo.
  - `discussion-history.md`: timeline of major discussion points.
  - `pr-sequence-and-gates.md`: recommended sequence and acceptance gates.
  - `worktree-playbook.md`: isolated worktree workflow for architecture PRs.
  - `risk-register.md`: near-term risks and mitigations.
- `frontend/`
  - `strategy.md`: frontend ownership split and delivery model.
  - `tailwind-v4-token-architecture.md`: package strategy for Tailwind v4 and tokens.
  - `shadcn-bootstrap-plan.md`: how to bootstrap the UI library with shadcn/ui.
  - `delegation-handoff-kit.md`: what to hand off to the frontend team and agents.
  - `agent-prompts.md`: ready-to-use prompts for parallel frontend agent execution.
- `references/`
  - `external-research.md`: external references and why they matter.
