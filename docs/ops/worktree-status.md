# Worktree Status

Last reviewed: 2026-02-26
Source of truth: team operational state (live, update as status changes)

## Rules

- Keep `/Users/fabiencampana/Documents/Fodmap` clean.
- Do all feature work in dedicated worktrees.
- Keep one initiative per worktree.
- Track `status`, `scope`, and `blockers` here.

## Current Inventory

| Worktree path                                                                 | Branch                                       | Status             | Scope                                  | Notes / blockers                                 |
| ----------------------------------------------------------------------------- | -------------------------------------------- | ------------------ | -------------------------------------- | ------------------------------------------------ |
| `/Users/fabiencampana/Documents/Fodmap`                                       | `main`                                       | active (protected) | Main integration worktree only         | Must remain clean.                               |
| `/Users/fabiencampana/Documents/Fodmap-barcode-v1`                            | `codex/barcode-feature-v1`                   | on-hold            | Barcode prototype feature              | Postponed.                                       |
| `/Users/fabiencampana/Documents/Fodmap-ci-skill-policy-gate`                  | `codex/ci-skill-policy-gate`                 | active             | CI linting policy hardening            | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-ci-workflow-hardening`                 | `codex/ci-workflow-hardening`                | active             | CI workflow hardening                  | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-design-system-skill-pilot`             | `codex/design-system-skill-pilot`            | active             | Design system skill pilot              | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-reporting-plan`                        | `codex/phase2-reporting-implementation-plan` | active             | Phase2 reporting implementation plan   | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-unknown-fodmap-research`               | `codex/unknown-fodmap-research`              | active             | Unknown FODMAP research                | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-implementation-track` | `codex/mobile-implementation-track`          | active             | Mobile implementation track            | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-research-realignment` | `codex/mobile-research-realignment`          | active (to split)  | Mobile research + ADR + implementation | Planned split into dedicated worktrees by scope. |

## On-Hold Remote Track

| Remote branch                                   | Status  | Blocker                                 | Next resume condition                            |
| ----------------------------------------------- | ------- | --------------------------------------- | ------------------------------------------------ |
| `origin/codex/phase2-manual-resolution-batch01` | on-hold | Human specialist second review required | Resume when specialist review is available.      |
| `origin/codex/uv-api-pilot`                     | on-hold | API uv migration follow-up              | Resume when API migration capacity is available. |
