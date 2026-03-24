"""Focused unit tests for _reject_invalid_payload in sync.py.

Tests the FAILED_PERMANENT / INVALID_PAYLOAD rejection path using monkeypatched
_insert_queue and _build_result. No DB dependency.

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
from app.routers.sync import _reject_invalid_payload

_NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)
_USER_ID = uuid4()
_SIG_HASH = "sha256:abc"
_SIG_KEY_ID = "key-1"
_CHAIN_PREV = "prev-hash"
_CHAIN_ITEM = "item-hash"
_PATCH_PREFIX = "app.routers.sync"


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
        "entity_type": "symptom_log",
        "entity_id": str(uuid4()),
        "operation": "SYMPTOM_CREATE",
        "payload": {},
        "client_created_at": _NOW.isoformat(),
    }
    defaults.update(overrides)
    return SyncV1MutationItem(**defaults)


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_returns_build_result_value(mock_queue, mock_build):
    """_reject_invalid_payload returns whatever _build_result produces."""
    sentinel = MagicMock()
    mock_build.return_value = sentinel
    conn = MagicMock()

    result = _reject_invalid_payload(
        conn,
        _make_batch_payload(),
        _make_mutation(),
        _USER_ID,
        "symptom_log",
        "ent-1",
        _SIG_HASH,
        _SIG_KEY_ID,
        True,
        _CHAIN_PREV,
        _CHAIN_ITEM,
        _NOW,
        5,
        error_detail="depends_on_mutation_not_applied",
    )

    assert result is sentinel


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_inserts_queue_with_failed_permanent_state(mock_queue, mock_build):
    """Queue row uses state='FAILED_PERMANENT', error_code='INVALID_PAYLOAD'."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _reject_invalid_payload(
        conn,
        _make_batch_payload(),
        _make_mutation(),
        _USER_ID,
        "symptom_log",
        "ent-1",
        _SIG_HASH,
        _SIG_KEY_ID,
        True,
        _CHAIN_PREV,
        _CHAIN_ITEM,
        _NOW,
        5,
        error_detail="tracking_apply_failed",
    )

    queue_args = mock_queue.call_args[0]
    assert queue_args[8] == "FAILED_PERMANENT"  # state
    assert queue_args[10] == "INVALID_PAYLOAD"  # error_code
    assert queue_args[11] == "tracking_apply_failed"  # error_detail


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_builds_result_with_no_conflict_no_retry(mock_queue, mock_build):
    """Build result has conflict=None, retry=0, applied_version=None."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _reject_invalid_payload(
        conn,
        _make_batch_payload(),
        _make_mutation(),
        _USER_ID,
        "symptom_log",
        "ent-1",
        _SIG_HASH,
        _SIG_KEY_ID,
        True,
        _CHAIN_PREV,
        _CHAIN_ITEM,
        _NOW,
        5,
        error_detail="depends_on_mutation_not_applied",
    )

    build_args = mock_build.call_args[0]
    assert build_args[2] == "FAILED_PERMANENT"  # state
    assert build_args[3] == "INVALID_PAYLOAD"  # result_code
    assert build_args[8] is None  # applied_version
    assert build_args[9] is None  # conflict
    assert build_args[10] == 0  # retry_after_ms
    assert build_args[11] is False  # is_idempotent


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_forwards_queue_hash_to_both(mock_queue, mock_build):
    """The queue_hash parameter is forwarded to both _insert_queue and _build_result."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _reject_invalid_payload(
        conn,
        _make_batch_payload(),
        _make_mutation(),
        _USER_ID,
        "symptom_log",
        "ent-1",
        "sha256:custom-hash",
        _SIG_KEY_ID,
        True,
        _CHAIN_PREV,
        _CHAIN_ITEM,
        _NOW,
        5,
        error_detail="depends_on_mutation_not_applied",
    )

    queue_args = mock_queue.call_args[0]
    assert queue_args[6] == "sha256:custom-hash"  # queue_hash in queue

    build_args = mock_build.call_args[0]
    assert build_args[6] == "sha256:custom-hash"  # queue_hash in build


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_forwards_error_detail(mock_queue, mock_build):
    """error_detail kwarg is forwarded to _insert_queue as error_detail."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _reject_invalid_payload(
        conn,
        _make_batch_payload(),
        _make_mutation(),
        _USER_ID,
        "symptom_log",
        "ent-1",
        _SIG_HASH,
        _SIG_KEY_ID,
        True,
        _CHAIN_PREV,
        _CHAIN_ITEM,
        _NOW,
        5,
        error_detail="custom_detail",
    )

    queue_args = mock_queue.call_args[0]
    assert queue_args[11] == "custom_detail"
