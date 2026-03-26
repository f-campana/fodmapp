"""Focused unit tests for _apply_meal_mutation in sync.py.

Tests use monkeypatched tracking_store calls — no DB dependency.
The integration backstop for this area is test_sync_batch_mutations.py.
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.models import SyncV1MutationItem
from app.routers.sync_dispatch import _apply_meal_mutation

_NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)

_MEAL_PAYLOAD = {
    "title": "Lunch",
    "occurred_at_utc": _NOW.isoformat(),
    "note": "light meal",
    "items": [
        {
            "item_kind": "canonical_food",
            "food_slug": "rice",
            "quantity_text": "1 cup",
        }
    ],
}

_MEAL_UPDATE_PAYLOAD = {
    "title": "Dinner",
    "note": "updated",
}


def _make_mutation(**overrides) -> SyncV1MutationItem:
    defaults = {
        "mutation_id": str(uuid4()),
        "operation_type": "MEAL_CREATE",
        "entity_type": "meal_log",
        "entity_id": str(uuid4()),
        "base_version": 0,
        "client_seq": 1,
        "payload": _MEAL_PAYLOAD,
        "client_created_at": _NOW,
    }
    defaults.update(overrides)
    return SyncV1MutationItem(**defaults)


class TestApplyMealMutationCreate:
    @patch("app.routers.sync_dispatch.tracking_store_meals")
    def test_calls_create_meal_log(self, mock_store):
        uid = uuid4()
        eid = uuid4()
        mutation = _make_mutation(operation_type="MEAL_CREATE", payload=_MEAL_PAYLOAD)
        _apply_meal_mutation(MagicMock(), uid, mutation, eid, 1)
        mock_store.create_meal_log.assert_called_once()
        call_args = mock_store.create_meal_log.call_args
        assert call_args.args[1] == uid
        assert call_args.kwargs["meal_log_id"] == eid
        assert call_args.kwargs["version"] == 1

    @patch("app.routers.sync_dispatch.tracking_store_meals")
    def test_payload_validated_as_create_request(self, mock_store):
        """The payload dict is validated through MealLogCreateRequest.model_validate."""
        uid = uuid4()
        eid = uuid4()
        mutation = _make_mutation(operation_type="MEAL_CREATE", payload=_MEAL_PAYLOAD)
        _apply_meal_mutation(MagicMock(), uid, mutation, eid, 1)
        create_req = mock_store.create_meal_log.call_args.args[2]
        assert create_req.title == "Lunch"
        assert len(create_req.items) == 1
        assert create_req.items[0].food_slug == "rice"


class TestApplyMealMutationUpdate:
    @patch("app.routers.sync_dispatch.tracking_store_meals")
    def test_calls_update_meal_log(self, mock_store):
        uid = uuid4()
        eid = uuid4()
        mutation = _make_mutation(operation_type="MEAL_UPDATE", payload=_MEAL_UPDATE_PAYLOAD)
        _apply_meal_mutation(MagicMock(), uid, mutation, eid, 2)
        mock_store.update_meal_log.assert_called_once()
        call_args = mock_store.update_meal_log.call_args
        assert call_args.args[1] == uid
        assert call_args.args[2] == eid
        assert call_args.kwargs["version"] == 2

    @patch("app.routers.sync_dispatch.tracking_store_meals")
    def test_payload_validated_as_update_request(self, mock_store):
        uid = uuid4()
        eid = uuid4()
        mutation = _make_mutation(operation_type="MEAL_UPDATE", payload=_MEAL_UPDATE_PAYLOAD)
        _apply_meal_mutation(MagicMock(), uid, mutation, eid, 2)
        update_req = mock_store.update_meal_log.call_args.args[3]
        assert update_req.title == "Dinner"
        assert update_req.note == "updated"


class TestApplyMealMutationDelete:
    @patch("app.routers.sync_dispatch.tracking_store_meals")
    def test_calls_delete_meal_log(self, mock_store):
        uid = uuid4()
        eid = uuid4()
        conn = MagicMock()
        mutation = _make_mutation(operation_type="MEAL_DELETE")
        _apply_meal_mutation(conn, uid, mutation, eid, 3)
        mock_store.delete_meal_log.assert_called_once_with(conn, uid, eid, version=3)


class TestApplyMealMutationUnknownOp:
    def test_raises_on_unknown_operation(self):
        mutation = _make_mutation(operation_type="SYMPTOM_CREATE")
        with pytest.raises(ValueError, match="Unknown meal operation"):
            _apply_meal_mutation(MagicMock(), uuid4(), mutation, uuid4(), 1)


class TestApplyMealMutationCreateValidationError:
    def test_invalid_payload_raises(self):
        """A payload missing required fields should raise a validation error."""
        mutation = _make_mutation(operation_type="MEAL_CREATE", payload={})
        with pytest.raises(Exception):
            _apply_meal_mutation(MagicMock(), uuid4(), mutation, uuid4(), 1)
