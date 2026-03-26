"""Focused unit tests for _apply_symptom_mutation and _coerce_symptom_payload.

Tests use monkeypatched tracking_store calls — no DB dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.models import SyncV1MutationItem
from app.routers.sync_dispatch import _apply_symptom_mutation, _coerce_symptom_payload

_NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)


# -- _coerce_symptom_payload ---------------------------------------------------


class TestCoerceSymptomPayloadFull:
    """Tests for partial=False (SYMPTOM_CREATE)."""

    def test_known_symptom_type(self):
        result = _coerce_symptom_payload(
            {"symptom_type": "bloating", "severity": 3, "noted_at_utc": _NOW.isoformat()},
            _NOW,
            partial=False,
        )
        assert result["symptom_type"] == "bloating"
        assert result["severity"] == 3

    def test_unknown_symptom_type_falls_back_to_other(self):
        result = _coerce_symptom_payload(
            {"symptom_type": "headache", "severity": 2},
            _NOW,
            partial=False,
        )
        assert result["symptom_type"] == "other"

    def test_unknown_symptom_appended_to_note(self):
        result = _coerce_symptom_payload(
            {"symptom_type": "headache", "severity": 2},
            _NOW,
            partial=False,
        )
        assert "headache" in result.get("note", "")

    def test_missing_symptom_type_defaults_to_other(self):
        result = _coerce_symptom_payload({}, _NOW, partial=False)
        assert result["symptom_type"] == "other"

    def test_missing_severity_defaults_to_zero(self):
        result = _coerce_symptom_payload({}, _NOW, partial=False)
        assert result["severity"] == 0

    def test_missing_noted_at_uses_fallback(self):
        result = _coerce_symptom_payload({}, _NOW, partial=False)
        assert result["noted_at_utc"] == _NOW

    def test_explicit_noted_at_preserved(self):
        ts = "2025-01-01T00:00:00+00:00"
        result = _coerce_symptom_payload({"noted_at_utc": ts}, _NOW, partial=False)
        assert result["noted_at_utc"] == ts

    def test_note_passthrough(self):
        result = _coerce_symptom_payload(
            {"note": "after lunch"},
            _NOW,
            partial=False,
        )
        assert result["note"] == "after lunch"

    def test_note_concatenation_with_unknown_symptom(self):
        result = _coerce_symptom_payload(
            {"symptom_type": "headache", "note": "mild"},
            _NOW,
            partial=False,
        )
        assert result["note"] == "headache — mild"

    def test_all_allowed_symptom_types(self):
        allowed = {"bloating", "pain", "gas", "diarrhea", "constipation", "nausea", "reflux", "other"}
        for st in allowed:
            result = _coerce_symptom_payload({"symptom_type": st}, _NOW, partial=False)
            assert result["symptom_type"] == st

    def test_symptom_legacy_key(self):
        """The 'symptom' key is accepted as an alias for 'symptom_type'."""
        result = _coerce_symptom_payload({"symptom": "pain"}, _NOW, partial=False)
        assert result["symptom_type"] == "pain"

    def test_severity_coerced_to_int(self):
        result = _coerce_symptom_payload({"severity": "5"}, _NOW, partial=False)
        assert result["severity"] == 5
        assert isinstance(result["severity"], int)

    def test_severity_none_coerced_to_zero(self):
        result = _coerce_symptom_payload({"severity": None}, _NOW, partial=False)
        assert result["severity"] == 0


class TestCoerceSymptomPayloadPartial:
    """Tests for partial=True (SYMPTOM_UPDATE)."""

    def test_missing_fields_omitted(self):
        result = _coerce_symptom_payload({}, _NOW, partial=True)
        assert "symptom_type" not in result
        assert "severity" not in result
        assert "noted_at_utc" not in result

    def test_provided_fields_included(self):
        result = _coerce_symptom_payload(
            {"symptom_type": "gas", "severity": 4},
            _NOW,
            partial=True,
        )
        assert result["symptom_type"] == "gas"
        assert result["severity"] == 4

    def test_noted_at_only(self):
        ts = "2025-03-01T10:00:00Z"
        result = _coerce_symptom_payload({"noted_at_utc": ts}, _NOW, partial=True)
        assert result["noted_at_utc"] == ts
        assert "symptom_type" not in result


# -- _apply_symptom_mutation ---------------------------------------------------


def _make_mutation(**overrides) -> SyncV1MutationItem:
    defaults = {
        "mutation_id": str(uuid4()),
        "operation_type": "SYMPTOM_CREATE",
        "entity_type": "symptom_log",
        "entity_id": str(uuid4()),
        "base_version": 0,
        "client_seq": 1,
        "payload": {"symptom_type": "bloating", "severity": 3, "noted_at_utc": _NOW.isoformat()},
        "client_created_at": _NOW,
    }
    defaults.update(overrides)
    return SyncV1MutationItem(**defaults)


class TestApplySymptomMutationCreate:
    @patch("app.routers.sync_dispatch.tracking_store_symptoms")
    def test_calls_create_symptom_log(self, mock_store):
        uid = uuid4()
        eid = uuid4()
        mutation = _make_mutation(operation_type="SYMPTOM_CREATE", entity_id=str(eid))
        _apply_symptom_mutation(MagicMock(), uid, mutation, eid, 1)
        mock_store.create_symptom_log.assert_called_once()
        call_args = mock_store.create_symptom_log.call_args
        assert call_args.args[1] == uid
        assert call_args.kwargs["symptom_log_id"] == eid
        assert call_args.kwargs["version"] == 1


class TestApplySymptomMutationUpdate:
    @patch("app.routers.sync_dispatch.tracking_store_symptoms")
    def test_calls_update_symptom_log(self, mock_store):
        uid = uuid4()
        eid = uuid4()
        mutation = _make_mutation(operation_type="SYMPTOM_UPDATE")
        _apply_symptom_mutation(MagicMock(), uid, mutation, eid, 2)
        mock_store.update_symptom_log.assert_called_once()
        call_args = mock_store.update_symptom_log.call_args
        assert call_args.args[1] == uid
        assert call_args.args[2] == eid
        assert call_args.kwargs["version"] == 2


class TestApplySymptomMutationDelete:
    @patch("app.routers.sync_dispatch.tracking_store_symptoms")
    def test_calls_delete_symptom_log(self, mock_store):
        uid = uuid4()
        eid = uuid4()
        mutation = _make_mutation(operation_type="SYMPTOM_DELETE")
        _apply_symptom_mutation(MagicMock(), uid, mutation, eid, 3)
        mock_store.delete_symptom_log.assert_called_once_with(
            mock_store.delete_symptom_log.call_args.args[0],
            uid,
            eid,
            version=3,
        )


class TestApplySymptomMutationUnknownOp:
    def test_raises_on_unknown_operation(self):
        mutation = _make_mutation(operation_type="MEAL_CREATE")
        with pytest.raises(ValueError, match="Unknown symptom operation"):
            _apply_symptom_mutation(MagicMock(), uuid4(), mutation, uuid4(), 1)
