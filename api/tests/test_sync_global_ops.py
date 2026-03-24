"""Focused unit tests for _execute_global_op in sync.py.

Tests the WITHDRAW_CONSENT / DELETE_ACCOUNT dispatch pattern using
monkeypatched _insert_queue, _build_result, _conflict_for_code, and
apply_fn. No DB dependency.

The integration backstop for this area is test_sync_batch_mutations.py.
"""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.models import (
    SyncV1MutationBatchRequest,
    SyncV1MutationConflict,
    SyncV1MutationItem,
    SyncV1MutationRecovery,
    SyncV1MutationResult,
)
from app.routers.sync import _execute_global_op

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
        "operation_type": "WITHDRAW_CONSENT",
        "entity_type": "__global__",
        "entity_id": "__global__",
        "base_version": 0,
        "client_seq": 1,
        "payload": {},
        "client_created_at": _NOW,
    }
    defaults.update(overrides)
    return SyncV1MutationItem(**defaults)


class TestExecuteGlobalOpAlreadyTerminal:
    """When already_terminal=True, the op should conflict without calling apply_fn."""

    @patch("app.routers.sync._build_result")
    @patch("app.routers.sync._insert_queue")
    @patch("app.routers.sync._conflict_for_code")
    def test_conflict_path_calls_conflict_for_code(
        self, mock_conflict, mock_insert, mock_build
    ):
        mock_conflict.return_value = (
            "CANCELLED_BY_CONSENT",
            0,
            SyncV1MutationConflict(
                code="CONSENT_REVOKED",
                message_key="sync.conflict.consent_revoked",
                retryable=False,
                recovery=SyncV1MutationRecovery(action="OPEN_SETTINGS"),
            ),
        )
        sentinel = MagicMock()
        mock_build.return_value = sentinel
        apply_fn = MagicMock()

        result, was_applied = _execute_global_op(
            MagicMock(), _make_batch_payload(), _make_mutation(), _USER_ID,
            "__global__", "__global__", _SIG_HASH, _SIG_KEY_ID, True,
            _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
            already_terminal=True,
            conflict_code="CONSENT_REVOKED",
            terminal_detail="already_revoked",
            apply_fn=apply_fn,
        )

        assert was_applied is False
        assert result is sentinel
        mock_conflict.assert_called_once_with("CONSENT_REVOKED")
        apply_fn.assert_not_called()

    @patch("app.routers.sync._build_result")
    @patch("app.routers.sync._insert_queue")
    @patch("app.routers.sync._conflict_for_code")
    def test_conflict_path_inserts_queue_with_terminal_detail(
        self, mock_conflict, mock_insert, mock_build
    ):
        mock_conflict.return_value = (
            "CANCELLED_BY_DELETE",
            0,
            SyncV1MutationConflict(
                code="ACCOUNT_DELETED",
                message_key="sync.conflict.account_deleted",
                retryable=False,
                recovery=SyncV1MutationRecovery(action="NONE"),
            ),
        )
        mock_build.return_value = MagicMock()
        conn = MagicMock()
        bp = _make_batch_payload()
        mut = _make_mutation(operation_type="DELETE_ACCOUNT")

        _execute_global_op(
            conn, bp, mut, _USER_ID, "__global__", "__global__",
            _SIG_HASH, _SIG_KEY_ID, True,
            _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
            already_terminal=True,
            conflict_code="ACCOUNT_DELETED",
            terminal_detail="already_deleted",
            apply_fn=MagicMock(),
        )

        mock_insert.assert_called_once()
        insert_args = mock_insert.call_args
        # error_detail positional arg (index 11 in _insert_queue)
        assert insert_args.args[11] == "already_deleted"


class TestExecuteGlobalOpApplied:
    """When already_terminal=False, the op should apply and return was_applied=True."""

    @patch("app.routers.sync._build_result")
    @patch("app.routers.sync._insert_queue")
    def test_applied_path_calls_apply_fn(self, mock_insert, mock_build):
        mock_build.return_value = MagicMock()
        apply_fn = MagicMock()
        conn = MagicMock()

        result, was_applied = _execute_global_op(
            conn, _make_batch_payload(), _make_mutation(), _USER_ID,
            "__global__", "__global__", _SIG_HASH, _SIG_KEY_ID, True,
            _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
            already_terminal=False,
            conflict_code="CONSENT_REVOKED",
            terminal_detail="already_revoked",
            apply_fn=apply_fn,
        )

        assert was_applied is True
        assert result is mock_build.return_value
        apply_fn.assert_called_once_with(conn, _USER_ID)

    @patch("app.routers.sync._build_result")
    @patch("app.routers.sync._insert_queue")
    def test_applied_path_inserts_queue_as_applied(self, mock_insert, mock_build):
        mock_build.return_value = MagicMock()

        _execute_global_op(
            MagicMock(), _make_batch_payload(), _make_mutation(), _USER_ID,
            "__global__", "__global__", _SIG_HASH, _SIG_KEY_ID, True,
            _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
            already_terminal=False,
            conflict_code="CONSENT_REVOKED",
            terminal_detail="already_revoked",
            apply_fn=MagicMock(),
        )

        mock_insert.assert_called_once()
        insert_args = mock_insert.call_args
        # state positional arg (index 8 in _insert_queue)
        assert insert_args.args[8] == "APPLIED"
        # error_code positional arg (index 10)
        assert insert_args.args[10] == "OK"

    @patch("app.routers.sync._build_result")
    @patch("app.routers.sync._insert_queue")
    def test_applied_path_builds_result_as_applied(self, mock_insert, mock_build):
        sentinel = MagicMock()
        mock_build.return_value = sentinel

        result, _ = _execute_global_op(
            MagicMock(), _make_batch_payload(), _make_mutation(), _USER_ID,
            "__global__", "__global__", _SIG_HASH, _SIG_KEY_ID, True,
            _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
            already_terminal=False,
            conflict_code="CONSENT_REVOKED",
            terminal_detail="already_revoked",
            apply_fn=MagicMock(),
        )

        mock_build.assert_called_once()
        build_args = mock_build.call_args
        assert build_args.args[2] == "APPLIED"  # state
        assert build_args.args[3] == "OK"  # result_code


class TestExecuteGlobalOpWithdrawConsentIntegration:
    """Lightweight integration: _build_result is real, only _insert_queue mocked."""

    @patch("app.routers.sync._insert_queue")
    def test_withdraw_consent_applied_returns_applied_result(self, mock_insert):
        apply_fn = MagicMock()
        bp = _make_batch_payload()
        mut = _make_mutation(operation_type="WITHDRAW_CONSENT")

        result, was_applied = _execute_global_op(
            MagicMock(), bp, mut, _USER_ID, "__global__", "__global__",
            _SIG_HASH, _SIG_KEY_ID, True,
            _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
            already_terminal=False,
            conflict_code="CONSENT_REVOKED",
            terminal_detail="already_revoked",
            apply_fn=apply_fn,
        )

        assert was_applied is True
        assert isinstance(result, SyncV1MutationResult)
        assert result.status == "APPLIED"
        assert result.result_code == "OK"
        assert result.conflict is None

    @patch("app.routers.sync._insert_queue")
    def test_withdraw_consent_already_revoked_returns_conflict(self, mock_insert):
        bp = _make_batch_payload()
        mut = _make_mutation(operation_type="WITHDRAW_CONSENT")

        result, was_applied = _execute_global_op(
            MagicMock(), bp, mut, _USER_ID, "__global__", "__global__",
            _SIG_HASH, _SIG_KEY_ID, True,
            _CHAIN_PREV, _CHAIN_ITEM, _NOW, 5,
            already_terminal=True,
            conflict_code="CONSENT_REVOKED",
            terminal_detail="already_revoked",
            apply_fn=MagicMock(),
        )

        assert was_applied is False
        assert isinstance(result, SyncV1MutationResult)
        assert result.status == "CANCELLED_BY_CONSENT"
        assert result.result_code == "CONSENT_REVOKED"
        assert result.conflict is not None
        assert result.conflict.code == "CONSENT_REVOKED"
