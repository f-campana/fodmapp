from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional, Tuple
from uuid import UUID, uuid4

from fastapi import APIRouter, Request, Security

from app import sql, tracking_store
from app.auth import require_api_user_id
from app.crypto_utils import canonical_json, sha256_hex
from app.db import Database
from app.errors import ApiError, bad_request
from app.models import (
    SyncV1ConflictCode,
    SyncV1MutationBatchRequest,
    SyncV1MutationBatchResponse,
    SyncV1MutationItem,
    SyncV1MutationResult,
)
from app.routers.sync_dispatch import _apply_tracking_mutation
from app.routers.sync_global_ops import _apply_withdraw_consent, _mark_account_deleted
from app.routers.sync_outcomes import (
    _build_replay_result,
    _build_result,
    _conflict_for_code,
)
from app.routers.sync_protocol import (
    _compute_chain_hash,
    _emit_sync_alert,
    _is_legacy_idempotency_key,
    _normalize_mutation,
    _signature_payload,
    _sort_items,
    _verify_signature,
)
from app.routers.sync_queue import (
    _ensure_sync_schema,
    _get_entity_version,
    _insert_queue,
    _last_queue_chain_hash,
    _next_batch_seq,
    _set_entity_version,
)

router = APIRouter(prefix="/v0/sync", tags=["sync"])

SYNC_MIN_SAFETY_SCORE = 0.50
SEVERITY_ORDER = {"none": 0, "low": 1, "moderate": 2, "high": 3, "unknown": 4}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _now_ms() -> int:
    return int(_now_utc().timestamp() * 1000)


def _get_db(request: Request) -> Database:
    return request.app.state.db


def _reject_with_conflict(
    conn,
    payload: SyncV1MutationBatchRequest,
    mutation: SyncV1MutationItem,
    user_id: UUID,
    entity_type: str,
    entity_id: str,
    signature_hash: str,
    signature_key_id: Optional[str],
    signature_valid: bool,
    chain_prev_hash: Optional[str],
    chain_item_hash: Optional[str],
    received_at: datetime,
    processing_ms: int,
    *,
    conflict_code: str,
    error_detail: str,
    rule: Optional[dict[str, Any]] = None,
    applied_version: Optional[int] = None,
) -> SyncV1MutationResult:
    """Queue-insert and build result for a conflict-based rejection."""
    state, retry_after_ms, conflict = _conflict_for_code(conflict_code, rule)
    _insert_queue(
        conn,
        payload,
        mutation,
        user_id,
        entity_type,
        entity_id,
        signature_hash,
        signature_key_id,
        state,
        signature_valid,
        conflict_code,
        error_detail,
        chain_prev_hash,
        chain_item_hash,
    )
    return _build_result(
        payload,
        mutation,
        state,
        conflict_code,
        received_at,
        processing_ms,
        signature_hash,
        signature_valid,
        applied_version,
        conflict,
        retry_after_ms,
        False,
    )


def _reject_invalid_payload(
    conn,
    payload: SyncV1MutationBatchRequest,
    mutation: SyncV1MutationItem,
    user_id: UUID,
    entity_type: str,
    entity_id: str,
    queue_hash: str,
    signature_key_id: Optional[str],
    signature_valid: bool,
    chain_prev_hash: Optional[str],
    chain_item_hash: Optional[str],
    received_at: datetime,
    processing_ms: int,
    *,
    error_detail: str,
) -> SyncV1MutationResult:
    """Queue-insert and build result for a permanent invalid-payload rejection."""
    _insert_queue(
        conn,
        payload,
        mutation,
        user_id,
        entity_type,
        entity_id,
        queue_hash,
        signature_key_id,
        "FAILED_PERMANENT",
        signature_valid,
        "INVALID_PAYLOAD",
        error_detail,
        chain_prev_hash,
        chain_item_hash,
    )
    return _build_result(
        payload,
        mutation,
        "FAILED_PERMANENT",
        "INVALID_PAYLOAD",
        received_at,
        processing_ms,
        queue_hash,
        signature_valid,
        None,
        None,
        0,
        False,
    )


def _finalize_applied(
    conn,
    payload: SyncV1MutationBatchRequest,
    mutation: SyncV1MutationItem,
    user_id: UUID,
    entity_type: str,
    entity_id: str,
    signature_hash: str,
    signature_key_id: Optional[str],
    signature_valid: bool,
    chain_prev_hash: Optional[str],
    chain_item_hash: Optional[str],
    received_at: datetime,
    processing_ms: int,
    *,
    applied_version: int,
) -> SyncV1MutationResult:
    """Queue-insert and build result for a successfully applied mutation."""
    _insert_queue(
        conn,
        payload,
        mutation,
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
    return _build_result(
        payload,
        mutation,
        "APPLIED",
        "OK",
        received_at,
        processing_ms,
        signature_hash,
        signature_valid,
        applied_version,
        None,
        0,
        False,
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


def _execute_global_op(
    conn,
    payload: SyncV1MutationBatchRequest,
    normalized: SyncV1MutationItem,
    user_id: UUID,
    entity_type: str,
    entity_id: str,
    signature_hash: str,
    signature_key_id: Optional[str],
    signature_valid: bool,
    chain_prev_hash: Optional[str],
    chain_item_hash: str,
    received_at: datetime,
    processing_ms: int,
    *,
    already_terminal: bool,
    conflict_code: SyncV1ConflictCode,
    terminal_detail: str,
    apply_fn,
) -> Tuple[SyncV1MutationResult, bool]:
    """Execute a global operation (WITHDRAW_CONSENT / DELETE_ACCOUNT).

    If ``already_terminal`` the operation is recorded as a conflict;
    otherwise ``apply_fn(conn, user_id)`` is called and the result is APPLIED.

    Returns ``(result, was_applied)``.
    """
    if already_terminal:
        state, retry_after_ms, conflict = _conflict_for_code(conflict_code)
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
            conflict_code,
            terminal_detail,
            chain_prev_hash,
            chain_item_hash,
        )
        return _build_result(
            payload,
            normalized,
            state,
            conflict_code,
            received_at,
            processing_ms,
            signature_hash,
            signature_valid,
            None,
            conflict,
            retry_after_ms,
            False,
        ), False

    apply_fn(conn, user_id)
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
    return _build_result(
        payload,
        normalized,
        "APPLIED",
        "OK",
        received_at,
        processing_ms,
        signature_hash,
        signature_valid,
        None,
        None,
        0,
        False,
    ), True


@router.post("/mutations:batch", response_model=SyncV1MutationBatchResponse)
def sync_mutations_batch(
    request: Request,
    payload: SyncV1MutationBatchRequest,
    user_id: UUID = Security(require_api_user_id),
) -> SyncV1MutationBatchResponse:
    if payload.user_id is not None and payload.user_id != str(user_id):
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
                result, was_applied = _execute_global_op(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    signature_valid,
                    chain_prev_hash,
                    chain_item_hash,
                    received_at,
                    max(0, _now_ms() - start_ms),
                    already_terminal=not consent_active,
                    conflict_code="CONSENT_REVOKED",
                    terminal_detail="already_revoked",
                    apply_fn=_apply_withdraw_consent,
                )
                if was_applied:
                    consent_active = False
                    applied_ids.add(normalized.mutation_id)
                results.append(result)
                continue

            if op == "DELETE_ACCOUNT":
                result, was_applied = _execute_global_op(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    signature_valid,
                    chain_prev_hash,
                    chain_item_hash,
                    received_at,
                    max(0, _now_ms() - start_ms),
                    already_terminal=account_deleted,
                    conflict_code="ACCOUNT_DELETED",
                    terminal_detail="already_deleted",
                    apply_fn=_mark_account_deleted,
                )
                if was_applied:
                    account_deleted = True
                    applied_ids.add(normalized.mutation_id)
                results.append(result)
                continue

            if not consent_active:
                results.append(
                    _reject_with_conflict(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        signature_valid,
                        chain_prev_hash,
                        chain_item_hash,
                        received_at,
                        max(0, _now_ms() - start_ms),
                        conflict_code="CONSENT_REVOKED",
                        error_detail="consent_missing",
                    )
                )
                continue

            tracking_scope = tracking_store.tracking_scope_for_entity(entity_type)
            if tracking_scope is not None and not tracking_store.has_tracking_scope(consent_scope, tracking_scope):
                results.append(
                    _reject_with_conflict(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        signature_valid,
                        chain_prev_hash,
                        chain_item_hash,
                        received_at,
                        max(0, _now_ms() - start_ms),
                        conflict_code="CONSENT_REVOKED",
                        error_detail=f"{tracking_scope}_missing",
                    )
                )
                continue

            if normalized.depends_on_mutation_id and normalized.depends_on_mutation_id not in applied_ids:
                results.append(
                    _reject_invalid_payload(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        base_hash,
                        signature_key_id,
                        signature_valid,
                        chain_prev_hash,
                        chain_item_hash,
                        received_at,
                        max(0, _now_ms() - start_ms),
                        error_detail="depends_on_mutation_not_applied",
                    )
                )
                continue

            if op in {"SWAP_APPLY", "SWAP_REVERT"}:
                swap_rule, swap_conflict_code = _evaluate_swap_rule(conn, normalized)
                if swap_conflict_code is not None:
                    results.append(
                        _reject_with_conflict(
                            conn,
                            payload,
                            normalized,
                            user_id,
                            entity_type,
                            entity_id,
                            signature_hash,
                            signature_key_id,
                            signature_valid,
                            chain_prev_hash,
                            chain_item_hash,
                            received_at,
                            max(0, _now_ms() - start_ms),
                            conflict_code=swap_conflict_code,
                            error_detail=swap_conflict_code,
                            rule=swap_rule,
                        )
                    )
                    continue

            current_version = _get_entity_version(conn, user_id, entity_type, entity_id)
            if normalized.base_version is not None and normalized.base_version != current_version:
                results.append(
                    _reject_with_conflict(
                        conn,
                        payload,
                        normalized,
                        user_id,
                        entity_type,
                        entity_id,
                        signature_hash,
                        signature_key_id,
                        signature_valid,
                        chain_prev_hash,
                        chain_item_hash,
                        received_at,
                        max(0, _now_ms() - start_ms),
                        conflict_code="VERSION_CONFLICT",
                        error_detail="base_version_mismatch",
                        applied_version=current_version,
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
                    results.append(
                        _reject_invalid_payload(
                            conn,
                            payload,
                            normalized,
                            user_id,
                            entity_type,
                            entity_id,
                            signature_hash,
                            signature_key_id,
                            signature_valid,
                            chain_prev_hash,
                            chain_item_hash,
                            received_at,
                            max(0, _now_ms() - start_ms),
                            error_detail="tracking_apply_failed",
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

            results.append(
                _finalize_applied(
                    conn,
                    payload,
                    normalized,
                    user_id,
                    entity_type,
                    entity_id,
                    signature_hash,
                    signature_key_id,
                    signature_valid,
                    chain_prev_hash,
                    chain_item_hash,
                    received_at,
                    max(0, _now_ms() - start_ms),
                    applied_version=next_version,
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
