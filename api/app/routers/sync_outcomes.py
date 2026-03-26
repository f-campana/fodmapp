"""Pure outcome builders for sync mutation results.

Maps conflict codes to (state, retry_ms, conflict) tuples, constructs
observability metadata, and assembles SyncV1MutationResult payloads.

No DB or queue dependency — kept deliberately import-light so that
sync.py can import these without creating a circular dependency.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4

from app.models import (
    SyncV1ConflictCode,
    SyncV1MutationBatchRequest,
    SyncV1MutationConflict,
    SyncV1MutationItem,
    SyncV1MutationObservability,
    SyncV1MutationRecovery,
    SyncV1MutationResult,
    SyncV1MutationResultState,
)

RETRY_DELAY_MS_VERSION_CONFLICT = 1_500
RETRY_DELAY_MS_ENDPOINT_UNKNOWN = 5_000


# -- tiny helpers ------------------------------------------------------------


def _rule_float(rule: Optional[dict[str, Any]], key: str) -> Optional[float]:
    if rule is None or rule.get(key) is None:
        return None
    return float(rule[key])


def _rule_str(rule: Optional[dict[str, Any]], key: str) -> Optional[str]:
    if rule is None or rule.get(key) is None:
        return None
    return str(rule[key])


def _retry_attempt(mutation: SyncV1MutationItem) -> int:
    raw = (mutation.conflict_marker or {}).get("retry_attempt")
    try:
        return int(raw)
    except (TypeError, ValueError):
        return 0


# -- observability -----------------------------------------------------------


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


# -- conflict code mapping ---------------------------------------------------


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


# -- result builders ---------------------------------------------------------


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
