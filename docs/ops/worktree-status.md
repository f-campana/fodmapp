# Worktree Status

Last reviewed: 2026-02-28
Source of truth: team operational state (live, update as status changes)

## Rules

- Keep `/Users/fabiencampana/Documents/Fodmap` clean.
- Do all feature work in dedicated worktrees.
- Keep one initiative per worktree.
- Track `status`, `scope`, and `blockers` here.

## Current Inventory

| Worktree path                                                                       | Branch                                       | Status             | Scope                                      | Notes / blockers                                 |
| ----------------------------------------------------------------------------------- | -------------------------------------------- | ------------------ | ------------------------------------------ | ------------------------------------------------ |
| `/Users/fabiencampana/Documents/Fodmap`                                             | `main`                                       | active (protected) | Main integration worktree only             | Must remain clean.                               |
| `/Users/fabiencampana/Documents/Fodmap-color-remediation-core`                      | `codex/color-remediation-core`               | active             | Color remediation PR-1 (tokens + ui + sb)  | In progress; full validation pending.            |
| `/Users/fabiencampana/Documents/Fodmap-changesets-preflight-hotfix`                 | `codex/changesets-preflight-403-hotfix`      | active             | Changesets release preflight 403 hotfix    | Fix false-fail on main release workflow.         |
| `/Users/fabiencampana/Documents/Fodmap-barcode-v1`                                  | `codex/barcode-feature-v1`                   | on-hold            | Barcode prototype feature                  | Postponed.                                       |
| `/Users/fabiencampana/Documents/Fodmap-ci-skill-policy-gate`                        | `codex/ci-skill-policy-gate`                 | active             | CI linting policy hardening                | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-ci-workflow-hardening`                       | `codex/ci-workflow-hardening`                | merged             | CI workflow hardening and gate determinism | Merged via PR #90; keep until cleanup decision.  |
| `/Users/fabiencampana/Documents/Fodmap-design-system-skill-pilot`                   | `codex/design-system-skill-pilot`            | active             | Design system skill pilot                  | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-reporting-plan`                              | `codex/phase2-reporting-phase4-delivery`     | active             | Phase 2 reporting implementation plan      | Successor branch for no-force Phase 4 delivery. |
| `/Users/fabiencampana/Documents/Fodmap-unknown-fodmap-research`                     | `codex/unknown-fodmap-research`              | active             | Unknown FODMAP research                    | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-api-p0-mainline`            | `codex/mobile-api-p0-mainline`               | active             | Mobile API P0 mainline                     | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-app-p1-mainline`            | `codex/mobile-app-p1-mainline`               | active             | Mobile app P1 mainline                     | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-app-p1-mainline-r2`         | `codex/mobile-app-p1-mainline-r2`            | active             | Mobile app P1 mainline rerun               | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-implementation-track`       | `codex/mobile-implementation-track`          | active             | Mobile implementation track                | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-prototype-alt-prototype-v3` | `codex/mobile-prototype-alt-prototype-v3`    | active             | Mobile prototype alt iteration v3          | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-research-realignment`       | `codex/mobile-research-realignment`          | active (to split)  | Mobile research + ADR + implementation     | Planned split into dedicated worktrees by scope. |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/revolut-research-report`           | `codex/revolut-research-report`              | active             | Revolut research reporting                 | In progress.                                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/turbo-audit-remediation`           | `codex/turbo-audit-remediation`              | active             | Turbo audit remediation                    | Cache correctness, CI cache, PR scope, scripts.  |

## On-Hold Remote Track

| Remote branch                                   | Status  | Blocker                                 | Next resume condition                            |
| ----------------------------------------------- | ------- | --------------------------------------- | ------------------------------------------------ |
| `origin/codex/phase2-manual-resolution-batch01` | on-hold | Human specialist second review required | Resume when specialist review is available.      |
| `origin/codex/uv-api-pilot`                     | on-hold | API uv migration follow-up              | Resume when API migration capacity is available. |
