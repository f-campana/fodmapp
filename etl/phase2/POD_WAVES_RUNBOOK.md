# Phase 2 Pod Waves Runbook

This runbook defines pod-wave execution after rank2 garlic powder quarantine.

## Pod model
- Fructan pod
- GOS pod
- Polyol pod

No pod writes directly without human review of decision/data artifacts.

## Wave order
1. `fructan_wave01` ranks `3,6,7,8,9,10`
2. `fructan_wave02` ranks `11,12,13,16,17`
3. `gos_wave01` ranks `18,19,20,21,22,23`
4. `gos_wave02` ranks `24,25,26,27,28,29`
5. `polyol_wave01` ranks `30,31,32,33,35,36`
6. `polyol_wave02` ranks `37,38,42`

Note: rank `34` is intentionally excluded because it is already resolved and ingested.

## Artifact locations
- Wave manifest:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_wave_manifest.csv`
- Decisions:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_<wave_key>_decisions.csv`
- Measurements:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_<wave_key>_measurements.csv`
- Thresholds:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_<wave_key>_thresholds.csv`
- Optional Pass3 new-food rows:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/data/phase2_<wave_key>_new_foods.csv`
- Apply SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_<wave_key>_apply.sql`
- Checks SQL:
  `/Users/fabiencampana/Documents/Fodmap/etl/phase2/sql/phase2_<wave_key>_checks.sql`

## Wave 1 execution contract (active)
- `fructan_wave01` is execution-ready and mutating.
- Decision policy for this wave is locked to `create_new_food` for all 6 ranks.
- Apply script enforces:
  - exact rank-set lock
  - source/enum/category validation
  - measurement arithmetic and threshold ordering
  - dynamic candidate-pool delta checks from pre-apply baseline
  - out-of-scope row immutability
- Checks script enforces:
  - `42` total priority rows
  - `16` resolved links, `26` unresolved rows
  - wave rows all `threshold_set`
  - fructan completion row (`resolved=12`, `completed=11`, `pending=1`)
  - rank2 quarantine safety (`is_current=FALSE` remains operational)

## Required review gates per wave
1. Every rank in wave has a decision: `resolve_existing`, `create_new_food`, or `blocked`.
2. `resolve_existing`: candidate IDs/codes and notes are present.
3. `create_new_food`: slug, FR name, EN name (when straightforward), preparation state are present.
4. `blocked`: explicit blocker and remediation note.
5. Current measurement + threshold for non-blocked rows before promotion.

## Execution loop
1. Fill decision ledger and data files for the wave.
2. Run `phase2_<wave_key>_apply.sql`.
3. Run `phase2_<wave_key>_checks.sql`.
4. Re-run `phase2_<wave_key>_apply.sql` to validate idempotency.
5. Re-run `phase2_<wave_key>_checks.sql`.
6. Capture outputs in PR and proceed to next wave.
