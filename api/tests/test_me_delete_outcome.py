"""Focused unit tests for _persist_delete_outcome and _EMPTY_DELETE_SUMMARY in me.py.

Tests the delete job outcome persistence helper using a monkeypatched conn.
No DB dependency.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.routers.me import _EMPTY_DELETE_SUMMARY, _persist_delete_outcome

_PATCH_PREFIX = "app.routers.me"


class TestEmptyDeleteSummary:
    def test_has_all_expected_keys(self):
        expected_keys = {
            "consent_records_touched",
            "symptom_logs_deleted",
            "diet_logs_deleted",
            "swap_history_deleted",
            "queue_items_dropped",
            "exports_invalidated",
        }
        assert set(_EMPTY_DELETE_SUMMARY.keys()) == expected_keys

    def test_all_values_are_zero(self):
        assert all(v == 0 for v in _EMPTY_DELETE_SUMMARY.values())


class TestPersistDeleteOutcome:
    @patch(f"{_PATCH_PREFIX}._jsonb", side_effect=lambda v: v)
    def test_executes_update_with_correct_params(self, mock_jsonb):
        conn = MagicMock()
        rid = uuid4()

        _persist_delete_outcome(
            conn,
            rid,
            status="completed",
            summary_dict={"symptom_logs_deleted": 5},
            proof={"receipt_id": "r1"},
        )

        conn.execute.assert_called_once()
        params = conn.execute.call_args[0][1]
        assert params["delete_request_id"] == rid
        assert params["status"] == "completed"
        assert params["summary"] == {"symptom_logs_deleted": 5}
        assert params["proof"] == {"receipt_id": "r1"}
        assert params["error_code"] is None
        assert params["error_detail"] is None

    @patch(f"{_PATCH_PREFIX}._jsonb", side_effect=lambda v: v)
    def test_passes_error_fields_on_failure(self, mock_jsonb):
        conn = MagicMock()
        rid = uuid4()

        _persist_delete_outcome(
            conn,
            rid,
            status="failed",
            summary_dict=dict(_EMPTY_DELETE_SUMMARY),
            proof=None,
            error_code="delete_processing_failed",
            error_detail="boom",
        )

        params = conn.execute.call_args[0][1]
        assert params["status"] == "failed"
        assert params["proof"] is None
        assert params["error_code"] == "delete_processing_failed"
        assert params["error_detail"] == "boom"

    @patch(f"{_PATCH_PREFIX}._jsonb", side_effect=lambda v: v)
    def test_partial_status_no_error(self, mock_jsonb):
        conn = MagicMock()
        rid = uuid4()

        _persist_delete_outcome(
            conn,
            rid,
            status="partial",
            summary_dict=dict(_EMPTY_DELETE_SUMMARY),
            proof={"receipt_id": "r2"},
        )

        params = conn.execute.call_args[0][1]
        assert params["status"] == "partial"
        assert params["error_code"] is None
        assert params["error_detail"] is None
        assert params["proof"] == {"receipt_id": "r2"}
