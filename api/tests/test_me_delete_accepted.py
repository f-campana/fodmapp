"""Focused unit tests for _build_delete_accepted in routers/me.py.

Pure function that builds a DeleteAcceptedResponse with deterministic
URIs. No DB or FastAPI dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.routers.me import _build_delete_accepted

_NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)


class TestBuildDeleteAccepted:
    def test_all_fields_mapped(self):
        did = uuid4()
        resp = _build_delete_accepted(
            delete_request_id=did,
            status="accepted",
            requested_at=_NOW,
            scope="all",
            idempotency_key="key-1",
            proof_uri=None,
        )
        assert resp.delete_request_id == did
        assert resp.status == "accepted"
        assert resp.requested_at_utc == _NOW
        assert resp.scope == "all"
        assert resp.idempotency_key == "key-1"
        assert resp.local_effective_ttl_seconds == 60
        assert resp.server_effective_at_utc == _NOW
        assert resp.proof_uri is None

    def test_status_uri_deterministic(self):
        did = uuid4()
        resp = _build_delete_accepted(
            delete_request_id=did,
            status="accepted",
            requested_at=_NOW,
            scope="all",
            idempotency_key="k",
            proof_uri=None,
        )
        assert resp.status_uri == f"/v0/me/delete/{did}"

    def test_proof_uri_passthrough(self):
        did = uuid4()
        proof = f"/v0/me/delete/{did}"
        resp = _build_delete_accepted(
            delete_request_id=did,
            status="completed",
            requested_at=_NOW,
            scope="all",
            idempotency_key="k",
            proof_uri=proof,
        )
        assert resp.proof_uri == proof

    def test_proof_uri_none_when_processing(self):
        resp = _build_delete_accepted(
            delete_request_id=uuid4(),
            status="processing",
            requested_at=_NOW,
            scope="all",
            idempotency_key="k",
            proof_uri=None,
        )
        assert resp.proof_uri is None

    def test_scope_variants(self):
        for scope in ("all", "symptoms_only", "diet_only", "analytics_only"):
            resp = _build_delete_accepted(
                delete_request_id=uuid4(),
                status="accepted",
                requested_at=_NOW,
                scope=scope,
                idempotency_key="k",
                proof_uri=None,
            )
            assert resp.scope == scope

    def test_idempotency_key_none(self):
        resp = _build_delete_accepted(
            delete_request_id=uuid4(),
            status="accepted",
            requested_at=_NOW,
            scope="all",
            idempotency_key=None,
            proof_uri=None,
        )
        assert resp.idempotency_key is None

    def test_return_type(self):
        from app.models import DeleteAcceptedResponse

        resp = _build_delete_accepted(
            delete_request_id=uuid4(),
            status="accepted",
            requested_at=_NOW,
            scope="all",
            idempotency_key="k",
            proof_uri=None,
        )
        assert isinstance(resp, DeleteAcceptedResponse)
