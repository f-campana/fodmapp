from __future__ import annotations

import os
from typing import Any, Dict, Optional
from uuid import UUID

from app import sql
from app.crypto_utils import canonical_json, hmac_signature


class ConsentChainInvalidError(ValueError):
    pass


def proof_secret() -> str:
    return os.getenv("ME_PROOF_SECRET", "YXBpLXByb29mLXNlY3JldA==")


def proof_payload_signature(payload: Dict[str, Any]) -> str:
    return hmac_signature(proof_secret(), canonical_json(payload))


def build_event_payload(
    *,
    consent_id: UUID | str,
    event_type: str,
    actor_type: str,
    actor_id: Optional[UUID | str],
    reason: Optional[str],
    metadata: Dict[str, Any],
    prev_hash: Optional[str],
) -> Dict[str, Any]:
    return {
        "consent_id": str(consent_id),
        "event_type": event_type,
        "actor_type": actor_type,
        "actor_id": str(actor_id) if actor_id is not None else None,
        "reason": reason,
        "metadata": metadata,
        "prev_hash": prev_hash,
    }


def compute_event_hash(payload: Dict[str, Any]) -> str:
    return proof_payload_signature(payload)


def fetch_last_event_hash(conn, consent_id: UUID) -> Optional[str]:
    prev = sql.fetch_one(conn, sql.SQL_GET_LAST_CONSENT_EVENT, {"consent_id": consent_id})
    return prev["event_hash"] if prev else None


def insert_event(
    conn,
    *,
    consent_id: UUID,
    event_type: str,
    actor_type: str,
    actor_id: Optional[UUID],
    reason: Optional[str],
    metadata: Dict[str, Any],
) -> str:
    prev_hash = fetch_last_event_hash(conn, consent_id)
    payload = build_event_payload(
        consent_id=consent_id,
        event_type=event_type,
        actor_type=actor_type,
        actor_id=actor_id,
        reason=reason,
        metadata=metadata,
        prev_hash=prev_hash,
    )
    event_hash = compute_event_hash(payload)
    conn.execute(
        sql.SQL_INSERT_CONSENT_EVENT,
        {
            "consent_id": consent_id,
            "event_type": event_type,
            "actor_type": actor_type,
            "actor_id": actor_id,
            "reason": reason,
            "metadata_json": metadata,
            "event_hash": event_hash,
            "prev_hash": prev_hash,
        },
    )
    return event_hash


def verify_user_consent_chain(conn, user_id: UUID) -> None:
    rows = sql.fetch_all(conn, sql.SQL_GET_USER_CONSENT_EVENTS, {"user_id": user_id})
    if not rows:
        return

    expected_prev_by_consent: Dict[str, Optional[str]] = {}
    for row in rows:
        consent_id = str(row["consent_id"])
        expected_prev = expected_prev_by_consent.get(consent_id)
        payload = build_event_payload(
            consent_id=consent_id,
            event_type=row["event_type"],
            actor_type=row["actor_type"],
            actor_id=row["actor_id"],
            reason=row["reason"],
            metadata=row.get("metadata_json") or {},
            prev_hash=expected_prev,
        )
        event_hash = compute_event_hash(payload)
        if row.get("event_hash") != event_hash or row.get("prev_hash") != expected_prev:
            raise ConsentChainInvalidError("Consent event chain invalid")
        expected_prev_by_consent[consent_id] = row["event_hash"]
