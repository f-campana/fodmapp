# Mobile Original Instruction Tracker

Status: Active decision source
Last reviewed: 2026-03-08

## 1. Purpose

This document is the canonical locked-decision register for the current mobile research and
implementation tracks.

## 2. Lineage

The tracker consolidates the original mobile instruction set into one maintained decision record.
Alignment and implementation planning documents should derive their scope from this file rather
than restating or redefining the decisions.

## 3. Update Rule

If a mobile implementation or research change alters one of the locked decisions below, update
this document first and then update dependent planning or execution docs.

## 4. Current Scope Boundary

The tracker governs the active mobile research and implementation worktrees listed in
`docs/ops/worktree-status.md`, including the implementation-control and research-alignment docs in
this folder.

## 5. Related Docs

- [`docs/research/alignment-v1-2026-02-26.md`](./alignment-v1-2026-02-26.md): approved alignment
  baseline.
- [`docs/research/mobile-implementation-control-plan.md`](./mobile-implementation-control-plan.md):
  execution control plan derived from these decisions.

## 6. Locked Decisions

| Decision | Locked direction                                                                                                      | Current effect                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1        | Mobile onboarding is anonymous-first, with account upgrade only after value is delivered.                             | Do not gate first value behind account creation.                                       |
| 2        | iOS and Android remain day-1 supported platforms for the mobile track.                                                | Treat both platforms as baseline scope for implementation planning.                    |
| 3        | Consent, export, delete, and data-rights behavior must stay consistent across API, app, and sync surfaces.            | Changes to one layer require contract checks across the others.                        |
| 4        | Onboarding collects only the minimum required baseline data before first value.                                       | Apply this when onboarding UI and profile capture scope are implemented.               |
| 5        | Barcode scanning is explicitly phase-2 scope, not part of the first thin slice.                                       | Keep barcode out of PR-01 and early onboarding delivery.                               |
| 6        | Save or share flows and clinician-support entry are follow-on capabilities after the core activation path is stable.  | Do not let export/share work redefine the first-value flow.                            |
| 7        | Consent-sensitive runtime surfaces, including analytics and notifications, must be explicit opt-in and state-correct. | Notification and analytics work must preserve consent gating invariants.               |
| 8        | Restore implementation correctness before expanding product scope.                                                    | The first coding slice stays focused on stabilization rather than new feature breadth. |
| 9        | Account-backed history, sharing, and pilot-distribution surfaces are gated by explicit readiness checks.              | Later rollout work must prove readiness before broadening user-facing claims.          |
| 10       | User-facing copy must remain supportive, truthful, and aligned with actually shipped behavior.                        | Medical framing, localization, and store-facing declarations must stay consistent.     |
