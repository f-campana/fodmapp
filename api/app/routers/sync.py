from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
from uuid import UUID, uuid4

from fastapi import APIRouter, Header, Request, Response
from psycopg.types.json import Jsonb

from app import sql, tracking_store
from app.config import get_settings
from app.consent_chain import insert_event as insert_consent_event
from app.consent_chain import proof_payload_signature
from app.crypto_utils import canonical_json, hmac_verify, sha256_hex
from app.db import Database
from app.errors import ApiError, bad_request
from app.models import (
    CustomFoodCreateRequest,
    CustomFoodUpdateRequest,
    DeleteSummary,
    MealLogCreateRequest,
    MealLogUpdateRequest,
    SavedMealCreateRequest,
    SavedMealUpdateRequest,
    SymptomLogCreateRequest,
    SymptomLogUpdateRequest,
    SyncV1ConflictCode,
    SyncV1MutationBatchRequest,
    SyncV1MutationBatchResponse,
    SyncV1MutationConflict,
    SyncV1MutationItem,
    SyncV1MutationObservability,
    SyncV1MutationRecovery,
    SyncV1MutationResult,
    SyncV1MutationResultState,
)

router = APIRouter(prefix="/v0/sync", tags=["sync"])

SYNC_MIN_SAFETY_SCORE = 0.50
SYNC_QUEUE_TTL_SECONDS = 14 * 24 * 60 * 60
RETRY_DELAY_MS_VERSION_CONFLICT = 1_500
RETRY_DELAY_MS_ENDPOINT_UNKNOWN = 5_000
SEVERITY_ORDER = {"none": 0, "low": 1, "moderate": 2, "high": 3, "unknown": 4}
SYNC_MIGRATION_MODE_WARNING = "legacy_migration_route"
logger = logging.getLogger(__name__)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _now_ms() -> int:
    return int(_now_utc().timestamp() * 1000)


def _jsonb(value: Any) -> Any:
    return Jsonb(value) if value is not None else None


def _decorate_legacy_sync_headers(response: Response) -> None:
    response.headers.update(
        {
            "Deprecation": "true",
            "Warning": (
                '299 - "Compatibility-only endpoint: /v0/sync/mutations is deprecated; use /v0/sync/mutations:batch'
            ),
            "Link": '</v0/sync/mutations:batch>; rel="successor-version"; '
            'title="Batch mutations endpoint required for new clients"',
            "X-API-Compatibility-Mode": SYNC_MIGRATION_MODE_WARNING,
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


def _ensure_sync_schema(conn) -> None:
    conn.execute(sql.SQL_CREATE_SYNC_BATCH_SEQUENCE)


def _next_batch_seq(conn) -> int:
    row = conn.execute(sql.SQL_NEXT_SYNC_BATCH_SEQ).fetchone()
    if row is None:
        raise bad_request("Failed to allocate batch sequence")
    return int(row["next_seq"])


def _coerce_mutation_id(raw: Optional[str]) -> str:
    if not raw:
        return str(uuid4())
    return str(UUID(raw))


def _compute_chain_hash(payload_hash: str, prev_hash: Optional[str]) -> str:
    return sha256_hex(
        canonical_json(
            {
                "payload_hash": payload_hash,
                "chain_prev_hash": prev_hash or "",
            }
        )
    )


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


def _retry_attempt(mutation: SyncV1MutationItem) -> int:
    raw = (mutation.conflict_marker or {}).get("retry_attempt")
    try:
        return int(raw)
    except (TypeError, ValueError):
        return 0


def _build_observability(
    payload: SyncV1MutationBatchRequest,
    mutation: SyncV1MutationItem,
    received_at: datetime,
    processing_ms: int,
    signature_hash: str,
    signature_valid: bool,
    dedupe_hit: bool,
) -> SyncV1MutationObservability:
    return SyncV1MutationObservability(
        event_id=str(uuid4()),
        request_id=payload.batch_id,
        payload_hash=signature_hash,
        processing_ms=processing_ms,
        signature_valid=signature_valid,
        server_received_at_utc=received_at,
        dedupe_hit=dedupe_hit,
        retry_attempt=_retry_attempt(mutation),
    )


def _normalize_conflict_code(raw_code: Optional[str]) -> Optional[SyncV1ConflictCode]:
    if not raw_code:
        return None

    code = raw_code.strip().upper()
    if code in {
        "RULE_INACTIVE",
        "RULE_SCORE_BELOW_THRESHOLD",
        "ENDPOINT_UNKNOWN",
        "RANK2_BLOCKED",
        "VERSION_CONFLICT",
        "CONSENT_REVOKED",
        "ACCOUNT_DELETED",
    }:
        return code

    legacy_map = {
        "BASE_VERSION_MISMATCH": "VERSION_CONFLICT",
        "VERSION": "VERSION_CONFLICT",
    }
    return legacy_map[code] if code in legacy_map else None


def _build_result(
    payload: SyncV1MutationBatchRequest,
    mutation: SyncV1MutationItem,
    state: SyncV1MutationResultState,
    result_code: str,
    received_at: datetime,
    processing_ms: int,
    signature_hash: str,
    signature_valid: bool,
    applied_version: Optional[int],
    conflict: Optional[SyncV1MutationConflict],
    retry_after_ms: int,
    dedupe_hit: bool,
) -> SyncV1MutationResult:
    return SyncV1MutationResult(
        mutation_id=mutation.mutation_id,
        idempotency_key=mutation.idempotency_key,
        status=state,
        result_code=result_code,
        retry_after_ms=retry_after_ms,
        attempted=state
        in {
            "APPLIED",
            "CONFLICT",
            "RETRY_WAIT",
        },
        applied_version=applied_version,
        conflict=conflict,
        observability=_build_observability(
            payload,
            mutation,
            received_at,
            processing_ms,
            signature_hash,
            signature_valid,
            dedupe_hit,
        ),
        server_received_at_utc=received_at,
    )


def _build_replay_result(
    payload: SyncV1MutationBatchRequest,
    mutation: SyncV1MutationItem,
    row: Dict[str, Any],
    received_at: datetime,
    signature_hash: str,
    signature_valid: bool,
) -> SyncV1MutationResult:
    queue_status = str(row["status"])
    queue_error = row.get("error_code")

    if queue_status in {"accepted", "duplicate", "replayed"}:
        return _build_result(
            payload,
            mutation,
            "DUPLICATE",
            "DUPLICATE",
            received_at,
            0,
            signature_hash,
            signature_valid,
            None,
            None,
            0,
            True,
        )

    normalized = _normalize_conflict_code(queue_error)
    if queue_status in {"conflict", "rejected", "error"}:
        if normalized in {
            "RULE_INACTIVE",
            "RULE_SCORE_BELOW_THRESHOLD",
            "ENDPOINT_UNKNOWN",
            "RANK2_BLOCKED",
            "VERSION_CONFLICT",
            "CONSENT_REVOKED",
            "ACCOUNT_DELETED",
        }:
            state, retry_after_ms, conflict = _conflict_for_code(normalized)
            return _build_result(
                payload,
                mutation=mutation,
                state=state,
                result_code=normalized,
                received_at=received_at,
                processing_ms=0,
                signature_hash=signature_hash,
                signature_valid=signature_valid,
                applied_version=None,
                conflict=conflict,
                retry_after_ms=retry_after_ms,
                dedupe_hit=True,
            )

    return _build_result(
        payload,
        mutation=mutation,
        state="FAILED_PERMANENT",
        result_code="INVALID_PAYLOAD",
        received_at=received_at,
        processing_ms=0,
        signature_hash=signature_hash,
        signature_valid=signature_valid,
        applied_version=None,
        conflict=None,
        retry_after_ms=0,
        dedupe_hit=True,
    )


def _infer_entity(user_id: UUID, mutation: SyncV1MutationItem) -> Tuple[str, str]:
    payload = mutation.payload
    op = mutation.operation_type

    if mutation.entity_type:
        return mutation.entity_type, mutation.entity_id or "__global__"

    if op in {"SYMPTOM_CREATE", "SYMPTOM_UPDATE", "SYMPTOM_DELETE"}:
        return (
            "symptom_log",
            payload.get("symptom_log_id") or payload.get("symptom_id") or payload.get("id") or "__global__",
        )

    if op in {"MEAL_CREATE", "MEAL_UPDATE", "MEAL_DELETE"}:
        return "meal_log", payload.get("meal_log_id") or payload.get("id") or "__global__"

    if op in {"CUSTOM_FOOD_CREATE", "CUSTOM_FOOD_UPDATE", "CUSTOM_FOOD_DELETE"}:
        return "custom_food", payload.get("custom_food_id") or payload.get("id") or "__global__"

    if op in {"SAVED_MEAL_CREATE", "SAVED_MEAL_UPDATE", "SAVED_MEAL_DELETE"}:
        return "saved_meal", payload.get("saved_meal_id") or payload.get("id") or "__global__"

    if op in {"PREF_SET", "PREF_DELETE"}:
        return "preference", payload.get("preference_key") or payload.get("key") or "__global__"

    if op in {"SWAP_APPLY", "SWAP_REVERT"}:
        from_slug = payload.get("from_food_slug") or payload.get("from") or "__global__"
        to_slug = payload.get("to_food_slug") or payload.get("to") or "__global__"
        return "swap_history", f"{from_slug}:{to_slug}"

    if op == "WITHDRAW_CONSENT":
        return "consent", str(user_id)

    if op == "DELETE_ACCOUNT":
        return "account", str(user_id)

    return "global", "__global__"


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
    payload: SyncV1MutationBatchRequest,
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


def _get_consent_active(conn, user_id: UUID) -> bool:
    row = conn.execute(sql.SQL_GET_ACTIVE_USER_CONSENT, {"user_id": user_id}).fetchone()
    if row is None:
        return False
    scope = row.get("consent_scope") or {}
    return bool(scope.get("sync_mutations", False))


def _get_consent_scope(conn, user_id: UUID) -> dict[str, bool]:
    row = conn.execute(sql.SQL_GET_ACTIVE_USER_CONSENT, {"user_id": user_id}).fetchone()
    if row is None:
        return {}
    return row.get("consent_scope") or {}


def _is_account_deleted(conn, user_id: UUID) -> bool:
    row = conn.execute(sql.SQL_GET_ACCOUNT_DELETE_STATE, {"user_id": user_id}).fetchone()
    return row is not None


def _evaluate_swap_rule(
    conn,
    mutation: SyncV1MutationItem,
) -> tuple[Optional[dict[str, Any]], Optional[SyncV1ConflictCode]]:
    payload = mutation.payload
    from_slug = payload.get("from_food_slug") or payload.get("from")
    to_slug = payload.get("to_food_slug") or payload.get("to")

    if not from_slug or not to_slug:
        return None, "ENDPOINT_UNKNOWN"

    row = conn.execute(
        sql.SQL_GET_SWAP_RULE_FOR_MUTATION,
        {"from_food_slug": from_slug, "to_food_slug": to_slug},
    ).fetchone()
    if row is None:
        return None, "ENDPOINT_UNKNOWN"

    rule = dict(row)

    if rule["rule_status"] != "active":
        return rule, "RULE_INACTIVE"

    if rule["from_overall_level"] == "unknown" or rule["to_overall_level"] == "unknown":
        return rule, "ENDPOINT_UNKNOWN"

    if float(rule["fodmap_safety_score"]) < SYNC_MIN_SAFETY_SCORE:
        return rule, "RULE_SCORE_BELOW_THRESHOLD"

    if SEVERITY_ORDER.get(str(rule["to_overall_level"]), 4) > SEVERITY_ORDER.get(str(rule["from_overall_level"]), 4):
        return rule, "RULE_INACTIVE"

    from_burden = rule.get("from_burden_ratio")
    to_burden = rule.get("to_burden_ratio")
    if from_burden is not None and to_burden is not None and float(to_burden) > float(from_burden):
        return rule, "RULE_INACTIVE"

    if int(rule.get("from_priority_rank") or 0) == 2 or int(rule.get("to_priority_rank") or 0) == 2:
        return rule, "RANK2_BLOCKED"

    return rule, None


def _rule_float(rule: Optional[dict[str, Any]], key: str) -> Optional[float]:
    if rule is None or rule.get(key) is None:
        return None
    return float(rule[key])


def _rule_str(rule: Optional[dict[str, Any]], key: str) -> Optional[str]:
    if rule is None or rule.get(key) is None:
        return None
    return str(rule[key])


def _conflict_for_code(
    code: SyncV1ConflictCode,
    rule: Optional[dict[str, Any]] = None,
) -> tuple[SyncV1MutationResultState, int, SyncV1MutationConflict]:
    if code == "RULE_INACTIVE":
        return (
            "CONFLICT",
            0,
            SyncV1MutationConflict(
                code="RULE_INACTIVE",
                message_key="sync.conflict.rule_inactive",
                retryable=False,
                is_resolvable_client_side=True,
                recovery=SyncV1MutationRecovery(action="SHOW_REPLACEMENT"),
                from_food_slug=rule.get("from_food_slug") if rule else None,
                to_food_slug=rule.get("to_food_slug") if rule else None,
            ),
        )

    if code == "RULE_SCORE_BELOW_THRESHOLD":
        return (
            "CONFLICT",
            0,
            SyncV1MutationConflict(
                code="RULE_SCORE_BELOW_THRESHOLD",
                message_key="sync.conflict.rule_score_below_threshold",
                retryable=False,
                is_resolvable_client_side=False,
                recovery=SyncV1MutationRecovery(action="SHOW_REPLACEMENT"),
                fodmap_safety_score_snapshot=_rule_float(rule, "fodmap_safety_score"),
                scoring_version_snapshot=_rule_str(rule, "scoring_version"),
                from_food_slug=rule.get("from_food_slug") if rule else None,
                to_food_slug=rule.get("to_food_slug") if rule else None,
                to_overall_level=rule.get("to_overall_level") if rule else None,
                coverage_ratio=_rule_float(rule, "coverage_ratio"),
            ),
        )

    if code == "RANK2_BLOCKED":
        return (
            "CONFLICT",
            0,
            SyncV1MutationConflict(
                code="RANK2_BLOCKED",
                message_key="sync.conflict.rank2_blocked",
                retryable=False,
                is_resolvable_client_side=True,
                recovery=SyncV1MutationRecovery(action="KEEP_REMOTE"),
                from_food_slug=rule.get("from_food_slug") if rule else None,
                to_food_slug=rule.get("to_food_slug") if rule else None,
            ),
        )

    if code == "VERSION_CONFLICT":
        return (
            "RETRY_WAIT",
            RETRY_DELAY_MS_VERSION_CONFLICT,
            SyncV1MutationConflict(
                code="VERSION_CONFLICT",
                message_key="sync.conflict.version_conflict",
                retryable=True,
                is_resolvable_client_side=True,
                recovery=SyncV1MutationRecovery(action="MANUAL_RETRY"),
            ),
        )

    if code == "ENDPOINT_UNKNOWN":
        return (
            "RETRY_WAIT",
            RETRY_DELAY_MS_ENDPOINT_UNKNOWN,
            SyncV1MutationConflict(
                code="ENDPOINT_UNKNOWN",
                message_key="sync.conflict.endpoint_unknown",
                retryable=True,
                is_resolvable_client_side=True,
                recovery=SyncV1MutationRecovery(action="MANUAL_RETRY"),
            ),
        )

    if code == "CONSENT_REVOKED":
        return (
            "CANCELLED_BY_CONSENT",
            0,
            SyncV1MutationConflict(
                code="CONSENT_REVOKED",
                message_key="sync.conflict.consent_revoked",
                retryable=False,
                is_resolvable_client_side=True,
                recovery=SyncV1MutationRecovery(action="OPEN_SETTINGS"),
            ),
        )

    if code == "ACCOUNT_DELETED":
        return (
            "CANCELLED_BY_DELETE",
            0,
            SyncV1MutationConflict(
                code="ACCOUNT_DELETED",
                message_key="sync.conflict.account_deleted",
                retryable=False,
                is_resolvable_client_side=False,
                recovery=SyncV1MutationRecovery(action="NONE"),
            ),
        )

    return (
        "CONFLICT",
        0,
        SyncV1MutationConflict(
            code=code,
            message_key=f"sync.conflict.{code.lower()}",
            retryable=False,
            is_resolvable_client_side=True,
            recovery=SyncV1MutationRecovery(action="SHOW_REPLACEMENT"),
            fodmap_safety_score_snapshot=_rule_float(rule, "fodmap_safety_score"),
            scoring_version_snapshot=_rule_str(rule, "scoring_version"),
            from_food_slug=rule.get("from_food_slug") if rule else None,
            to_food_slug=rule.get("to_food_slug") if rule else None,
            to_overall_level=rule.get("to_overall_level") if rule else None,
            coverage_ratio=_rule_float(rule, "coverage_ratio"),
        ),
    )


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


def _coerce_symptom_payload(payload: Dict[str, Any], fallback_noted_at: datetime, *, partial: bool) -> Dict[str, Any]:
    symptom_value = payload.get("symptom_type") or payload.get("symptom")
    allowed = {
        "bloating",
        "pain",
        "gas",
        "diarrhea",
        "constipation",
        "nausea",
        "reflux",
        "other",
    }
    symptom_type = symptom_value if symptom_value in allowed else ("other" if symptom_value else None)
    note_parts = []
    if symptom_type == "other" and symptom_value and symptom_value != "other":
        note_parts.append(str(symptom_value))
    if payload.get("note"):
        note_parts.append(str(payload["note"]))

    normalized: Dict[str, Any] = {}
    if symptom_type is not None:
        normalized["symptom_type"] = symptom_type
    elif not partial:
        normalized["symptom_type"] = "other"

    if "severity" in payload:
        normalized["severity"] = int(payload.get("severity") or 0)
    elif not partial:
        normalized["severity"] = 0

    if "noted_at_utc" in payload:
        normalized["noted_at_utc"] = payload["noted_at_utc"]
    elif not partial:
        normalized["noted_at_utc"] = fallback_noted_at

    if note_parts:
        normalized["note"] = " — ".join(note_parts)
    elif "note" in payload:
        normalized["note"] = payload.get("note")

    return normalized


def _apply_tracking_mutation(
    conn,
    user_id: UUID,
    mutation: SyncV1MutationItem,
    entity_type: str,
    entity_id: str,
    next_version: int,
) -> None:
    op = mutation.operation_type
    if op is None:
        raise ValueError("operation_type is required")

    if entity_id == "__global__":
        raise ValueError("entity_id is required")

    entity_uuid = UUID(entity_id)

    if op == "SYMPTOM_CREATE":
        tracking_store.create_symptom_log(
            conn,
            user_id,
            SymptomLogCreateRequest.model_validate(
                _coerce_symptom_payload(mutation.payload, mutation.client_created_at, partial=False)
            ),
            symptom_log_id=entity_uuid,
            version=next_version,
        )
        return

    if op == "SYMPTOM_UPDATE":
        tracking_store.update_symptom_log(
            conn,
            user_id,
            entity_uuid,
            SymptomLogUpdateRequest.model_validate(
                _coerce_symptom_payload(mutation.payload, mutation.client_created_at, partial=True)
            ),
            version=next_version,
        )
        return

    if op == "SYMPTOM_DELETE":
        tracking_store.delete_symptom_log(conn, user_id, entity_uuid, version=next_version)
        return

    if op == "MEAL_CREATE":
        tracking_store.create_meal_log(
            conn,
            user_id,
            MealLogCreateRequest.model_validate(mutation.payload),
            meal_log_id=entity_uuid,
            version=next_version,
        )
        return

    if op == "MEAL_UPDATE":
        tracking_store.update_meal_log(
            conn,
            user_id,
            entity_uuid,
            MealLogUpdateRequest.model_validate(mutation.payload),
            version=next_version,
        )
        return

    if op == "MEAL_DELETE":
        tracking_store.delete_meal_log(conn, user_id, entity_uuid, version=next_version)
        return

    if op == "CUSTOM_FOOD_CREATE":
        tracking_store.create_custom_food(
            conn,
            user_id,
            CustomFoodCreateRequest.model_validate(mutation.payload),
            custom_food_id=entity_uuid,
            version=next_version,
        )
        return

    if op == "CUSTOM_FOOD_UPDATE":
        tracking_store.update_custom_food(
            conn,
            user_id,
            entity_uuid,
            CustomFoodUpdateRequest.model_validate(mutation.payload),
            version=next_version,
        )
        return

    if op == "CUSTOM_FOOD_DELETE":
        tracking_store.delete_custom_food(conn, user_id, entity_uuid, version=next_version)
        return

    if op == "SAVED_MEAL_CREATE":
        tracking_store.create_saved_meal(
            conn,
            user_id,
            SavedMealCreateRequest.model_validate(mutation.payload),
            saved_meal_id=entity_uuid,
            version=next_version,
        )
        return

    if op == "SAVED_MEAL_UPDATE":
        tracking_store.update_saved_meal(
            conn,
            user_id,
            entity_uuid,
            SavedMealUpdateRequest.model_validate(mutation.payload),
            version=next_version,
        )
        return

    if op == "SAVED_MEAL_DELETE":
        tracking_store.delete_saved_meal(conn, user_id, entity_uuid, version=next_version)


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


def _emit_sync_alert(level: str, payload: Dict[str, Any]) -> None:
    logger.warning("sync-gate event=%s payload=%s", level, json.dumps(payload, sort_keys=True))


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


@router.post("/mutations:batch", response_model=SyncV1MutationBatchResponse)
def sync_mutations_batch(
    request: Request,
    payload: SyncV1MutationBatchRequest,
    x_user_id: Optional[str] = Header(default=None),
) -> SyncV1MutationBatchResponse:
    user_id = _require_user_id(x_user_id)
    if payload.user_id != str(user_id):
        raise bad_request("user_id mismatch")
    if payload.schema_version != 1:
        raise bad_request("schema_version must be 1")
    if not payload.items:
        raise bad_request("batch has no items")

    db = _get_db(request)
    received_at = _now_utc()
    legacy_mutation_count = 0

    with db.connection() as conn:
        _ensure_sync_schema(conn)
        server_batch_seq = _next_batch_seq(conn)

        consent_scope = _get_consent_scope(conn, user_id)
        consent_active = bool(consent_scope.get("sync_mutations", False))
        account_deleted = _is_account_deleted(conn, user_id)
        results: list[SyncV1MutationResult] = []
        applied_ids: set[str] = set()

        for mutation in _sort_items(payload.items):
            start_ms = _now_ms()

            try:
                normalized = _normalize_mutation(mutation, payload.migration_mode)
            except Exception:
                fallback_mutation = mutation.model_copy(
                    update={
                        "mutation_id": mutation.mutation_id or str(uuid4()),
                        "idempotency_key": mutation.idempotency_key or f"invalid:{uuid4()}",
                    }
                )
                results.append(
                    _build_result(
                        payload,
                        fallback_mutation,
                        "FAILED_PERMANENT",
                        "INVALID_PAYLOAD",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        "",
                        False,
                        None,
                        None,
                        0,
                        False,
                    )
                )
                continue

            if _is_legacy_idempotency_key(normalized.idempotency_key):
                legacy_mutation_count += 1

            entity_type, entity_id = _infer_entity(user_id, normalized)
            base_hash = sha256_hex(canonical_json(_signature_payload(normalized)))

            if account_deleted:
                chain_prev_hash = _last_queue_chain_hash(
                    conn,
                    user_id=user_id,
                    device_id=payload.client_device_id,
                )
                chain_item_hash = _compute_chain_hash(base_hash, chain_prev_hash)
                state, retry_after_ms, conflict = _conflict_for_code("ACCOUNT_DELETED")
                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    base_hash,
                    None,
                    state,
                    False,
                    "ACCOUNT_DELETED",
                    "delete_in_progress",
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        state,
                        "ACCOUNT_DELETED",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        base_hash,
                        False,
                        None,
                        conflict,
                        retry_after_ms,
                        False,
                    )
                )
                continue

            try:
                signature_valid, signature_hash, signature_key_id = _verify_signature(
                    conn,
                    payload,
                    user_id,
                    normalized,
                    payload.migration_mode,
                )
            except ValueError as exc:
                signature_hash = base_hash
                signature_key_id = None

                chain_prev_hash = _last_queue_chain_hash(
                    conn,
                    user_id=user_id,
                    device_id=payload.client_device_id,
                )
                chain_item_hash = _compute_chain_hash(signature_hash, chain_prev_hash)

                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    "FAILED_PERMANENT",
                    False,
                    "INVALID_PAYLOAD",
                    str(exc),
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        "FAILED_PERMANENT",
                        "INVALID_PAYLOAD",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        signature_hash,
                        False,
                        None,
                        None,
                        0,
                        False,
                    )
                )
                continue

            chain_prev_hash = _last_queue_chain_hash(
                conn,
                user_id=user_id,
                device_id=payload.client_device_id,
            )
            if normalized.integrity is not None and normalized.integrity.chain_prev_hash is not None:
                provided_prev = normalized.integrity.chain_prev_hash
                expected_prev = chain_prev_hash or ""
                if provided_prev != expected_prev:
                    chain_item_hash = _compute_chain_hash(signature_hash, chain_prev_hash)
                    _insert_queue(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        "FAILED_PERMANENT",
                        signature_valid,
                        "INVALID_PAYLOAD",
                        "chain_prev_hash_mismatch",
                        chain_prev_hash,
                        chain_item_hash,
                    )
                    results.append(
                        _build_result(
                            payload=payload,
                            mutation=normalized,
                            state="FAILED_PERMANENT",
                            result_code="INVALID_PAYLOAD",
                            received_at=received_at,
                            processing_ms=max(0, _now_ms() - start_ms),
                            signature_hash=signature_hash,
                            signature_valid=signature_valid,
                            applied_version=None,
                            conflict=None,
                            retry_after_ms=0,
                            dedupe_hit=False,
                        )
                    )
                    continue

            chain_item_hash = _compute_chain_hash(signature_hash, chain_prev_hash)

            existing_any = conn.execute(
                sql.SQL_GET_QUEUE_BY_IDEMPOTENCY_ANY,
                {
                    "user_id": user_id,
                    "idempotency_key": normalized.idempotency_key,
                },
            ).fetchone()
            if existing_any is not None and existing_any["replay_window_expires_at"] <= received_at:
                conn.execute(
                    sql.SQL_DELETE_QUEUE_BY_IDEMPOTENCY,
                    {"user_id": user_id, "idempotency_key": normalized.idempotency_key},
                )
                existing_any = None

            existing = conn.execute(
                sql.SQL_GET_QUEUE_BY_IDEMPOTENCY,
                {
                    "user_id": user_id,
                    "idempotency_key": normalized.idempotency_key,
                },
            ).fetchone()

            if existing is not None:
                if existing["payload_hash"] == signature_hash:
                    results.append(
                        _build_replay_result(
                            payload=payload,
                            mutation=normalized,
                            row=existing,
                            received_at=received_at,
                            signature_hash=signature_hash,
                            signature_valid=signature_valid,
                        )
                    )
                    continue

                results.append(
                    _build_result(
                        payload,
                        normalized,
                        "FAILED_PERMANENT",
                        "INVALID_PAYLOAD",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        signature_hash,
                        signature_valid,
                        None,
                        None,
                        0,
                        True,
                    )
                )
                continue

            op = normalized.operation_type

            if op == "WITHDRAW_CONSENT":
                if not consent_active:
                    state, retry_after_ms, conflict = _conflict_for_code("CONSENT_REVOKED")
                    _insert_queue(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        state,
                        signature_valid,
                        "CONSENT_REVOKED",
                        "already_revoked",
                        chain_prev_hash,
                        chain_item_hash,
                    )
                    results.append(
                        _build_result(
                            payload,
                            normalized,
                            state,
                            "CONSENT_REVOKED",
                            received_at,
                            max(0, _now_ms() - start_ms),
                            signature_hash,
                            signature_valid,
                            None,
                            conflict,
                            retry_after_ms,
                            False,
                        )
                    )
                    continue

                _apply_withdraw_consent(conn, user_id)
                consent_active = False
                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    "APPLIED",
                    signature_valid,
                    "OK",
                    None,
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        "APPLIED",
                        "OK",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        signature_hash,
                        signature_valid,
                        None,
                        None,
                        0,
                        False,
                    )
                )
                applied_ids.add(normalized.mutation_id)
                continue

            if op == "DELETE_ACCOUNT":
                if account_deleted:
                    state, retry_after_ms, conflict = _conflict_for_code("ACCOUNT_DELETED")
                    _insert_queue(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        state,
                        signature_valid,
                        "ACCOUNT_DELETED",
                        "already_deleted",
                        chain_prev_hash,
                        chain_item_hash,
                    )
                    results.append(
                        _build_result(
                            payload,
                            normalized,
                            state,
                            "ACCOUNT_DELETED",
                            received_at,
                            max(0, _now_ms() - start_ms),
                            signature_hash,
                            signature_valid,
                            None,
                            conflict,
                            retry_after_ms,
                            False,
                        )
                    )
                    continue

                _mark_account_deleted(conn, user_id)
                account_deleted = True
                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    "APPLIED",
                    signature_valid,
                    "OK",
                    None,
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        "APPLIED",
                        "OK",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        signature_hash,
                        signature_valid,
                        None,
                        None,
                        0,
                        False,
                    )
                )
                applied_ids.add(normalized.mutation_id)
                continue

            if not consent_active:
                state, retry_after_ms, conflict = _conflict_for_code("CONSENT_REVOKED")
                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    state,
                    signature_valid,
                    "CONSENT_REVOKED",
                    "consent_missing",
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        state,
                        "CONSENT_REVOKED",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        signature_hash,
                        signature_valid,
                        None,
                        conflict,
                        retry_after_ms,
                        False,
                    )
                )
                continue

            tracking_scope = tracking_store.tracking_scope_for_entity(entity_type)
            if tracking_scope is not None and not tracking_store.has_tracking_scope(consent_scope, tracking_scope):
                state, retry_after_ms, conflict = _conflict_for_code("CONSENT_REVOKED")
                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    state,
                    signature_valid,
                    "CONSENT_REVOKED",
                    f"{tracking_scope}_missing",
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        state,
                        "CONSENT_REVOKED",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        signature_hash,
                        signature_valid,
                        None,
                        conflict,
                        retry_after_ms,
                        False,
                    )
                )
                continue

            if normalized.depends_on_mutation_id and normalized.depends_on_mutation_id not in applied_ids:
                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    base_hash,
                    signature_key_id,
                    "FAILED_PERMANENT",
                    signature_valid,
                    "INVALID_PAYLOAD",
                    "depends_on_mutation_not_applied",
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        "FAILED_PERMANENT",
                        "INVALID_PAYLOAD",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        base_hash,
                        signature_valid,
                        None,
                        None,
                        0,
                        False,
                    )
                )
                continue

            if op in {"SWAP_APPLY", "SWAP_REVERT"}:
                rule, conflict_code = _evaluate_swap_rule(conn, normalized)
                if conflict_code is not None:
                    state, retry_after_ms, conflict = _conflict_for_code(conflict_code, rule)
                    _insert_queue(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        state,
                        signature_valid,
                        str(conflict_code),
                        conflict_code,
                        chain_prev_hash,
                        chain_item_hash,
                    )
                    results.append(
                        _build_result(
                            payload,
                            normalized,
                            state,
                            str(conflict_code),
                            received_at,
                            max(0, _now_ms() - start_ms),
                            signature_hash,
                            signature_valid,
                            None,
                            conflict,
                            retry_after_ms,
                            False,
                        )
                    )
                    continue

            current_version = _get_entity_version(conn, user_id, entity_type, entity_id)
            if normalized.base_version is not None and normalized.base_version != current_version:
                state, retry_after_ms, conflict = _conflict_for_code("VERSION_CONFLICT")
                _insert_queue(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    state,
                    signature_valid,
                    "VERSION_CONFLICT",
                    "base_version_mismatch",
                    chain_prev_hash,
                    chain_item_hash,
                )
                results.append(
                    _build_result(
                        payload,
                        normalized,
                        state,
                        "VERSION_CONFLICT",
                        received_at,
                        max(0, _now_ms() - start_ms),
                        signature_hash,
                        signature_valid,
                        current_version,
                        conflict,
                        retry_after_ms,
                        False,
                    )
                )
                continue

            if normalized.base_version is not None:
                next_version = current_version + 1
            else:
                next_version = current_version

            if op in {
                "SYMPTOM_CREATE",
                "SYMPTOM_UPDATE",
                "SYMPTOM_DELETE",
                "MEAL_CREATE",
                "MEAL_UPDATE",
                "MEAL_DELETE",
                "CUSTOM_FOOD_CREATE",
                "CUSTOM_FOOD_UPDATE",
                "CUSTOM_FOOD_DELETE",
                "SAVED_MEAL_CREATE",
                "SAVED_MEAL_UPDATE",
                "SAVED_MEAL_DELETE",
            }:
                try:
                    with conn.transaction():
                        _apply_tracking_mutation(
                            conn,
                            user_id,
                            normalized,
                            entity_type,
                            entity_id,
                            max(next_version, 1),
                        )
                        if normalized.base_version is not None:
                            _set_entity_version(conn, user_id, entity_type, entity_id, max(next_version, 1))
                except (ValueError, ApiError):
                    _insert_queue(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        "FAILED_PERMANENT",
                        signature_valid,
                        "INVALID_PAYLOAD",
                        "tracking_apply_failed",
                        chain_prev_hash,
                        chain_item_hash,
                    )
                    results.append(
                        _build_result(
                            payload,
                            normalized,
                            "FAILED_PERMANENT",
                            "INVALID_PAYLOAD",
                            received_at,
                            max(0, _now_ms() - start_ms),
                            signature_hash,
                            signature_valid,
                            None,
                            None,
                            0,
                            False,
                        )
                    )
                    continue

            if normalized.base_version is not None and op not in {
                "SYMPTOM_CREATE",
                "SYMPTOM_UPDATE",
                "SYMPTOM_DELETE",
                "MEAL_CREATE",
                "MEAL_UPDATE",
                "MEAL_DELETE",
                "CUSTOM_FOOD_CREATE",
                "CUSTOM_FOOD_UPDATE",
                "CUSTOM_FOOD_DELETE",
                "SAVED_MEAL_CREATE",
                "SAVED_MEAL_UPDATE",
                "SAVED_MEAL_DELETE",
            }:
                _set_entity_version(conn, user_id, entity_type, entity_id, max(next_version, 1))

            _insert_queue(
                conn,
                payload,
                normalized,
                user_id,
                entity_type,
                entity_id,
                signature_hash,
                signature_key_id,
                "APPLIED",
                signature_valid,
                "OK",
                None,
                chain_prev_hash,
                chain_item_hash,
            )
            results.append(
                _build_result(
                    payload,
                    normalized,
                    "APPLIED",
                    "OK",
                    received_at,
                    max(0, _now_ms() - start_ms),
                    signature_hash,
                    signature_valid,
                    next_version,
                    None,
                    0,
                    False,
                )
            )
            applied_ids.add(normalized.mutation_id)

        failed_payload_count = len([item for item in results if item.result_code == "INVALID_PAYLOAD"])
        failed_permanent_count = len(
            [item for item in results if item.result_code == "INVALID_PAYLOAD" and item.status == "FAILED_PERMANENT"]
        )

        if legacy_mutation_count > 0:
            _emit_sync_alert(
                "legacy_idempotency_usage",
                {
                    "batch_id": payload.batch_id,
                    "user_id": str(user_id),
                    "legacy_count": legacy_mutation_count,
                    "total_items": len(payload.items),
                    "run_id": str(server_batch_seq),
                    "severity": "warn",
                },
            )

        if failed_payload_count > 0:
            _emit_sync_alert(
                "invalid_payload_rejections",
                {
                    "batch_id": payload.batch_id,
                    "user_id": str(user_id),
                    "failed_payload_count": failed_payload_count,
                    "failed_permanent_count": failed_permanent_count,
                    "total_items": len(payload.items),
                    "severity": "alert",
                },
            )

        return SyncV1MutationBatchResponse(
            batch_id=payload.batch_id,
            schema_version=payload.schema_version,
            received_at_utc=received_at,
            server_batch_seq=server_batch_seq,
            items=results,
        )
