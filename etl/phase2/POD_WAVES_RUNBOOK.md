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

## Wave execution contract (active)
- `fructan_wave01` executed (mutating, all rows `create_new_food`).
- `fructan_wave02` executed (mutating, all rows `create_new_food`).
- `gos_wave01` executed (mutating, mixed mode):
  - `resolve_existing`: ranks `18,19,20,22,23`
  - `create_new_food`: rank `21`
- `gos_wave02` executed (mutating, mixed mode):
  - `resolve_existing`: rank `25`
  - `create_new_food`: ranks `24,26,27,28,29`
  - category split on create rows:
    - `24,26,27 -> legumineuses`
    - `28,29 -> noix_et_graines`
- `polyol_wave01` executed (mutating, mixed mode):
  - `resolve_existing`: `30,31,33,35,36`
  - `create_new_food`: `32`
  - locked CIQUAL mappings:
    - `30 -> 13039` (pomme crue)
    - `31 -> 13037` (poire crue)
    - `33 -> 13043` (pêche crue)
    - `35 -> 13100` (prune crue, fresh plum semantic)
    - `36 -> 13042` (pruneau sec, dried prune semantic)
  - rank `32` created as `phase2-cerise-douce-crue` in category `fruits`
- `polyol_wave02` executed (mutating, mixed mode):
  - `resolve_existing`: `37,42`
  - `create_new_food`: `38`
  - locked CIQUAL mappings:
    - `37 -> 20056` (champignon de Paris, cru)
    - `42 -> 20023` (céleri branche, cru)
  - rank `38` created as `phase2-shiitake-cru` in category `legumes_et_verdures`
- Apply script enforces:
  - exact rank-set lock
  - source/enum/category validation
  - mixed-path decision integrity (`resolve_existing` candidate checks + `create_new_food` scaffold checks)
  - measurement arithmetic and threshold ordering
  - dynamic candidate-pool delta checks from pre-apply baseline
  - out-of-scope row immutability
- Checks script enforces:
  - `42` total priority rows
  - post-wave01: `16` resolved links, `26` unresolved rows
  - post-wave02: `21` resolved links, `21` unresolved rows
  - post-gos-wave01: `27` resolved links, `15` unresolved rows
  - post-gos-wave02: `33` resolved links, `9` unresolved rows
  - post-polyol-wave01: `39` resolved links, `3` unresolved rows
  - post-polyol-wave02: `42` resolved links, `0` unresolved rows
  - wave rows all `threshold_set` for each executed wave
  - fructan completion row:
    - post-wave01: `resolved=12`, `completed=11`, `pending=1`
    - post-wave02: `resolved=17`, `completed=16`, `pending=1`
  - GOS completion row:
    - post-gos-wave01: `resolved=6`, `completed=6`, `unresolved=6`, `pending=0`
    - post-gos-wave02: `resolved=12`, `completed=12`, `unresolved=0`, `pending=0`
  - polyol sorbitol completion row:
    - post-polyol-wave01: `priority=7`, `resolved=7`, `completed=7`, `unresolved=0`, `pending=0`
  - polyol mannitol completion row:
    - post-polyol-wave02: `priority=6`, `resolved=6`, `completed=6`, `unresolved=0`, `pending=0`
  - unresolved candidate pools:
    - post-gos-wave02: `with=6`, `without=3`
    - post-polyol-wave01: `with=1`, `without=2`
    - post-polyol-wave02: `with=0`, `without=0`
  - rank2 quarantine safety (`is_current=FALSE` remains operational)
  - replay-gap remediation is now the immediate follow-up sprint after Phase 2 completion

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
6. Capture outputs in PR and proceed to next wave (or replay-gap remediation once all waves are complete).
