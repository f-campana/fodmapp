# Mobile Implementation Control Plan (Post-Decision Lock)

Date: 2026-02-26
Research worktree: `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-research-realignment`
Implementation worktree: `/Users/fabiencampana/Documents/Fodmap-worktrees/mobile-implementation-track`

Role in mobile docs set:

- Canonical locked-decision register: `docs/research/mobile-original-instruction-tracker.md`
- Approved alignment baseline: `docs/research/alignment-v1-2026-02-26.md`
- This file: execution control plan derived from the locked decisions

Decision source of truth:

- `docs/research/mobile-original-instruction-tracker.md` (Section 6: Locked Decisions)

## 1) First Thin Slice (Execute First)

Slice ID: `S1-auth-consent-bootstrap`
Goal: restore implementation correctness before adding new scope.

In-scope:

1. Fix route/import correctness for `/espace` page.
2. Fix consent bootstrap semantics so analytics gating is consent-correct and test-aligned.
3. Fix `ConsentRightsClient` type/runtime correctness (state shape, polling loops, null safety).
4. Align i18n key paths with `medicalSafetyCopy` contract.
5. Repair/update failing app tests for the corrected behavior.

Out-of-scope:

- New product features.
- New backend endpoint surface.
- New legal/evidence requirements beyond correctness fixes.

Exit criteria:

1. `pnpm --filter @fodmap/app test` passes.
2. `pnpm --filter @fodmap/app typecheck` passes.
3. `pnpm --filter @fodmap/app build` passes.
4. No consent bypass path enabling analytics before consent state is explicitly valid.

## 2) PR Sequence Mapped To Locked Decisions

| PR ID | Title (Conventional)                                                        | Locked decisions covered | Scope                                                       |
| ----- | --------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| PR-01 | `fix(app): stabilize consent bootstrap and espace runtime`                  | 7, 8, 10                 | First thin slice `S1-auth-consent-bootstrap`                |
| PR-02 | `feat(api): align consent/export/delete contracts with runtime constraints` | 3, 8, 10                 | API contract correctness + data rights flow consistency     |
| PR-03 | `feat(sync): enforce offline queue conflict and replay semantics`           | 3, 6, 8                  | Queue semantics, conflict handling, idempotency correctness |
| PR-04 | `feat(app): implement anonymous-start plus account-upgrade UX gates`        | 1, 8, 9                  | Anonymous-first flow and upgrade boundaries                 |
| PR-05 | `feat(app): implement save-share swap plan and clinician export entry`      | 1, 6, 9                  | Save/share path + clinician-support entry                   |
| PR-06 | `feat(app): add opt-in notification controls with quiet/pause states`       | 7, 10                    | Notification UX policy implementation                       |
| PR-07 | `feat(app): enforce FR/EN core-flow localization coverage`                  | 10                       | Coverage + fallback hardening                               |
| PR-08 | `chore(release): pilot distribution hardening and store consistency checks` | 9, 10                    | Pilot readiness + copy/declaration parity checks            |
| PR-09 | `feat(app): barcode scan integration (phase 2)`                             | 5                        | Barcode feature as phase-2 gated deliverable                |

Notes:

- Decision 2 (iOS + Android day-1) is a global constraint across PR-01..PR-08.
- Decision 4 (required onboarding data) is applied when onboarding UI is introduced (planned after PR-01 stabilization and before GA feature completion).

## 3) Change-Control Rules

1. Every implementation PR must cite at least one locked decision number.
2. Any change to locked decisions requires updating `mobile-original-instruction-tracker.md` before code changes.
3. Keep PRs thin: one capability family per PR.
4. Keep `research` and `implementation` worktrees separated by content type.

## 4) Immediate Next Step

Proceed with PR-01 (`fix(app): stabilize consent bootstrap and espace runtime`) in the implementation worktree only.
