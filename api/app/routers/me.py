from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Header, Request, Security
from psycopg.types.json import Jsonb

from app import sql, tracking_store
from app.auth import require_api_user_id
from app.config import get_settings
from app.consent_chain import (
    ConsentChainInvalidError,
    proof_payload_signature,
    verify_user_consent_chain,
)
from app.consent_chain import (
    insert_event as insert_consent_event,
)
from app.crypto_utils import canonical_json, sha256_hex
from app.db import Database
from app.errors import bad_request, conflict, locked, not_found
from app.models import (
    ConsentGetResponse,
    ConsentHistoryEntry,
    ConsentPostRequest,
    ConsentPostResponse,
    ConsentState,
    ExportAcceptedResponse,
    ExportPollResponse,
    ExportRequest,
    Receipt,
)

router = APIRouter(prefix="/v0", tags=["account"])

EXPORT_CONFIRM_TEXT = "SUPPRIMER MES DONNÉES"
logger = logging.getLogger(__name__)


def _get_db(request: Request) -> Database:
    return request.app.state.db


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _jsonb(value: Any) -> Any:
    return Jsonb(value) if value is not None else None


def _verify_consent_chain(conn, user_id: UUID) -> None:
    try:
        verify_user_consent_chain(conn, user_id)
    except ConsentChainInvalidError as exc:
        raise conflict("Consent event chain invalid") from exc


def _is_account_deleted(conn, user_id: UUID) -> bool:
    row = sql.fetch_one(conn, sql.SQL_GET_ACCOUNT_DELETE_STATE, {"user_id": user_id})
    return row is not None and row["status"] in {"processing", "completed"}


def _assert_security_tables(conn) -> None:
    required = (
        "user_consent_ledger",
        "user_consent_ledger_events",
        "me_device_signing_keys",
        "me_mutation_queue",
        "me_entity_versions",
        "me_export_jobs",
        "me_delete_jobs",
    )
    missing = []
    for table in required:
        row = conn.execute("SELECT to_regclass(%s) AS name", (table,)).fetchone()
        if row is None or row["name"] is None:
            missing.append(table)
    if missing:
        raise bad_request(f"Missing security tables: {', '.join(missing)}")


def _fetch_active_sync_scope(conn, user_id: UUID) -> dict[str, bool]:
    row = sql.fetch_one(conn, sql.SQL_GET_SYNC_SCOPE, {"user_id": user_id})
    if row is None:
        return {}
    return row["consent_scope"] or {}


def _require_sync_consent(conn, user_id: UUID) -> None:
    scope = _fetch_active_sync_scope(conn, user_id)
    if not scope.get("sync_mutations", False):
        raise locked("Sync mutations disabled by consent")


def _fetch_consent_history(conn, user_id: UUID) -> list[ConsentHistoryEntry]:
    raw = sql.fetch_all(conn, sql.SQL_GET_CONSENT_HISTORY, {"user_id": user_id})
    return [
        ConsentHistoryEntry(
            event=row["event"],
            at_utc=row["at_utc"],
            policy_version=row.get("policy_version"),
            source=row.get("source"),
            reason=row.get("reason"),
        )
        for row in raw
    ]


def _add_consent_event(
    conn,
    *,
    consent_id: UUID,
    actor_type: str,
    actor_id: Optional[UUID],
    event_type: str,
    reason: Optional[str],
    metadata_json: Dict[str, Any],
) -> str:
    return insert_consent_event(
        conn,
        consent_id=consent_id,
        event_type=event_type,
        actor_type=actor_type,
        actor_id=actor_id,
        reason=reason,
        metadata=metadata_json,
    )


def _count_rows(conn, query: str, user_id: UUID) -> int:
    row = sql.fetch_one(conn, query, {"user_id": user_id})
    if row is None:
        return 0
    return int(row["count"] or 0)


def _normalize_include(include: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(item.strip() for item in include if item.strip()))
    allowed = {"consent", "profile", "symptoms", "diet_logs", "swap_history"}
    for item in normalized:
        if item not in allowed:
            raise bad_request(f"Invalid export include item: {item}")
    return normalized


def _parse_iso_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    if value.endswith("Z"):
        return datetime.fromisoformat(f"{value[:-1]}+00:00")
    return datetime.fromisoformat(value)


def _proof_to_receipt(raw: Dict[str, Any]) -> Receipt:
    """Convert a raw proof JSON dict from DB into a Receipt model."""
    return Receipt(
        receipt_id=UUID(str(raw["receipt_id"])),
        issued_at_utc=_parse_iso_datetime(raw["issued_at_utc"]),
        actor=raw["actor"],
        policy_version=raw.get("policy_version"),
        manifest_hash=raw["manifest_hash"],
        proof_signature=raw.get("proof_signature"),
    )


def _build_export_accepted(
    export_id: UUID,
    status: str,
    requested_at: datetime,
    expires_at: datetime,
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


@router.get("/me/consent", response_model=ConsentGetResponse)
def get_me_consent(
    request: Request,
    user_id: UUID = Security(require_api_user_id),
) -> ConsentGetResponse:
    db = _get_db(request)

    with db.readonly_connection() as conn:
        _verify_consent_chain(conn, user_id)
        row = sql.fetch_one(conn, sql.SQL_GET_USER_CONSENT_LATEST, {"user_id": user_id})
        if row is None:
            raise not_found("No consent record found")
        history = _fetch_consent_history(conn, user_id)

    return ConsentGetResponse(
        user_id=row["user_id"],
        consent_state=ConsentState(
            active=row["status"] == "active",
            consent_id=row["consent_id"],
            policy_version=row["policy_version"],
            legal_basis=row["legal_basis"],
            scope=row["consent_scope"],
            method=row["consent_method"],
            source=row["source"],
            granted_at_utc=row["granted_at_utc"],
            revoked_at_utc=row["revoked_at_utc"],
            revocation_reason=row["revocation_reason"],
            status=row["status"],
        ),
        history=history,
    )


@router.post("/me/consent", response_model=ConsentPostResponse)
def post_me_consent(
    request: Request,
    payload: ConsentPostRequest,
    user_id: UUID = Security(require_api_user_id),
    x_device_id: Optional[str] = Header(default=None),
    x_actor_id: Optional[str] = Header(default=None),
) -> ConsentPostResponse:
    actor_id = UUID(x_actor_id) if x_actor_id else None

    db = _get_db(request)
    action = payload.action

    with db.connection() as conn:
        _assert_security_tables(conn)
        _verify_consent_chain(conn, user_id)

        existing = sql.fetch_one(conn, sql.SQL_GET_ACTIVE_USER_CONSENT, {"user_id": user_id})

        if action == "revoke":
            if existing is None:
                raise not_found("No active consent to revoke")

            conn.execute(
                sql.SQL_UPDATE_CONSENT_STATUS,
                {
                    "consent_id": existing["consent_id"],
                    "status": "revoked",
                    "actor_id": actor_id,
                    "replaced_by_consent_id": None,
                },
            )
            conn.execute(
                """
                UPDATE user_consent_ledger
                SET revocation_reason = %(revocation_reason)s
                WHERE consent_id = %(consent_id)s
                """,
                {
                    "revocation_reason": payload.reason,
                    "consent_id": existing["consent_id"],
                },
            )
            _add_consent_event(
                conn,
                consent_id=existing["consent_id"],
                actor_type="user",
                actor_id=actor_id,
                event_type="consent_revoke",
                reason=payload.reason,
                metadata_json={
                    "policy_version": existing["policy_version"],
                    "method": existing["consent_method"],
                },
            )
            row = sql.fetch_one(conn, sql.SQL_GET_USER_CONSENT_LATEST, {"user_id": user_id})
            assert row is not None
            history = _fetch_consent_history(conn, user_id)
            return ConsentPostResponse(
                consent_id=row["consent_id"],
                status=row["status"],
                policy_version=row["policy_version"],
                legal_basis=row["legal_basis"],
                effective_at_utc=row["updated_at_utc"],
                previous_consent_id=existing["consent_id"],
                evidence_uri=row["evidence_uri"],
                evidence_hash=row["evidence_hash"],
                history=history,
            )

        if not payload.scope:
            raise bad_request("Consent scope is required")

        policy_fingerprint = sha256_hex(
            canonical_json(
                {
                    "policy_version": payload.policy_version,
                    "scope": payload.scope,
                    "language": payload.language,
                }
            )
        )
        scope_signature = payload.signature or proof_payload_signature(payload.scope)

        if existing is not None:
            conn.execute(
                sql.SQL_UPDATE_CONSENT_STATUS,
                {
                    "consent_id": existing["consent_id"],
                    "status": "superseded",
                    "actor_id": actor_id,
                    "replaced_by_consent_id": None,
                },
            )

        consent_id = conn.execute(
            sql.SQL_INSERT_USER_CONSENT,
            {
                "user_id": user_id,
                "device_subject_id": x_device_id,
                "tenant_scope": "fodmap_app",
                "policy_version": payload.policy_version,
                "legal_basis": payload.legal_basis,
                "consent_scope": _jsonb(payload.scope),
                "consent_method": payload.method,
                "source": payload.source,
                "source_ref": payload.source_ref,
                "granted_at_utc": _now(),
                "expires_at_utc": None,
                "policy_fingerprint": policy_fingerprint,
                "scope_signature": scope_signature,
                "evidence_uri": None,
                "evidence_hash": policy_fingerprint,
                "revocation_reason": None,
                "revocation_actor_id": None,
                "status": "active" if action == "grant" else "active",
                "parent_consent_id": existing["consent_id"] if existing else None,
                "actor_id": actor_id,
            },
        ).fetchone()["consent_id"]

        if existing is not None:
            conn.execute(
                sql.SQL_UPDATE_CONSENT_STATUS,
                {
                    "consent_id": existing["consent_id"],
                    "status": "superseded",
                    "actor_id": actor_id,
                    "replaced_by_consent_id": consent_id,
                },
            )
            _add_consent_event(
                conn,
                consent_id=existing["consent_id"],
                actor_type="system",
                actor_id=None,
                event_type="consent_superseded",
                reason="new consent recorded",
                metadata_json={"new_consent_id": str(consent_id)},
            )

        _add_consent_event(
            conn,
            consent_id=consent_id,
            actor_type="user",
            actor_id=actor_id,
            event_type=f"consent_{action}",
            reason=payload.reason,
            metadata_json={
                "policy_version": payload.policy_version,
                "scope": payload.scope,
                "method": payload.method,
            },
        )

        row = sql.fetch_one(conn, sql.SQL_GET_USER_CONSENT_LATEST, {"user_id": user_id})
        assert row is not None
        history = _fetch_consent_history(conn, user_id)

    return ConsentPostResponse(
        consent_id=row["consent_id"],
        status=row["status"],
        policy_version=row["policy_version"],
        legal_basis=row["legal_basis"],
        effective_at_utc=row["granted_at_utc"],
        previous_consent_id=existing["consent_id"] if existing else None,
        evidence_uri=row["evidence_uri"],
        evidence_hash=row["evidence_hash"],
        history=history,
    )


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
