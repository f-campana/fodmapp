"""Focused unit tests for _reject_with_conflict in sync.py.

Tests the consent-revoked rejection pattern using monkeypatched
_insert_queue, _build_result, and _conflict_for_code. No DB dependency.

The integration backstop for this area is test_sync_batch_mutations.py.
"""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.models import (
    SyncV1MutationBatchRequest,
    SyncV1MutationItem,
)
from app.routers.sync import _reject_with_conflict

_NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)
_USER_ID = uuid4()
_SIG_HASH = "sha256:abc"
_SIG_KEY_ID = "key-1"
_CHAIN_PREV = "prev-hash"
_CHAIN_ITEM = "item-hash"


def _make_batch_payload(**overrides) -> SyncV1MutationBatchRequest:
    defaults = {
        "batch_id": str(uuid4()),
        "schema_version": 1,
        "client_device_id": "device-1",
        "sync_session_id": "sess-1",
        "client_time_utc": _NOW.isoformat(),
        "items": [],
    }
    defaults.update(overrides)
    return SyncV1MutationBatchRequest(**defaults)


def _make_mutation(**overrides) -> SyncV1MutationItem:
    defaults = {
        "mutation_id": str(uuid4()),
        "idempotency_key": str(uuid4()),
        "operation_type": "SYMPTOM_CREATE",
        "entity_type": "symptom_log",
        "entity_id": str(uuid4()),
        "client_seq": 1,
        "client_created_at": _NOW,
        "payload": {"severity": "low"},
    }
    defaults.update(overrides)
    return SyncV1MutationItem(**defaults)


_PATCH_PREFIX = "app.routers.sync"


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_calls_conflict_for_code_with_given_code(mock_conflict, mock_queue, mock_build):
    mock_conflict.return_value = ("rejected", 0, MagicMock())
    mock_build.return_value = MagicMock()
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()

    _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 42,
        conflict_code="CONSENT_REVOKED",
        error_detail="consent_missing",
    )

    mock_conflict.assert_called_once_with("CONSENT_REVOKED", None)


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_inserts_queue_with_correct_state_and_detail(mock_conflict, mock_queue, mock_build):
    mock_conflict.return_value = ("rejected", 0, MagicMock())
    mock_build.return_value = MagicMock()
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()

    _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 42,
        conflict_code="CONSENT_REVOKED",
        error_detail="symptom_missing",
    )

    mock_queue.assert_called_once()
    args = mock_queue.call_args[0]
    # conn, payload, mutation, user_id, entity_type, entity_id,
    # sig_hash, sig_key_id, state, sig_valid, error_code, error_detail,
    # chain_prev, chain_item
    assert args[8] == "rejected"  # state
    assert args[10] == "CONSENT_REVOKED"  # error_code
    assert args[11] == "symptom_missing"  # error_detail


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_builds_result_with_no_applied_version(mock_conflict, mock_queue, mock_build):
    conflict_obj = MagicMock()
    mock_conflict.return_value = ("rejected", 1500, conflict_obj)
    sentinel_result = MagicMock()
    mock_build.return_value = sentinel_result
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()

    result = _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 42,
        conflict_code="CONSENT_REVOKED",
        error_detail="consent_missing",
    )

    assert result is sentinel_result
    mock_build.assert_called_once()
    args = mock_build.call_args
    assert args[0][4] == _NOW  # received_at
    assert args[0][5] == 42  # processing_ms
    assert args[0][8] is None  # applied_version
    assert args[0][9] is conflict_obj  # conflict
    assert args[0][10] == 1500  # retry_after_ms
    assert args[0][11] is False  # dedupe_hit


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_passes_signature_fields_through(mock_conflict, mock_queue, mock_build):
    mock_conflict.return_value = ("rejected", 0, MagicMock())
    mock_build.return_value = MagicMock()
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()

    _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, False,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 0,
        conflict_code="CONSENT_REVOKED",
        error_detail="consent_missing",
    )

    # _insert_queue receives signature_hash, signature_key_id, signature_valid
    queue_args = mock_queue.call_args[0]
    assert queue_args[6] == _SIG_HASH
    assert queue_args[7] == _SIG_KEY_ID
    assert queue_args[9] is False  # signature_valid

    # _build_result receives signature_hash and signature_valid
    build_args = mock_build.call_args[0]
    assert build_args[6] == _SIG_HASH
    assert build_args[7] is False


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_passes_chain_hashes_to_queue(mock_conflict, mock_queue, mock_build):
    mock_conflict.return_value = ("rejected", 0, MagicMock())
    mock_build.return_value = MagicMock()
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()

    _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, True,
        "prev-abc", "item-xyz", _NOW, 0,
        conflict_code="CONSENT_REVOKED",
        error_detail="consent_missing",
    )

    queue_args = mock_queue.call_args[0]
    assert queue_args[12] == "prev-abc"  # chain_prev_hash
    assert queue_args[13] == "item-xyz"  # chain_item_hash


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_works_with_different_conflict_code(mock_conflict, mock_queue, mock_build):
    """Verify the helper is not hardcoded to CONSENT_REVOKED."""
    conflict_obj = MagicMock()
    mock_conflict.return_value = ("CONFLICT", 5000, conflict_obj)
    mock_build.return_value = MagicMock()
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()

    _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 10,
        conflict_code="ENDPOINT_UNKNOWN",
        error_detail="unknown_op",
    )

    mock_conflict.assert_called_once_with("ENDPOINT_UNKNOWN", None)
    queue_args = mock_queue.call_args[0]
    assert queue_args[10] == "ENDPOINT_UNKNOWN"
    assert queue_args[11] == "unknown_op"
    build_args = mock_build.call_args[0]
    assert build_args[3] == "ENDPOINT_UNKNOWN"


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_passes_rule_to_conflict_for_code(mock_conflict, mock_queue, mock_build):
    """Verify rule kwarg is forwarded to _conflict_for_code (swap-conflict path)."""
    mock_conflict.return_value = ("CONFLICT", 0, MagicMock())
    mock_build.return_value = MagicMock()
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()
    swap_rule = {"from_food_slug": "wheat", "to_food_slug": "spelt"}

    _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
        conflict_code="RULE_INACTIVE",
        error_detail="RULE_INACTIVE",
        rule=swap_rule,
    )

    mock_conflict.assert_called_once_with("RULE_INACTIVE", swap_rule)


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
@patch(f"{_PATCH_PREFIX}._conflict_for_code")
def test_passes_applied_version_to_build_result(mock_conflict, mock_queue, mock_build):
    """Verify applied_version kwarg is forwarded to _build_result (version-conflict path)."""
    mock_conflict.return_value = ("CONFLICT", 1500, MagicMock())
    sentinel_result = MagicMock()
    mock_build.return_value = sentinel_result
    conn = MagicMock()
    payload = _make_batch_payload()
    mutation = _make_mutation()

    result = _reject_with_conflict(
        conn, payload, mutation, _USER_ID, "symptom_log", "ent-1",
        _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 7,
        conflict_code="VERSION_CONFLICT",
        error_detail="base_version_mismatch",
        applied_version=42,
    )

    assert result is sentinel_result
    build_args = mock_build.call_args[0]
    assert build_args[8] == 42  # applied_version
