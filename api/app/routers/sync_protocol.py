"""Sync request protocol helpers: normalization, signing, and sorting.

Handles mutation-ID coercion, idempotency-key derivation, signature
verification, chain-hash computation, item sorting, and sync alerting.

No queue, result-building, or entity dispatch logic — kept focused on
request validation and protocol compliance only.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from app import sql
from app.crypto_utils import canonical_json, hmac_verify, sha256_hex
from app.models import SyncV1MutationItem

logger = logging.getLogger(__name__)


def _coerce_mutation_id(raw: Optional[str]) -> str:
    if not raw:
        return str(uuid4())
    return str(UUID(raw))


def _coerce_idempotency_key(raw: Optional[str], migration_mode: bool, fallback_suffix: str) -> str:
    if raw:
        return raw
    if migration_mode:
        return f"legacy:{fallback_suffix}"
    raise ValueError("idempotency_key is required")


def _signature_payload(mutation: SyncV1MutationItem) -> Dict[str, Any]:
    return {
        "mutation_id": mutation.mutation_id,
        "idempotency_key": mutation.idempotency_key,
        "operation_type": mutation.operation_type,
        "entity_type": mutation.entity_type,
        "entity_id": mutation.entity_id,
        "base_version": mutation.base_version,
        "client_seq": mutation.client_seq,
        "client_created_at": mutation.client_created_at.isoformat(),
        "payload": mutation.payload,
        "source": mutation.source.model_dump() if mutation.source else None,
        "depends_on_mutation_id": mutation.depends_on_mutation_id,
    }


def _compute_chain_hash(payload_hash: str, prev_hash: Optional[str]) -> str:
    return sha256_hex(
        canonical_json(
            {
                "payload_hash": payload_hash,
                "chain_prev_hash": prev_hash or "",
            }
        )
    )


def _normalize_mutation(item: SyncV1MutationItem, migration_mode: bool) -> SyncV1MutationItem:
    if migration_mode and item.operation_legacy is None and item.operation_type is None:
        raise ValueError("operation_legacy required in migration mode")
    if migration_mode and item.mutation_id_legacy is None and item.mutation_id is None:
        raise ValueError("mutation_id_legacy required in migration mode")

    op = item.operation_type or item.operation_legacy
    if op is None:
        raise ValueError("operation_type is required")

    mutation_id = _coerce_mutation_id(item.mutation_id or item.mutation_id_legacy)
    idempotency_key = _coerce_idempotency_key(
        item.idempotency_key,
        migration_mode,
        mutation_id,
    )

    return item.model_copy(
        update={
            "mutation_id": mutation_id,
            "operation_type": op,
            "idempotency_key": idempotency_key,
        },
    )


def _is_legacy_idempotency_key(idempotency_key: str) -> bool:
    return idempotency_key.startswith("legacy:")


def _sort_items(items: list[SyncV1MutationItem]) -> list[SyncV1MutationItem]:
    return sorted(
        items,
        key=lambda item: (
            item.client_seq,
            item.client_created_at,
            item.mutation_id or "",
            item.idempotency_key or "",
        ),
    )


def _emit_sync_alert(level: str, payload: Dict[str, Any]) -> None:
    logger.warning("sync-gate event=%s payload=%s", level, json.dumps(payload, sort_keys=True))


def _get_active_device_secret(conn, user_id: UUID, device_id: str) -> Optional[tuple[str, str]]:
    row = conn.execute(
        sql.SQL_GET_ACTIVE_DEVICE_KEYS,
        {"user_id": user_id, "device_id": device_id},
    ).fetchone()
    if row is None:
        return None
    return row["key_id"], row["secret_b64"]


def _verify_signature(
    conn,
    payload,
    user_id: UUID,
    mutation: SyncV1MutationItem,
    migration_mode: bool,
) -> tuple[bool, str, Optional[str]]:
    canonical = canonical_json(_signature_payload(mutation))
    payload_hash = sha256_hex(canonical)

    if migration_mode:
        return False, payload_hash, None

    integrity = mutation.integrity
    if integrity is None:
        raise ValueError("integrity required")
    if integrity.signature_algo != "hmac-sha256":
        raise ValueError("unsupported signature algorithm")
    if integrity.payload_hash != payload_hash:
        raise ValueError("payload_hash mismatch")

    key = _get_active_device_secret(conn, user_id, payload.client_device_id)
    if key is None:
        raise ValueError("signing key not found")
    key_id, secret_b64 = key

    if not hmac_verify(secret_b64, canonical, integrity.signature):
        raise ValueError("invalid signature")

    return True, payload_hash, key_id
