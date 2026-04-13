# Worktree Status

Last reviewed: 2026-04-13
Source of truth: team operational state (live, update as status changes)

## Rules

- Keep `/Users/fabiencampana/Documents/fodmapp` clean.
- Do all feature work in dedicated worktrees.
- Keep one initiative per worktree.
- Track `status`, `scope`, and `blockers` here.

## Current Inventory

<!-- prettier-ignore -->
| Worktree path                                      | Branch                     | Status             | Scope                     | Notes / blockers              |
| -------------------------------------------------- | -------------------------- | ------------------ | ------------------------- | ----------------------------- |
| `/Users/fabiencampana/Documents/fodmapp`           | `main`                     | active (protected) | Main integration worktree | Must remain clean.            |
| `/Users/fabiencampana/Documents/Fodmap-barcode-v1` | `codex/barcode-feature-v1` | on-hold            | Barcode prototype feature | Postponed. Do not resume yet. |

Cleanup note:
The 2026-04-13 cleanup pass removed all other previously tracked worktrees and pruned their local branches unless explicitly retained. The only kept remote-only track is `origin/codex/phase2-manual-resolution-batch01`.

## Maintenance Log: Local Main Path Migration (2026-03-04)

1. Precondition verified: prior main worktree directory was clean on `main...origin/main`.
2. Target path check passed: `/Users/fabiencampana/Documents/fodmapp` did not exist.
3. Migration executed from `/Users/fabiencampana/Documents`:
   - `mv Fodmap Fodmap__rename_tmp__20260304`
   - `mv Fodmap__rename_tmp__20260304 fodmapp`
4. Worktree link repair executed from new main path:
   - `git worktree repair`
   - `git config worktree.useRelativePaths true`
   - `git worktree repair --relative-paths`
5. Post-migration verification completed at `2026-03-04T15:58:26Z`:
   - `git worktree list --porcelain` resolves all linked worktrees with main at `/Users/fabiencampana/Documents/fodmapp`.
   - Per-worktree `git rev-parse --is-inside-work-tree` and `git status --short --branch` succeeded for every linked worktree.
   - Old main-gitdir pointer scan across sibling worktree `.git` files returned no matches.
6. Evidence snapshots captured locally:
   - preflight: `/tmp/fodmapp-rename-preflight.txt` (`2026-03-04T15:57:33Z`)
   - postcheck: `/tmp/fodmapp-rename-postcheck.txt` (`2026-03-04T15:58:26Z`)

## Incident Timeline: Phase2 Reporting Full-Lane Drift (2026-03-01)

1. `main` turned red on `Phase 2 Reporting` full lane semantic baseline compare (run `22532137353`).
2. Root cause 1 confirmed: reporting SQL used `polyol_split` where contract truth is `polyol_split_needed`.
3. Root cause 2 confirmed: committed now baseline provenance was fixture-origin/stale relative to DB full-lane output.
4. Root cause 3 confirmed: lint did not enforce SQL `_contract_refs` parity against policy allowlist.
5. Active remediation branch intent: deliver hotfix on `codex/phase2-reporting-baseline-remediation` from `main` with no force-push and merge after green checks.
6. Closure criteria:
7. `Phase 2 Reporting` full lane green on merge commit to `main`.
8. Semantic baseline compare drift count is `0` on `main`.
9. Lint hard-fails on SQL allowlist drift and fixture-origin baseline provenance mismatch.
10. Post-merge workflow watch completed for `Phase 2 Reporting`, `API`, `CI`, and `Changesets release`.

## On-Hold Remote Track

| Remote branch                                   | Status  | Blocker                                 | Next resume condition                       |
| ----------------------------------------------- | ------- | --------------------------------------- | ------------------------------------------- |
| `origin/codex/phase2-manual-resolution-batch01` | on-hold | Human specialist second review required | Resume when specialist review is available. |
