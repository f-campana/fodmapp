"""Export route family for the /v0/me/export endpoints.

Split from me.py to isolate the export request lifecycle (create + poll)
and supporting helpers (manifest building, receipt building, receipt
verification, include normalization).
"""

from __future__ import annotations

import logging
from typing import Any, Dict
from uuid import UUID, uuid4

from fastapi import APIRouter, Request, Security

from app import sql, tracking_store
from app.auth import require_api_user_id
from app.config import get_settings
from app.consent_chain import proof_payload_signature
from app.crypto_utils import canonical_json, sha256_hex
from app.errors import bad_request, conflict, not_found
from app.models import (
    ExportAcceptedResponse,
    ExportPollResponse,
    ExportRequest,
)
from app.routers.me import (
    _assert_security_tables,
    _get_db,
    _jsonb,
    _now,
    _proof_to_receipt,
    _verify_consent_chain,
)

router = APIRouter(prefix="/v0", tags=["account"])
logger = logging.getLogger(__name__)


def _normalize_include(include: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(item.strip() for item in include if item.strip()))
    allowed = {"consent", "profile", "symptoms", "diet_logs", "swap_history"}
    for item in normalized:
        if item not in allowed:
            raise bad_request(f"Invalid export include item: {item}")
    return normalized


def _build_export_accepted(
    export_id: UUID,
    status: str,
    requested_at,
    expires_at,
    idempotency_key: str,
) -> ExportAcceptedResponse:
    """Build an ExportAcceptedResponse with a deterministic status_uri."""
    return ExportAcceptedResponse(
        export_id=export_id,
        status=status,
        requested_at_utc=requested_at,
        expiry_at_utc=expires_at,
        idempotency_key=idempotency_key,
        status_uri=f"/v0/me/export/{export_id}",
    )


def _prepare_export_manifest(
    payload: ExportRequest,
    include: list[str],
    exported_at_iso: str,
) -> tuple[Dict[str, Any], Dict[str, Any], Dict[str, int]]:
    """Build requested_scope, manifest, and initial rows_by_domain for an export.

    Returns (requested_scope, manifest, rows_by_domain) where rows_by_domain
    is initialised to zero for all domain keys. The caller fills actual counts
    from the DB.
    """
    requested_scope = {
        "format": payload.format,
        "from_ts_utc": payload.from_ts_utc.isoformat() if payload.from_ts_utc else None,
        "to_ts_utc": payload.to_ts_utc.isoformat() if payload.to_ts_utc else None,
        "anonymize": payload.anonymize,
        "include": include,
    }
    manifest = {
        "requested_scope": requested_scope,
        "exported_at_utc": exported_at_iso,
        "anonymize": payload.anonymize,
    }
    rows_by_domain: Dict[str, int] = {
        "consent": 0,
        "profile": 0,
        "symptoms": 0,
        "diet_logs": 0,
        "swap_history": 0,
    }
    return requested_scope, manifest, rows_by_domain


def _build_export_receipt(export_id: UUID, user_id: UUID, manifest: Dict[str, Any]) -> Dict[str, Any]:
    issued_at_utc = _now().isoformat().replace("+00:00", "Z")
    receipt = {
        "receipt_id": str(uuid4()),
        "issued_at_utc": issued_at_utc,
        "actor": "api",
        "policy_version": get_settings().api_version,
        "manifest_hash": sha256_hex(canonical_json(manifest)),
    }
    receipt["proof_signature"] = proof_payload_signature(
        {
            "scope": "export",
            "export_id": str(export_id),
            "user_id": str(user_id),
            "receipt_id": receipt["receipt_id"],
            "manifest_hash": receipt["manifest_hash"],
            "issued_at_utc": receipt["issued_at_utc"],
            "actor": receipt["actor"],
        }
    )
    return receipt


def _verify_export_receipt(export_id: UUID, user_id: UUID, row: Dict[str, Any]) -> None:
    proof = row["proof"]
    if proof is None:
        return

    manifest = row["manifest"] or {}
    expected_manifest_hash = sha256_hex(canonical_json(manifest))
    proof_payload = {
        "scope": "export",
        "export_id": str(export_id),
        "user_id": str(user_id),
        "receipt_id": str(proof.get("receipt_id")),
        "manifest_hash": expected_manifest_hash,
        "issued_at_utc": proof.get("issued_at_utc"),
        "actor": proof.get("actor"),
    }
    expected_signature = proof_payload_signature(proof_payload)
    if proof.get("manifest_hash") != expected_manifest_hash or proof.get("proof_signature") != expected_signature:
        raise conflict("Invalid export proof")


@router.post("/me/export", response_model=ExportAcceptedResponse, status_code=202)
def request_export(
    request: Request,
    payload: ExportRequest,
    user_id: UUID = Security(require_api_user_id),
) -> ExportAcceptedResponse:
    db = _get_db(request)
    include = _normalize_include(payload.include)
    idempotency_key = payload.idempotency_key or str(uuid4())
    requested_scope, manifest, rows_by_domain = _prepare_export_manifest(payload, include, _now().isoformat())

    with db.connection() as conn:
        _assert_security_tables(conn)
        _verify_consent_chain(conn, user_id)

        existing = sql.fetch_one(
            conn,
            sql.SQL_GET_EXPORT_JOB_BY_IDEMPOTENCY,
            {
                "user_id": user_id,
                "idempotency_key": idempotency_key,
            },
        )
        if existing is not None:
            return _build_export_accepted(
                export_id=existing["export_id"],
                status=existing["status"],
                requested_at=existing["requested_at"],
                expires_at=existing["expires_at"],
                idempotency_key=idempotency_key,
            )

        counts_row = sql.fetch_one(conn, sql.SQL_COUNT_CONSENT_RECORDS, {"user_id": user_id})
        rows_by_domain["consent"] = int(counts_row["count"] or 0) if counts_row else 0
        tracking_counts = tracking_store.count_tracking_rows_for_export(conn, user_id)
        rows_by_domain["symptoms"] = tracking_counts["symptoms"]
        rows_by_domain["diet_logs"] = tracking_counts["diet_logs"]
        manifest["rows_by_domain"] = rows_by_domain

        export_id = conn.execute(
            sql.SQL_INSERT_EXPORT_JOB,
            {
                "user_id": user_id,
                "idempotency_key": idempotency_key,
                "requested_by_actor_id": user_id,
                "status": "accepted",
                "requested_scope": _jsonb(requested_scope),
                "include_domain": include,
                "rows_by_domain": _jsonb(rows_by_domain),
                "redactions": ["email_last_4"] if payload.anonymize else [],
                "manifest": _jsonb(manifest),
                "proof": _jsonb(None),
                "download_url": None,
            },
        ).fetchone()

        if export_id is None:
            raise bad_request("Export persistence failed")

        export_id = export_id["export_id"]
        target_status = "ready_with_redactions" if payload.anonymize else "ready"
        proof = _build_export_receipt(export_id, user_id, manifest)
        conn.execute(
            sql.SQL_UPDATE_EXPORT_JOB,
            {
                "export_id": export_id,
                "status": target_status,
                "rows_by_domain": _jsonb(rows_by_domain),
                "manifest": _jsonb(manifest),
                "proof": _jsonb(proof),
                "download_url": None,
                "error_code": None,
                "error_detail": None,
            },
        )

        export_row = conn.execute(
            "SELECT requested_at, expires_at FROM me_export_jobs WHERE export_id = %(export_id)s",
            {"export_id": export_id},
        ).fetchone()
        if export_row is None:
            raise bad_request("Export job was not persisted")

    return _build_export_accepted(
        export_id=export_id,
        status="accepted",
        requested_at=export_row["requested_at"],
        expires_at=export_row["expires_at"],
        idempotency_key=idempotency_key,
    )


@router.get("/me/export/{export_id}", response_model=ExportPollResponse)
def get_export_status(
    request: Request,
    export_id: UUID,
    user_id: UUID = Security(require_api_user_id),
) -> ExportPollResponse:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        row = sql.fetch_one(conn, sql.SQL_GET_EXPORT_JOB, {"user_id": user_id, "export_id": export_id})

    if row is None:
        raise not_found("Export request not found")

    proof_model = None
    if row["proof"] is not None:
        _verify_export_receipt(export_id, user_id, row)
        proof_model = _proof_to_receipt(row["proof"])

    return ExportPollResponse(
        export_id=export_id,
        idempotency_key=row["idempotency_key"],
        status=row["status"],
        completed_at_utc=(
            row["requested_at"] if row["status"] in {"ready", "ready_with_redactions", "failed", "completed"} else None
        ),
        scope={
            "included_tables": row["include_domain"],
            "requested_scope": row["requested_scope"],
        },
        rows_by_domain=row["rows_by_domain"] or {},
        redactions=row["redactions"] or [],
        download_url=row["download_url"],
        manifest=row["manifest"] or {},
        proof=proof_model,
        failure={
            "code": row["error_code"],
            "message": row["error_detail"],
        }
        if row["error_code"]
        else None,
    )
