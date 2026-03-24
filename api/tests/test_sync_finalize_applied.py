"""Focused unit tests for _finalize_applied in sync.py.

Tests the success/finalization path using monkeypatched _insert_queue and
_build_result. No DB dependency.

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
from app.routers.sync import _finalize_applied

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
    """_finalize_applied returns whatever _build_result produces."""
    sentinel = MagicMock()
    mock_build.return_value = sentinel
    conn = MagicMock()

    result = _finalize_applied(
        conn, _make_batch_payload(), _make_mutation(), _USER_ID,
        "symptom_log", "ent-1", _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
        applied_version=3,
    )

    assert result is sentinel


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_inserts_queue_with_applied_state(mock_queue, mock_build):
    """Queue row uses state='APPLIED', error_code='OK', error_detail=None."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _finalize_applied(
        conn, _make_batch_payload(), _make_mutation(), _USER_ID,
        "symptom_log", "ent-1", _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
        applied_version=3,
    )

    queue_args = mock_queue.call_args[0]
    assert queue_args[8] == "APPLIED"   # state
    assert queue_args[10] == "OK"       # error_code
    assert queue_args[11] is None       # error_detail


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_builds_result_with_applied_state_and_version(mock_queue, mock_build):
    """Build result uses state='APPLIED', result_code='OK', applied_version."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _finalize_applied(
        conn, _make_batch_payload(), _make_mutation(), _USER_ID,
        "symptom_log", "ent-1", _SIG_HASH, _SIG_KEY_ID, True,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
        applied_version=7,
    )

    build_args = mock_build.call_args[0]
    assert build_args[2] == "APPLIED"  # state
    assert build_args[3] == "OK"       # result_code
    assert build_args[8] == 7          # applied_version
    assert build_args[9] is None       # conflict
    assert build_args[10] == 0         # retry_after_ms
    assert build_args[11] is False     # is_idempotent


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_forwards_signature_fields(mock_queue, mock_build):
    """Signature hash and validity are forwarded to both queue and build."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _finalize_applied(
        conn, _make_batch_payload(), _make_mutation(), _USER_ID,
        "symptom_log", "ent-1", "sha256:xyz", "key-99", False,
        _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
        applied_version=1,
    )

    queue_args = mock_queue.call_args[0]
    assert queue_args[6] == "sha256:xyz"   # signature_hash in queue
    assert queue_args[7] == "key-99"       # signature_key_id in queue
    assert queue_args[9] is False          # signature_valid in queue

    build_args = mock_build.call_args[0]
    assert build_args[6] == "sha256:xyz"   # signature_hash in build
    assert build_args[7] is False          # signature_valid in build


@patch(f"{_PATCH_PREFIX}._build_result")
@patch(f"{_PATCH_PREFIX}._insert_queue")
def test_forwards_chain_hashes(mock_queue, mock_build):
    """Chain prev and item hashes are forwarded to _insert_queue."""
    mock_build.return_value = MagicMock()
    conn = MagicMock()

    _finalize_applied(
        conn, _make_batch_payload(), _make_mutation(), _USER_ID,
        "symptom_log", "ent-1", _SIG_HASH, _SIG_KEY_ID, True,
        "chain-prev-abc", "chain-item-xyz", _NOW, 5,
        applied_version=1,
    )

    queue_args = mock_queue.call_args[0]
    assert queue_args[12] == "chain-prev-abc"  # chain_prev_hash
    assert queue_args[13] == "chain-item-xyz"  # chain_item_hash
