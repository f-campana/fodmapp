# Alignment v1 (2026-02-26)

Status: Approved alignment baseline for controlled execution.

Scope reference:
- Source-of-truth decisions: `docs/research/mobile-original-instruction-tracker.md` (Section 6).
- Implementation control: `docs/research/mobile-implementation-control-plan.md`.

## Agreed alignment

1. Research and decisions stay in the research worktree only.
2. Implementation work starts only in the implementation worktree.
3. `PR-01` is the only active coding scope at this stage.
4. Every implementation PR must cite the locked decision numbers it implements.
5. Supportive-only / non-directive medical language is mandatory across app and store copy.
6. Store release declarations must remain consistent with actually shipped behavior.
7. Any change to locked decisions requires updating the tracker before coding.
8. The split manifest is retained as audit evidence of the controlled separation.
9. Backup stash remains preserved until PR-01 checkpoint is validated.

## PR-01 activation boundary

Active slice:
- `fix(app): stabilize consent bootstrap and espace runtime`

Allowed in PR-01:
1. `/espace` routing/import/runtime correctness.
2. Consent bootstrap + analytics gating correctness.
3. `ConsentRightsClient` type/runtime fixes.
4. i18n key-path alignment with copy contract.
5. Test updates required for corrected behavior.

Not allowed in PR-01:
1. New product features.
2. New release/legal scope.
3. Broad backend contract expansion unrelated to bootstrap/runtime stabilization.

## Exit criteria for PR-01

1. `pnpm --filter @fodmap/app test` passes.
2. `pnpm --filter @fodmap/app typecheck` passes.
3. `pnpm --filter @fodmap/app build` passes.
4. No path enables analytics prior to valid consent state.

## Approval record

- Decision meeting: 2026-02-26
- Outcome: Alignment v1 accepted
- Next step: Execute PR-01 in implementation worktree only
