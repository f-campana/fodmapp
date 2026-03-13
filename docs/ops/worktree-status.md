# Worktree Status

Last reviewed: 2026-03-13
Source of truth: team operational state (live, update as status changes)

## Rules

- Keep `/Users/fabiencampana/Documents/fodmapp` clean.
- Do all feature work in dedicated worktrees.
- Keep one initiative per worktree.
- Track `status`, `scope`, and `blockers` here.

## Current Inventory

| Worktree path                                                                       | Branch                                    | Status             | Scope                                                                                 | Notes / blockers                                                    |
| ----------------------------------------------------------------------------------- | ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `/Users/fabiencampana/Documents/fodmapp`                                            | `main`                                    | active (protected) | Main integration worktree only                                                        | Must remain clean.                                                  |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/phase3-composition-zero-batch01`   | `codex/phase3-composition-zero-batch01`   | merged             | Phase 3 composition-zero Batch01 research/docs/sql artifacts                          | Merged via PR #188; worktree removed.                               |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/local-path-contract-fodmapp`       | `codex/local-path-contract-fodmapp`       | merged             | PR-A local path contract canonicalization                                             | Merged via PR #184.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/local-path-migration-evidence`     | `codex/local-path-migration-evidence`     | merged             | PR-B local main-path migration evidence and closure                                   | Merged via PR #187.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/api-workflow-timeout-hardening`    | `codex/api-workflow-timeout-hardening`    | merged             | API workflow timeout hardening for runner container-init stalls                       | Merged via PR #190; worktree removed.                               |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lane-structure-refactor`        | `codex/ui-lane-structure-refactor`        | merged             | Lane-based UI implementation folder reorganization + taxonomy checker/docs alignment  | Merged via PR #185.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/public-cutover-decision-record`    | `codex/public-cutover-decision-record`    | merged             | PR-1 decision record for public cutover (`ADR-018`)                                   | Merged via PR #177.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/public-cutover-hardening`          | `codex/public-cutover-hardening`          | merged             | PR-2 workflow hardening and CI/env contract updates                                   | Merged via PR #178.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/public-cutover-evidence`           | `codex/public-cutover-evidence`           | merged             | PR-3 cutover evidence capture and status closure                                      | Merged via PR #179.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/public-readiness-surface`          | `codex/public-readiness-surface`          | merged             | PR-A public surface, community files, and metadata baseline                           | Merged via PR #181.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/menubar-responsive-a11y`           | `codex/menubar-responsive-a11y`           | merged             | Menubar responsive stress a11y remediation exposed by PR #212                         | Merged via PR #213; worktree removed and branch deleted.            |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/public-readiness-docs-targeted`    | `codex/public-readiness-docs-targeted`    | active             | PR-B targeted docs cleanup and canonicalization                                       | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/storybook-structure-next`          | `codex/storybook-structure-next`          | merged             | Storybook nested structure contract, `_shared` infra, and recursive taxonomy support  | Merged via PR #218; worktree removed and branch deleted.            |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-state-controls-batch-f`         | `codex/ui-state-controls-batch-f`         | active             | Batch F state controls (`alert-dialog`, `slider`, `switch`, `toggle`, `toggle-group`) | Ready for PR; quality gate green on 2026-03-13.                     |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-g-combobox-ref`       | `codex/ui-lib-batch-g-combobox-ref`       | merged             | PR-15 Batch G combobox reference gate                                                 | Merged via PR #167 and release PR #168 on March 3, 2026.            |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-f-external`           | `codex/ui-lib-batch-f-external`           | merged             | PR-14 Batch F external primitives                                                     | Merged via PR #165.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-f-command-ref`        | `codex/ui-lib-batch-f-command-ref`        | merged             | PR-13 Batch F command reference gate                                                  | Merged via PR #163.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-e-forms`              | `codex/ui-lib-batch-e-forms`              | merged             | PR-12 Batch E forms (accordion, input-group, input-otp)                               | Merged via PR #161 and release PR #162.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-e-select-ref`         | `codex/ui-lib-batch-e-select-ref`         | merged             | PR-11 Batch E select reference gate                                                   | Merged via PR #159 and release PR #160.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-d-menus`              | `codex/ui-lib-batch-d-menus`              | merged             | PR-10 Batch D menus (context-menu, menubar, navigation-menu)                          | Merged via PR #157 and release PR #158.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-d-dropdown-ref`       | `codex/ui-lib-batch-d-dropdown-ref`       | merged             | PR-09 Batch D dropdown-menu reference gate                                            | Merged via PR #155 and release PR #156.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-c-overlays`           | `codex/ui-lib-batch-c-overlays`           | merged             | PR-08 Batch C overlays                                                                | Merged via PR #153 and release PR #154.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-c-dialog-ref`         | `codex/ui-lib-batch-c-dialog-ref`         | merged             | PR-07 Batch C dialog reference gate                                                   | Merged via PR #151 and release PR #152.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-b-radix-2`            | `codex/ui-lib-batch-b-radix-2`            | merged             | PR-06 Batch B Radix wrappers set 2                                                    | Merged via PR #149 and release PR #150.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-b-radix-1`            | `codex/ui-lib-batch-b-radix-1`            | merged             | PR-05 Batch B Radix wrappers set 1                                                    | Merged via PR #147 and release PR #148.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-a-custom`             | `codex/ui-lib-batch-a-custom`             | merged             | PR-04 Batch A custom primitives                                                       | Merged via PR #145 and release PR #146.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-a-primitives-2`       | `codex/ui-lib-batch-a-primitives-2`       | merged             | PR-03 Batch A primitives-2                                                            | Merged via PR #144.                                                 |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-lib-batch-a-primitives-1`       | `codex/ui-lib-batch-a-primitives-1`       | merged             | PR-02 Batch A primitives-1                                                            | Merged via PR #142 and release PR #143.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-primitives-story-parity`        | `codex/ui-primitives-story-parity`        | merged             | Storybook parity pass for badge/card/field/input                                      | Merged via PR #140 and release PR #141.                             |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-library-fr-market`              | `codex/ui-library-fr-market`              | merged             | @fodmap/ui complete shared library rollout (French market)                            | Merged via PR #138 and release PR #139.                             |
| `/Users/fabiencampana/Documents/Fodmap-color-remediation-core`                      | `codex/color-remediation-core`            | active             | Color remediation PR-1 (tokens + ui + sb)                                             | In progress; full validation pending.                               |
| `/Users/fabiencampana/Documents/Fodmap-color-remediation-reporting`                 | `codex/color-remediation-reporting`       | active             | Color remediation PR-2 (reporting)                                                    | In progress; scientific color migration pending.                    |
| `/Users/fabiencampana/Documents/Fodmap-changesets-preflight-hotfix`                 | `codex/changesets-preflight-403-hotfix`   | active             | Changesets release preflight 403 hotfix                                               | Fix false-fail on main release workflow.                            |
| `/Users/fabiencampana/Documents/Fodmap-barcode-v1`                                  | `codex/barcode-feature-v1`                | on-hold            | Barcode prototype feature                                                             | Postponed.                                                          |
| `/Users/fabiencampana/Documents/Fodmap-ci-skill-policy-gate`                        | `codex/ci-skill-policy-gate`              | active             | CI linting policy hardening                                                           | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-ci-workflow-hardening`                       | `codex/ci-workflow-hardening`             | merged             | CI workflow hardening and gate determinism                                            | Merged via PR #90; keep until cleanup decision.                     |
| `/Users/fabiencampana/Documents/Fodmap-design-system-skill-pilot`                   | `codex/design-system-skill-pilot`         | active             | Design system skill pilot                                                             | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-reporting-plan`                              | `codex/phase2-reporting-phase4-delivery`  | active             | Phase 2 reporting implementation plan                                                 | Successor branch for no-force Phase 4 delivery.                     |
| `/Users/fabiencampana/Documents/Fodmap-unknown-fodmap-research`                     | `codex/unknown-fodmap-research`           | active             | Unknown FODMAP research                                                               | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-api-p0-mainline`            | `codex/mobile-api-p0-mainline`            | active             | Mobile API P0 mainline                                                                | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-app-p1-mainline`            | `codex/mobile-app-p1-mainline`            | active             | Mobile app P1 mainline                                                                | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-app-p1-mainline-r2`         | `codex/mobile-app-p1-mainline-r2`         | active             | Mobile app P1 mainline rerun                                                          | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-implementation-track`       | `codex/mobile-implementation-track`       | active             | Mobile implementation track                                                           | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/fodmap-ci-automation-audit`        | `codex/ci-automation-audit`               | active             | CI script/workflow simplification                                                     | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-prototype-alt-prototype-v3` | `codex/mobile-prototype-alt-prototype-v3` | active             | Mobile prototype alt iteration v3                                                     | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-research-realignment`       | `codex/mobile-research-realignment`       | active (to split)  | Mobile research + ADR + implementation                                                | Planned split into dedicated worktrees by scope.                    |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-research-docs-extract`      | `codex/mobile-research-docs-extract`      | active             | Mobile docs extract (ADR-017/017b + alignment/control plan)                           | Split from `codex/mobile-research-realignment` for focused docs PR. |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/docs-foundation-canon`             | `codex/docs-foundation-canon`             | merged             | Canonical project definition and documentation persona baseline                       | Merged via PR #192; worktree removed.                               |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/docs-frontdoor-routing`            | `codex/docs-frontdoor-routing`            | merged             | Root README and docs index routing aligned to foundation canon                        | Merged via PR #193; worktree removed.                               |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/docs-entrypoint-alignment`         | `codex/docs-entrypoint-alignment`         | merged             | Metadata and authority alignment for high-traffic active docs                         | Merged via PR #194 and release PR #195; worktree removed.           |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/docs-lifecycle-classification`     | `codex/docs-lifecycle-classification`     | merged             | Transition, plans, research, and archive lifecycle classification                     | Merged via PR #197; worktree removed.                               |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/docs-pr-governance`                | `codex/docs-pr-governance`                | merged             | PR template and contributing rules for canonical-doc governance reporting             | Merged via PR #199; worktree removed.                               |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/docs-automation-audit-v1`          | `codex/docs-automation-audit-v1`          | merged             | Weekly docs hygiene workflow and report-only markdown drift audit                     | Merged via PR #207; worktree removed.                               |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/revolut-research-report`           | `codex/revolut-research-report`           | active             | Revolut research reporting                                                            | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/changeset-gate-deterministic`      | `codex/deterministic-changeset-gate-fix`  | active             | Deterministic changeset gate remediation                                              | In progress.                                                        |
| `/Users/fabiencampana/Documents/Fodmap-worktrees/turbo-audit-remediation`           | `codex/turbo-audit-remediation`           | active             | Turbo audit remediation                                                               | Cache correctness, CI cache, PR scope, scripts.                     |

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

| Remote branch                                   | Status  | Blocker                                 | Next resume condition                            |
| ----------------------------------------------- | ------- | --------------------------------------- | ------------------------------------------------ |
| `origin/codex/phase2-manual-resolution-batch01` | on-hold | Human specialist second review required | Resume when specialist review is available.      |
| `origin/codex/uv-api-pilot`                     | on-hold | API uv migration follow-up              | Resume when API migration capacity is available. |
