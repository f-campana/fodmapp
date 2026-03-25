from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Header, Request, Security
from psycopg.types.json import Jsonb

from app import sql
from app.auth import require_api_user_id
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
