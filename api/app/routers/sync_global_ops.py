"""Account-level side effects for sync global operations.

Houses the consent-withdrawal, account-purge, and delete-receipt logic
invoked by _execute_global_op in sync.py via apply_fn callbacks.

No queue, result-building, or batch-orchestration logic — kept focused
on the account side effects only.
"""

from __future__ import annotations

from typing import Any, Dict
from uuid import UUID, uuid4

from psycopg.types.json import Jsonb

from app import sql, tracking_store
from app.config import get_settings
from app.consent_chain import insert_event as insert_consent_event
from app.consent_chain import proof_payload_signature
from app.crypto_utils import canonical_json, sha256_hex
from app.errors import bad_request
from app.models import DeleteSummary


def _now_utc():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)


def _jsonb(value: Any) -> Any:
    return Jsonb(value) if value is not None else None


def _build_delete_receipt(delete_request_id: UUID, user_id: UUID, summary: DeleteSummary) -> Dict[str, Any]:
    issued_at_utc = _now_utc().isoformat().replace("+00:00", "Z")
    payload = {
        "scope": "delete",
        "delete_request_id": str(delete_request_id),
        "user_id": str(user_id),
        "consent_records_touched": summary.consent_records_touched,
        "queue_items_dropped": summary.queue_items_dropped,
        "symptom_logs_deleted": summary.symptom_logs_deleted,
        "diet_logs_deleted": summary.diet_logs_deleted,
        "swap_history_deleted": summary.swap_history_deleted,
        "exports_invalidated": summary.exports_invalidated,
        "issued_at_utc": issued_at_utc,
        "actor": "api",
    }
    receipt = {
        "receipt_id": str(uuid4()),
        "issued_at_utc": issued_at_utc,
        "actor": "api",
        "policy_version": get_settings().api_version,
        "manifest_hash": sha256_hex(canonical_json(payload)),
    }
    receipt["proof_signature"] = proof_payload_signature(payload)
    return receipt


def _apply_withdraw_consent(conn, user_id: UUID) -> None:
    active = conn.execute(sql.SQL_GET_ACTIVE_USER_CONSENT, {"user_id": user_id}).fetchone()
    if active is None:
        return

    conn.execute(
        sql.SQL_UPDATE_CONSENT_STATUS,
        {
            "consent_id": active["consent_id"],
            "status": "revoked",
            "actor_id": user_id,
            "replaced_by_consent_id": None,
        },
    )
    insert_consent_event(
        conn,
        consent_id=active["consent_id"],
        event_type="consent_withdraw",
        actor_type="user",
        actor_id=user_id,
        reason="user_requested",
        metadata={"source": "sync_v1_batch"},
    )


def _run_account_purge(conn, user_id: UUID) -> DeleteSummary:
    symptom_logs_deleted, diet_logs_deleted = tracking_store.hard_delete_tracking_data(conn, user_id, scope="all")
    consent_count = conn.execute(sql.SQL_COUNT_CONSENT_RECORDS, {"user_id": user_id}).fetchone()["count"] or 0
    queue_count = conn.execute(sql.SQL_COUNT_QUEUE_ROWS, {"user_id": user_id}).fetchone()["count"] or 0
    export_count = conn.execute(sql.SQL_COUNT_EXPORT_JOBS, {"user_id": user_id}).fetchone()["count"] or 0

    conn.execute(sql.SQL_DELETE_QUEUE_ROWS, {"user_id": user_id})
    conn.execute(sql.SQL_DELETE_ENTITY_VERSIONS, {"user_id": user_id})
    conn.execute(sql.SQL_DELETE_DEVICE_KEYS, {"user_id": user_id})
    conn.execute(
        sql.SQL_INVALIDATE_EXPORT_JOBS,
        {
            "user_id": user_id,
            "error_code": "deleted_by_user_request",
            "error_detail": "Purge requested by sync",
        },
    )
    conn.execute(sql.SQL_DELETE_CONSENT_RECORDS, {"user_id": user_id})
    conn.execute(sql.SQL_DELETE_CONSENT_EVENTS, {"user_id": user_id})

    return DeleteSummary(
        consent_records_touched=int(consent_count),
        symptom_logs_deleted=int(symptom_logs_deleted),
        diet_logs_deleted=int(diet_logs_deleted),
        swap_history_deleted=0,
        queue_items_dropped=int(queue_count),
        exports_invalidated=int(export_count),
    )


def _mark_account_deleted(conn, user_id: UUID) -> None:
    insert_row = conn.execute(
        sql.SQL_INSERT_DELETE_JOB,
        {
            "user_id": user_id,
            "idempotency_key": str(uuid4()),
            "requested_by_actor_id": user_id,
            "scope": "all",
            "reason": "sync_delete_account",
            "status": "processing",
            "soft_delete_window_days": 0,
            "hard_delete": True,
            "summary": _jsonb(
                {
                    "symptom_logs_deleted": 0,
                    "diet_logs_deleted": 0,
                    "swap_history_deleted": 0,
                    "queue_items_dropped": 0,
                    "consent_records_touched": 0,
                    "exports_invalidated": 0,
                }
            ),
        },
    ).fetchone()
    if insert_row is None:
        raise bad_request("Could not create delete job")

    delete_request_id = insert_row["delete_request_id"]
    summary = _run_account_purge(conn, user_id)
    conn.execute(
        sql.SQL_UPDATE_DELETE_JOB,
        {
            "delete_request_id": delete_request_id,
            "status": "completed",
            "summary": _jsonb(summary.model_dump()),
            "proof": _jsonb(_build_delete_receipt(delete_request_id, user_id, summary)),
            "error_code": None,
            "error_detail": None,
        },
    )
