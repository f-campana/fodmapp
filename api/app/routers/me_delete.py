"""Delete route family for the /v0/me/delete endpoints.

Split from me.py to isolate the delete request lifecycle (create + poll)
and supporting helpers (hard-delete execution, receipt building, receipt
verification, outcome persistence).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Request, Security

from app import sql, tracking_store
from app.auth import require_api_user_id
from app.config import get_settings
from app.consent_chain import proof_payload_signature
from app.crypto_utils import canonical_json, sha256_hex
from app.errors import bad_request, conflict, not_found
from app.models import (
    DeleteAcceptedResponse,
    DeletePollResponse,
    DeleteRequest,
    DeleteSummary,
    Receipt,
)
from app.routers.me import (
    EXPORT_CONFIRM_TEXT,
    _assert_security_tables,
    _count_rows,
    _get_db,
    _jsonb,
    _now,
    _proof_to_receipt,
    _verify_consent_chain,
)

router = APIRouter(prefix="/v0", tags=["account"])
logger = logging.getLogger(__name__)


def _execute_hard_delete(conn, user_id: UUID, scope: str = "all") -> DeleteSummary:
    symptom_logs_deleted, diet_logs_deleted = tracking_store.hard_delete_tracking_data(conn, user_id, scope=scope)

    consent_count = 0
    queue_count = 0
    export_count = 0

    if scope == "all":
        consent_count = _count_rows(conn, sql.SQL_COUNT_CONSENT_RECORDS, user_id)
        queue_count = _count_rows(conn, sql.SQL_COUNT_QUEUE_ROWS, user_id)
        export_count = _count_rows(conn, sql.SQL_COUNT_EXPORT_JOBS, user_id)

        conn.execute(
            sql.SQL_DELETE_QUEUE_ROWS,
            {"user_id": user_id},
        )
        conn.execute(
            sql.SQL_DELETE_ENTITY_VERSIONS,
            {"user_id": user_id},
        )
        conn.execute(
            sql.SQL_DELETE_DEVICE_KEYS,
            {"user_id": user_id},
        )
        conn.execute(
            sql.SQL_INVALIDATE_EXPORT_JOBS,
            {
                "user_id": user_id,
                "error_code": "deleted_by_user_request",
                "error_detail": "Purge requested by user",
            },
        )
        conn.execute(
            sql.SQL_DELETE_CONSENT_RECORDS,
            {"user_id": user_id},
        )
        conn.execute(
            sql.SQL_DELETE_CONSENT_EVENTS,
            {"user_id": user_id},
        )

    return DeleteSummary(
        consent_records_touched=consent_count,
        symptom_logs_deleted=symptom_logs_deleted,
        diet_logs_deleted=diet_logs_deleted,
        swap_history_deleted=0,
        queue_items_dropped=queue_count,
        exports_invalidated=export_count,
    )


def _build_delete_accepted(
    delete_request_id: UUID,
    status: str,
    requested_at,
    scope: str,
    idempotency_key: Optional[str],
    proof_uri: Optional[str],
) -> DeleteAcceptedResponse:
    """Build a DeleteAcceptedResponse with deterministic URIs."""
    return DeleteAcceptedResponse(
        delete_request_id=delete_request_id,
        status=status,
        requested_at_utc=requested_at,
        scope=scope,
        idempotency_key=idempotency_key,
        local_effective_ttl_seconds=60,
        server_effective_at_utc=requested_at,
        proof_uri=proof_uri,
        status_uri=f"/v0/me/delete/{delete_request_id}",
    )


_EMPTY_DELETE_SUMMARY: Dict[str, int] = {
    "consent_records_touched": 0,
    "symptom_logs_deleted": 0,
    "diet_logs_deleted": 0,
    "swap_history_deleted": 0,
    "queue_items_dropped": 0,
    "exports_invalidated": 0,
}


def _persist_delete_outcome(
    conn,
    delete_request_id: UUID,
    *,
    status: str,
    summary_dict: Dict[str, Any],
    proof: Optional[Dict[str, Any]],
    error_code: Optional[str] = None,
    error_detail: Optional[str] = None,
) -> None:
    """Update the delete job row with the final outcome."""
    conn.execute(
        sql.SQL_UPDATE_DELETE_JOB,
        {
            "delete_request_id": delete_request_id,
            "status": status,
            "summary": _jsonb(summary_dict),
            "proof": _jsonb(proof),
            "error_code": error_code,
            "error_detail": error_detail,
        },
    )


def _build_delete_receipt(delete_request_id: UUID, user_id: UUID, summary: DeleteSummary) -> Dict[str, Any]:
    issued_at_utc = _now().isoformat().replace("+00:00", "Z")
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


def _verify_delete_receipt(delete_request_id: UUID, user_id: UUID, row: Dict[str, Any], summary: DeleteSummary) -> None:
    proof = row["proof"]
    if proof is None:
        return

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
        "issued_at_utc": proof.get("issued_at_utc"),
        "actor": proof.get("actor"),
    }
    expected_signature = proof_payload_signature(payload)
    if (
        proof.get("manifest_hash") != sha256_hex(canonical_json(payload))
        or proof.get("proof_signature") != expected_signature
    ):
        raise conflict("Invalid delete proof")


@router.post("/me/delete", response_model=DeleteAcceptedResponse, status_code=202)
def request_delete(
    request: Request,
    payload: DeleteRequest,
    user_id: UUID = Security(require_api_user_id),
) -> DeleteAcceptedResponse:
    if payload.scope == "all" and payload.confirm_text.strip() != EXPORT_CONFIRM_TEXT:
        raise bad_request("Invalid confirm_text for scope=all")

    db = _get_db(request)
    idempotency_key = payload.idempotency_key or str(uuid4())

    with db.connection() as conn:
        _assert_security_tables(conn)
        _verify_consent_chain(conn, user_id)

        existing = sql.fetch_one(
            conn,
            sql.SQL_GET_DELETE_JOB_BY_IDEMPOTENCY,
            {"user_id": user_id, "idempotency_key": idempotency_key},
        )
        if existing is not None:
            proof_uri = (
                f"/v0/me/delete/{existing['delete_request_id']}"
                if existing["status"] in {"completed", "partial"}
                else None
            )
            return _build_delete_accepted(
                delete_request_id=existing["delete_request_id"],
                status=existing["status"],
                requested_at=existing["requested_at"],
                scope=existing["scope"],
                idempotency_key=idempotency_key,
                proof_uri=proof_uri,
            )

        insert_row = conn.execute(
            sql.SQL_INSERT_DELETE_JOB,
            {
                "user_id": user_id,
                "idempotency_key": idempotency_key,
                "requested_by_actor_id": user_id,
                "scope": payload.scope,
                "reason": payload.reason,
                "status": "processing",
                "soft_delete_window_days": payload.soft_delete_window_days,
                "hard_delete": payload.hard_delete,
                "summary": _jsonb(_EMPTY_DELETE_SUMMARY),
            },
        ).fetchone()
        if insert_row is None:
            raise bad_request("Delete request persistence failed")

        delete_request_id = insert_row["delete_request_id"]
        requested_at = _now()
        status = "processing"

        if payload.hard_delete:
            try:
                with conn.transaction():
                    summary = _execute_hard_delete(
                        conn,
                        user_id=user_id,
                        scope=payload.scope,
                    )
                    status = "completed"
                summary_dict = summary.model_dump()
                _persist_delete_outcome(
                    conn,
                    delete_request_id,
                    status=status,
                    summary_dict=summary_dict,
                    proof=_build_delete_receipt(delete_request_id, user_id, summary),
                )
            except Exception as exc:
                status = "failed"
                _persist_delete_outcome(
                    conn,
                    delete_request_id,
                    status=status,
                    summary_dict=dict(_EMPTY_DELETE_SUMMARY),
                    proof=None,
                    error_code="delete_processing_failed",
                    error_detail=str(exc)[:4000],
                )

        else:
            status = "partial"
            empty_summary = DeleteSummary(**_EMPTY_DELETE_SUMMARY)
            _persist_delete_outcome(
                conn,
                delete_request_id,
                status=status,
                summary_dict=dict(_EMPTY_DELETE_SUMMARY),
                proof=_build_delete_receipt(delete_request_id, user_id, empty_summary),
            )

        return _build_delete_accepted(
            delete_request_id=delete_request_id,
            status=status,
            requested_at=requested_at,
            scope=payload.scope,
            idempotency_key=idempotency_key,
            proof_uri=f"/v0/me/delete/{delete_request_id}" if status != "processing" else None,
        )


@router.get("/me/delete/{delete_request_id}", response_model=DeletePollResponse)
def get_delete_status(
    request: Request,
    delete_request_id: UUID,
    user_id: UUID = Security(require_api_user_id),
) -> DeletePollResponse:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        row = sql.fetch_one(conn, sql.SQL_GET_DELETE_JOB, {"user_id": user_id, "delete_request_id": delete_request_id})

    if row is None:
        raise not_found("Delete request not found")

    summary = DeleteSummary(**(row["summary"] or {}))
    proof: Optional[Receipt] = None
    if row["proof"] is not None:
        _verify_delete_receipt(delete_request_id, user_id, row, summary)
        proof = _proof_to_receipt(row["proof"])

    return DeletePollResponse(
        delete_request_id=delete_request_id,
        idempotency_key=row["idempotency_key"],
        status=row["status"],
        completed_at_utc=row["requested_at"] if row["status"] in {"completed", "partial", "failed"} else None,
        summary=summary,
        proof=proof,
        failure=({"code": row["error_code"], "message": row["error_detail"]} if row["error_code"] else None),
        retained_artifacts=[],
    )
