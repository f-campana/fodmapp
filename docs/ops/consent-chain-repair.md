# Consent Chain Repair Runbook

## Purpose

Repair `user_consent_ledger_events` rows where `prev_hash` and `event_hash` do not match the canonical consent-chain payload.

This operation is **one-time** and should be executed only after deploying the P0 consent-chain unification.

## Script

- Path: `api/scripts/repair_consent_event_chain.py`
- Modes:
  - dry-run (default)
  - apply (`--apply`)
- Optional scope:
  - one account: `--user-id <uuid>`

## Preconditions

1. Deploy backend code that uses shared consent-chain hashing logic.
2. Confirm database migration `schema/migrations/2026-02-25_security_consent_export_delete.sql` is applied.
3. Ensure `API_DB_URL` points to the target environment.
4. Confirm no active schema migration is running.

## Dry-run

From repository root:

```bash
cd api
python3 scripts/repair_consent_event_chain.py
```

Expected output is JSON with:

- `users_scanned`
- `events_scanned`
- `events_mismatched`
- `events_rewritten` (must remain `0` in dry-run)
- `failures`

Dry-run pass criteria:

- `failures` is empty.
- `events_mismatched` is understood and scheduled for apply.

## Apply

Only after dry-run review:

```bash
cd api
python3 scripts/repair_consent_event_chain.py --apply
```

Optional targeted apply:

```bash
cd api
python3 scripts/repair_consent_event_chain.py --apply --user-id <uuid>
```

Apply pass criteria:

- `failures` is empty.
- `events_rewritten` equals expected repair count.

## Post-apply Verification

1. Run targeted API check for repaired users:
   - `GET /v0/me/consent` returns `200` (no `409 Consent event chain invalid`).
2. Run integration tests:

```bash
cd api
pytest tests/test_me_security.py tests/test_sync_batch_mutations.py tests/test_health.py
```

3. Monitor warning/error logs for consent-chain conflicts.

## Rollback

No automatic rollback script is provided.

Rollback strategy:

1. Restore from point-in-time backup taken before apply.
2. Re-run dry-run to confirm mismatch state.
3. Re-attempt targeted apply with `--user-id` if needed.

## Notes

- The script is fail-closed for runtime behavior: production APIs still reject invalid chains.
- The script exits non-zero only when unrecoverable processing failures occur.
