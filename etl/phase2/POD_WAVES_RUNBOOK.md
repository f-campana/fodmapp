# Phase 2 Pod Waves Runbook

Status: Implemented  
Audience: Data or workflow operator; Maintainer or operator  
Scope: Wave-by-wave execution contract for Phase 2 priority-food resolution after rank2 quarantine.  
Related docs: [docs/foundation/project-definition.md](../../docs/foundation/project-definition.md), [docs/foundation/documentation-personas.md](../../docs/foundation/documentation-personas.md), [docs/architecture/boundaries-and-contracts.md](../../docs/architecture/boundaries-and-contracts.md)  
Last reviewed: 2026-03-08

This runbook defines pod-wave execution after rank2 garlic powder quarantine.

## Preconditions

- Run against the intended replay or working database with the canonical schema loaded.
- Complete human review for the wave decision and data artifacts before any mutating apply step.
- Preserve the rank2 quarantine contract throughout all wave and replay operations.
- Capture apply and checks outputs for PR evidence before moving to the next wave.

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
  `etl/phase2/decisions/phase2_wave_manifest.csv`
- Decisions:
  `etl/phase2/decisions/phase2_<wave_key>_decisions.csv`
- Measurements:
  `etl/phase2/data/phase2_<wave_key>_measurements.csv`
- Thresholds:
  `etl/phase2/data/phase2_<wave_key>_thresholds.csv`
- Optional Pass3 new-food rows:
  `etl/phase2/data/phase2_<wave_key>_new_foods.csv`
- Apply SQL:
  `etl/phase2/sql/phase2_<wave_key>_apply.sql`
- Checks SQL:
  `etl/phase2/sql/phase2_<wave_key>_checks.sql`

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
2. `resolve_existing`: `candidate_ciqual_code` and notes are present (`candidate_food_id` is optional metadata only).
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

## Validation

- Every executed wave must pass its paired `phase2_<wave_key>_checks.sql` script twice: once after
  first apply and once after idempotency re-apply.
- Expected rank locks, resolved or unresolved counts, and quarantine checks must match the active
  wave contract in this document.
- Replay remediation is complete only when `phase2_replay_final_checks.sql` passes against a
  from-zero rebuild.

## Replay-gap remediation workflow (from-zero deterministic replay)

Replay runner:

- `etl/phase2/scripts/phase2_replay_from_zero.sh`

Replay sequence (locked):

1. Drop/create replay DB.
2. Apply canonical schema.
3. Run CIQUAL ETL load.
4. Apply Phase 2 setup (`phase2_priority_foods_setup.sql`).
5. Create scaffold views (`phase2_scaffold_views.sql`).
6. Create pass2 candidates view (`phase2_resolver_pass2_candidates.sql`).
7. Run deterministic pass1 resolver (`phase2_resolver_pass1.sql`).
8. Apply/check Batch01 backfill (`phase2_batch01_apply.sql`, `phase2_batch01_checks.sql`).
9. Run Batch10 ingest/quarantine/status/check chain.
10. Run all wave apply/check scripts in historical order.
11. Run final deterministic gate (`phase2_replay_final_checks.sql`).

Replay determinism contract:

- Functional invariants must match expected final state.
- UUID identity equality across fresh databases is not required.
- `resolve_existing` is CIQUAL-code-led with uniqueness guard (`COUNT(DISTINCT food_id)=1`).
- Batch10 is rank-authoritative (`food_id` column can be blank in CSV).

Final invariant highlights:

- `phase2_priority_foods`: `42` total, `42` resolved, `0` unresolved.
- gap completion:
  - fructan `17/17/16/0/1`
  - gos `12/12/12/0/0`
  - sorbitol `7/7/7/0/0`
  - mannitol `6/6/6/0/0`
- candidate pools: unresolved with candidates `0`, without candidates `0`.
- rank2 quarantine preserved (`0` current target-subtype measurements).
- `phase2_pass3:*` custom refs: count `19`, distinct count `19`.

## Product-layer handoff

Phase 2 data foundation now feeds Phase 3 SQL product-layer work:

- `etl/phase3/PRODUCT_LAYER_RUNBOOK.md`

Phase 3 executes:

- culinary trait curation for priority ranks `1..42`
- target-subtype rollups (MVP, partial overall semantics)
- initial draft swap rules with contexts and scores
