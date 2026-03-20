from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Header, Request, Response
from psycopg.types.json import Jsonb

from app import sql, tracking_store
from app.config import get_settings
from app.consent_chain import (
    ConsentChainInvalidError,
    proof_payload_signature,
    verify_user_consent_chain,
)
from app.consent_chain import (
    insert_event as insert_consent_event,
)
from app.crypto_utils import canonical_json, hmac_verify, sha256_hex
from app.db import Database
from app.errors import bad_request, conflict, locked, not_found, unauthorized
from app.models import (
    ConsentGetResponse,
    ConsentHistoryEntry,
    ConsentPostRequest,
    ConsentPostResponse,
    ConsentState,
    DeleteAcceptedResponse,
    DeletePollResponse,
    DeleteRequest,
    DeleteSummary,
    ExportAcceptedResponse,
    ExportPollResponse,
    ExportRequest,
    MutationEnvelope,
    MutationResult,
    Receipt,
    SyncMutationRequest,
    SyncMutationResponse,
)

router = APIRouter(prefix="/v0", tags=["me", "sync"])

EXPORT_CONFIRM_TEXT = "SUPPRIMER MES DONNÉES"
logger = logging.getLogger(__name__)


def _decorate_legacy_sync_headers(response: Response) -> None:
    response.headers.update(
        {
            "Deprecation": "true",
            "Warning": (
                '299 - "Compatibility-only endpoint: /v0/sync/mutations is deprecated; use /v0/sync/mutations:batch'
            ),
            "Link": '</v0/sync/mutations:batch>; rel="successor-version"; '
            'title="Batch mutations endpoint required for new clients"',
            "X-API-Compatibility-Mode": "legacy_migration_route",
        }
    )


def _get_db(request: Request) -> Database:
    return request.app.state.db


def _require_user_id(x_user_id: Optional[str]) -> UUID:
    if not x_user_id:
        raise bad_request("Missing X-User-Id header")
    try:
        return UUID(x_user_id)
    except ValueError as exc:
        raise bad_request("Invalid X-User-Id format") from exc


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _compute_mutation_chain_hash(payload_hash: str, chain_prev_hash: str | None) -> str:
    return sha256_hex(
        canonical_json(
            {
                "payload_hash": payload_hash,
                "chain_prev_hash": chain_prev_hash or "",
            }
        )
    )


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


def _normalize_include(include: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(item.strip() for item in include if item.strip()))
    allowed = {"consent", "profile", "symptoms", "diet_logs", "swap_history"}
    for item in normalized:
        if item not in allowed:
            raise bad_request(f"Invalid export include item: {item}")
    return normalized


def _validate_signature(secret_b64: str, env: MutationEnvelope) -> str:
    if env.signature_algorithm != "hmac-sha256":
        raise bad_request("Unsupported signature algorithm")

    payload_for_sig = env.model_dump(exclude={"signature"}, by_alias=True, mode="json")
    payload_for_sig = {key: value for key, value in payload_for_sig.items() if value is not None}
    signed_payload = canonical_json(payload_for_sig)
    if hmac_verify(secret_b64, signed_payload, env.signature):
        return sha256_hex(signed_payload)

    # Compatibility for clients that still sign UTC timestamps with "+00:00".
    legacy_payload = dict(payload_for_sig)
    created_at = legacy_payload.get("created_at_utc")
    if isinstance(created_at, str) and created_at.endswith("Z"):
        legacy_payload["created_at_utc"] = f"{created_at[:-1]}+00:00"
        legacy_signed_payload = canonical_json(legacy_payload)
        if hmac_verify(secret_b64, legacy_signed_payload, env.signature):
            return sha256_hex(legacy_signed_payload)

    raise unauthorized("Invalid mutation signature")


def _parse_iso_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    if value.endswith("Z"):
        return datetime.fromisoformat(f"{value[:-1]}+00:00")
    return datetime.fromisoformat(value)


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


@router.get("/me/consent", response_model=ConsentGetResponse)
def get_me_consent(
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
) -> ConsentGetResponse:
    user_id = _require_user_id(x_user_id)
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
    x_user_id: Optional[str] = Header(default=None),
    x_device_id: Optional[str] = Header(default=None),
    x_actor_id: Optional[str] = Header(default=None),
) -> ConsentPostResponse:
    user_id = _require_user_id(x_user_id)
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
    x_user_id: Optional[str] = Header(default=None),
) -> ExportAcceptedResponse:
    user_id = _require_user_id(x_user_id)
    db = _get_db(request)
    include = _normalize_include(payload.include)
    idempotency_key = payload.idempotency_key or str(uuid4())

    requested_scope = {
        "format": payload.format,
        "from_ts_utc": payload.from_ts_utc.isoformat() if payload.from_ts_utc else None,
        "to_ts_utc": payload.to_ts_utc.isoformat() if payload.to_ts_utc else None,
        "anonymize": payload.anonymize,
        "include": include,
    }

    manifest = {
        "requested_scope": requested_scope,
        "exported_at_utc": _now().isoformat(),
        "anonymize": payload.anonymize,
    }
    rows_by_domain = {
        "consent": 0,
        "profile": 0,
        "symptoms": 0,
        "diet_logs": 0,
        "swap_history": 0,
    }

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
            return ExportAcceptedResponse(
                export_id=existing["export_id"],
                status=existing["status"],
                requested_at_utc=existing["requested_at"],
                expiry_at_utc=existing["expires_at"],
                idempotency_key=idempotency_key,
                status_uri=f"/v0/me/export/{existing['export_id']}",
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

    return ExportAcceptedResponse(
        export_id=export_id,
        status="accepted",
        requested_at_utc=export_row["requested_at"],
        expiry_at_utc=export_row["expires_at"],
        idempotency_key=idempotency_key,
        status_uri=f"/v0/me/export/{export_id}",
    )


@router.get("/me/export/{export_id}", response_model=ExportPollResponse)
def get_export_status(
    request: Request,
    export_id: UUID,
    x_user_id: Optional[str] = Header(default=None),
) -> ExportPollResponse:
    user_id = _require_user_id(x_user_id)
    db = _get_db(request)

    with db.readonly_connection() as conn:
        row = sql.fetch_one(conn, sql.SQL_GET_EXPORT_JOB, {"user_id": user_id, "export_id": export_id})

    if row is None:
        raise not_found("Export request not found")

    proof_model = None
    if row["proof"] is not None:
        _verify_export_receipt(export_id, user_id, row)
        proof = row["proof"]
        proof_model = Receipt(
            receipt_id=UUID(str(proof["receipt_id"])) if isinstance(proof["receipt_id"], str) else proof["receipt_id"],
            issued_at_utc=_parse_iso_datetime(proof["issued_at_utc"]),
            actor=proof["actor"],
            policy_version=proof.get("policy_version"),
            manifest_hash=proof["manifest_hash"],
            proof_signature=proof.get("proof_signature"),
        )

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


@router.post("/me/delete", response_model=DeleteAcceptedResponse, status_code=202)
def request_delete(
    request: Request,
    payload: DeleteRequest,
    x_user_id: Optional[str] = Header(default=None),
) -> DeleteAcceptedResponse:
    user_id = _require_user_id(x_user_id)
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
            return DeleteAcceptedResponse(
                delete_request_id=existing["delete_request_id"],
                status=existing["status"],
                requested_at_utc=existing["requested_at"],
                scope=existing["scope"],
                idempotency_key=idempotency_key,
                local_effective_ttl_seconds=60,
                server_effective_at_utc=existing["requested_at"],
                proof_uri=proof_uri,
                status_uri=f"/v0/me/delete/{existing['delete_request_id']}",
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
                "summary": _jsonb(
                    {
                        "consent_records_touched": 0,
                        "symptom_logs_deleted": 0,
                        "diet_logs_deleted": 0,
                        "swap_history_deleted": 0,
                        "queue_items_dropped": 0,
                        "exports_invalidated": 0,
                    }
                ),
            },
        ).fetchone()
        if insert_row is None:
            raise bad_request("Delete request persistence failed")

        delete_request_id = insert_row["delete_request_id"]
        requested_at = _now()
        status = "processing"
        summary = {
            "consent_records_touched": 0,
            "symptom_logs_deleted": 0,
            "diet_logs_deleted": 0,
            "swap_history_deleted": 0,
            "queue_items_dropped": 0,
            "exports_invalidated": 0,
        }

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
                conn.execute(
                    sql.SQL_UPDATE_DELETE_JOB,
                    {
                        "delete_request_id": delete_request_id,
                        "status": status,
                        "summary": _jsonb(summary_dict),
                        "proof": _jsonb(_build_delete_receipt(delete_request_id, user_id, summary)),
                        "error_code": None,
                        "error_detail": None,
                    },
                )
            except Exception as exc:
                status = "failed"
                summary = {
                    "consent_records_touched": 0,
                    "symptom_logs_deleted": 0,
                    "diet_logs_deleted": 0,
                    "swap_history_deleted": 0,
                    "queue_items_dropped": 0,
                    "exports_invalidated": 0,
                }
                conn.execute(
                    sql.SQL_UPDATE_DELETE_JOB,
                    {
                        "delete_request_id": delete_request_id,
                        "status": status,
                        "summary": _jsonb(summary),
                        "proof": _jsonb(None),
                        "error_code": "delete_processing_failed",
                        "error_detail": str(exc)[:4000],
                    },
                )

        else:
            status = "partial"
            conn.execute(
                sql.SQL_UPDATE_DELETE_JOB,
                {
                    "delete_request_id": delete_request_id,
                    "status": status,
                    "summary": _jsonb(summary),
                    "proof": _jsonb(_build_delete_receipt(delete_request_id, user_id, DeleteSummary(**summary))),
                    "error_code": None,
                    "error_detail": None,
                },
            )

        return DeleteAcceptedResponse(
            delete_request_id=delete_request_id,
            status=status,
            requested_at_utc=requested_at,
            scope=payload.scope,
            idempotency_key=idempotency_key,
            local_effective_ttl_seconds=60,
            server_effective_at_utc=requested_at,
            proof_uri=f"/v0/me/delete/{delete_request_id}" if status != "processing" else None,
            status_uri=f"/v0/me/delete/{delete_request_id}",
        )


@router.get("/me/delete/{delete_request_id}", response_model=DeletePollResponse)
def get_delete_status(
    request: Request,
    delete_request_id: UUID,
    x_user_id: Optional[str] = Header(default=None),
) -> DeletePollResponse:
    user_id = _require_user_id(x_user_id)
    db = _get_db(request)

    with db.readonly_connection() as conn:
        row = sql.fetch_one(conn, sql.SQL_GET_DELETE_JOB, {"user_id": user_id, "delete_request_id": delete_request_id})

    if row is None:
        raise not_found("Delete request not found")

    summary = DeleteSummary(**(row["summary"] or {}))
    proof: Optional[Receipt] = None
    if row["proof"] is not None:
        _verify_delete_receipt(delete_request_id, user_id, row, summary)
        raw = row["proof"]
        proof = Receipt(
            receipt_id=UUID(str(raw["receipt_id"])),
            issued_at_utc=_parse_iso_datetime(raw["issued_at_utc"]),
            actor=raw["actor"],
            policy_version=raw.get("policy_version"),
            manifest_hash=raw["manifest_hash"],
            proof_signature=raw.get("proof_signature"),
        )

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


@router.post("/sync/mutations", response_model=SyncMutationResponse, deprecated=True)
def sync_mutations(
    request: Request,
    response: Response,
    payload: SyncMutationRequest,
    x_user_id: Optional[str] = Header(default=None),
    x_device_id: Optional[str] = Header(default=None),
) -> SyncMutationResponse:
    _decorate_legacy_sync_headers(response)

    user_id = _require_user_id(x_user_id)
    db = _get_db(request)

    if not payload.items:
        raise bad_request("No mutation items provided")

    if not x_device_id:
        raise bad_request("Missing X-Device-Id header")

    results: list[MutationResult] = []
    accepted = 0
    duplicates = 0

    with db.connection() as conn:
        _assert_security_tables(conn)
        _verify_consent_chain(conn, user_id)
        if _is_account_deleted(conn, user_id):
            raise locked("Sync mutations are locked after deletion request")
        _require_sync_consent(conn, user_id)

        for env in payload.items:
            now = _now()
            created_at = env.created_at_utc
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if env.ttl_seconds < 1 or env.ttl_seconds > 604800:
                results.append(
                    MutationResult(
                        queue_item_id=env.queue_item_id,
                        idempotency_key=env.idempotency_key,
                        status="rejected",
                        mutation_status="invalid_ttl",
                        error_code="invalid_request",
                    )
                )
                continue
            if created_at + timedelta(seconds=env.ttl_seconds) < now:
                results.append(
                    MutationResult(
                        queue_item_id=env.queue_item_id,
                        idempotency_key=env.idempotency_key,
                        status="rejected",
                        mutation_status="expired_ttl",
                        error_code="expired",
                    )
                )
                continue

            if not env.idempotency_key:
                results.append(
                    MutationResult(
                        queue_item_id=env.queue_item_id,
                        idempotency_key=env.idempotency_key,
                        status="rejected",
                        mutation_status="missing_idempotency",
                        error_code="invalid_request",
                    )
                )
                continue

            device_key_row = sql.fetch_one(
                conn,
                sql.SQL_GET_ACTIVE_DEVICE_KEY,
                {
                    "user_id": user_id,
                    "device_id": x_device_id,
                    "key_id": env.signature_kid,
                },
            )
            if device_key_row is None:
                results.append(
                    MutationResult(
                        queue_item_id=env.queue_item_id,
                        idempotency_key=env.idempotency_key,
                        status="rejected",
                        mutation_status="invalid_signature_key",
                        error_code="unauthorized",
                    )
                )
                continue

            try:
                payload_hash = _validate_signature(device_key_row["secret_b64"], env)
            except Exception:
                results.append(
                    MutationResult(
                        queue_item_id=env.queue_item_id,
                        idempotency_key=env.idempotency_key,
                        status="rejected",
                        mutation_status="signature_verification_failed",
                        error_code="unauthorized",
                    )
                )
                continue

            chain_prev_row = sql.fetch_one(
                conn,
                sql.SQL_GET_LAST_QUEUE_HASH_FOR_DEVICE,
                {
                    "user_id": user_id,
                    "device_id": x_device_id,
                },
            )
            chain_prev_hash = chain_prev_row["chain_item_hash"] if chain_prev_row else None
            chain_item_hash = _compute_mutation_chain_hash(payload_hash, chain_prev_hash)

            existing = sql.fetch_one(
                conn,
                sql.SQL_GET_QUEUE_BY_IDEMPOTENCY_ANY,
                {
                    "user_id": user_id,
                    "idempotency_key": env.idempotency_key,
                },
            )

            if existing is not None:
                if existing["payload_hash"] == payload_hash:
                    duplicates += 1
                    results.append(
                        MutationResult(
                            queue_item_id=env.queue_item_id,
                            idempotency_key=env.idempotency_key,
                            status="duplicate",
                            mutation_status="replayed",
                            error_code=None,
                        )
                    )
                else:
                    results.append(
                        MutationResult(
                            queue_item_id=env.queue_item_id,
                            idempotency_key=env.idempotency_key,
                            status="conflict",
                            mutation_status="payload_conflict",
                            error_code="replay_conflict",
                        )
                    )
                continue

            entity_id = env.entity_id or "__global__"
            version_row = sql.fetch_one(
                conn,
                sql.SQL_GET_ENTITY_VERSION,
                {
                    "user_id": user_id,
                    "entity_type": env.entity_type,
                    "entity_id": entity_id,
                },
            )
            current_version = (
                int(version_row["current_version"]) if version_row and version_row["current_version"] is not None else 0
            )

            if env.base_version is not None and env.base_version != current_version:
                results.append(
                    MutationResult(
                        queue_item_id=env.queue_item_id,
                        idempotency_key=env.idempotency_key,
                        status="conflict",
                        mutation_status="base_version_mismatch",
                        error_code="version_conflict",
                    )
                )
                continue

            conn.execute(
                sql.SQL_INSERT_QUEUE,
                {
                    "idempotency_key": env.idempotency_key,
                    "queue_item_id": env.queue_item_id,
                    "user_id": user_id,
                    "device_id": x_device_id,
                    "app_install_id": env.app_install_id,
                    "op": env.op,
                    "entity_type": env.entity_type,
                    "entity_id": entity_id,
                    "client_seq": env.client_seq,
                    "base_version": env.base_version,
                    "payload_hash": payload_hash,
                    "aad": _jsonb(env.aad),
                    "envelope_json": _jsonb(env.model_dump(mode="json")),
                    "signature_algorithm": env.signature_algorithm,
                    "signature_kid": env.signature_kid,
                    "signature": env.signature,
                    "chain_prev_hash": chain_prev_hash,
                    "chain_item_hash": chain_item_hash,
                    "status": "accepted",
                    "error_code": None,
                    "error_detail": None,
                    "ttl_seconds": env.ttl_seconds,
                },
            )

            next_version = current_version + 1
            if env.base_version is None:
                next_version = current_version

            conn.execute(
                sql.SQL_UPSERT_ENTITY_VERSION,
                {
                    "user_id": user_id,
                    "entity_type": env.entity_type,
                    "entity_id": entity_id,
                    "current_version": next_version,
                },
            )

            accepted += 1
            results.append(
                MutationResult(
                    queue_item_id=env.queue_item_id,
                    idempotency_key=env.idempotency_key,
                    status="accepted",
                    mutation_status="applied",
                    entity_version=next_version,
                    error_code=None,
                )
            )

    conflict_count = sum(1 for item in results if item.status == "conflict")
    logger.warning(
        "sync-legacy-compat summary=%s",
        json.dumps(
            {
                "user_id": str(user_id),
                "device_id": x_device_id,
                "processed_count": len(payload.items),
                "accepted_count": accepted,
                "duplicate_count": duplicates,
                "conflict_count": conflict_count,
            },
            sort_keys=True,
        ),
    )

    return SyncMutationResponse(
        processed=len(payload.items),
        accepted=accepted,
        duplicates=duplicates,
        results=results,
    )
