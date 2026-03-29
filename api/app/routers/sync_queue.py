"""Queue and entity-version persistence for sync mutations.

Handles queue-item insertion, idempotency lookups, chain-hash retrieval,
entity version reads/writes, and batch-sequence allocation.

No result-building, conflict mapping, or dispatch logic — kept focused
on the persistence layer only.
"""

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from psycopg.types.json import Jsonb

from app import sql
from app.errors import bad_request
from app.models import (
    SyncV1MutationBatchRequest,
    SyncV1MutationItem,
    SyncV1MutationResultState,
)

SYNC_QUEUE_TTL_SECONDS = 14 * 24 * 60 * 60


def _jsonb(value: Any) -> Any:
    return Jsonb(value) if value is not None else None


def _ensure_sync_schema(conn) -> None:
    conn.execute(sql.SQL_CREATE_SYNC_BATCH_SEQUENCE)


def _next_batch_seq(conn) -> int:
    row = conn.execute(sql.SQL_NEXT_SYNC_BATCH_SEQ).fetchone()
    if row is None:
        raise bad_request("Failed to allocate batch sequence")
    return int(row["next_seq"])


def _last_queue_chain_hash(conn, user_id: UUID, device_id: str) -> Optional[str]:
    row = sql.fetch_one(
        conn,
        sql.SQL_GET_LAST_QUEUE_HASH_FOR_DEVICE,
        {
            "user_id": user_id,
            "device_id": device_id,
        },
    )
    if row is None:
        return None
    return row["chain_item_hash"]


def _queue_status(state: SyncV1MutationResultState) -> str:
    if state == "APPLIED":
        return "accepted"
    if state == "DUPLICATE":
        return "duplicate"
    if state in {"CONFLICT", "RETRY_WAIT"}:
        return "conflict"
    return "rejected"


def _insert_queue(
    conn,
    payload: SyncV1MutationBatchRequest,
    mutation: SyncV1MutationItem,
    user_id: UUID,
    entity_type: str,
    entity_id: str,
    signature_hash: str,
    signature_key_id: Optional[str],
    state: SyncV1MutationResultState,
    signature_valid: bool,
    error_code: Optional[str],
    error_detail: Optional[str],
    chain_prev_hash: Optional[str],
    chain_item_hash: Optional[str],
) -> None:
    if state == "DUPLICATE":
        return

    aad = {
        "platform": mutation.source.platform if mutation.source else None,
        "screen": mutation.source.screen if mutation.source else None,
        "actor": mutation.source.actor if mutation.source else None,
        "app_build": mutation.source.app_build if mutation.source else None,
        "sync_session_id": payload.sync_session_id,
        "migration_mode": payload.migration_mode,
        "signature_kid": signature_key_id,
        "signature_valid": signature_valid,
    }
    aad = {k: v for k, v in aad.items() if v is not None}

    conn.execute(
        sql.SQL_INSERT_QUEUE,
        {
            "idempotency_key": mutation.idempotency_key,
            "queue_item_id": UUID(mutation.mutation_id),
            "user_id": user_id,
            "device_id": payload.client_device_id,
            "app_install_id": payload.client_device_id,
            "op": mutation.operation_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "client_seq": mutation.client_seq,
            "base_version": mutation.base_version,
            "payload_hash": signature_hash,
            "aad": _jsonb(aad),
            "envelope_json": _jsonb(mutation.model_dump(mode="json")),
            "signature_algorithm": mutation.integrity.signature_algo if mutation.integrity else "hmac-sha256",
            "signature_kid": signature_key_id or "legacy",
            "signature": mutation.integrity.signature if mutation.integrity else "",
            "chain_prev_hash": chain_prev_hash,
            "chain_item_hash": chain_item_hash,
            "status": _queue_status(state),
            "error_code": error_code,
            "error_detail": error_detail,
            "ttl_seconds": SYNC_QUEUE_TTL_SECONDS,
        },
    )


def _get_entity_version(conn, user_id: UUID, entity_type: str, entity_id: str) -> int:
    row = conn.execute(
        sql.SQL_GET_ENTITY_VERSION,
        {
            "user_id": user_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
        },
    ).fetchone()
    if row is None or row["current_version"] is None:
        return 0
    return int(row["current_version"])


def _set_entity_version(conn, user_id: UUID, entity_type: str, entity_id: str, next_version: int) -> None:
    conn.execute(
        sql.SQL_UPSERT_ENTITY_VERSION,
        {
            "user_id": user_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "current_version": next_version,
        },
    )
