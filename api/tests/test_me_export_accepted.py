"""Focused unit tests for _build_export_accepted in routers/me.py.

Pure function that builds an ExportAcceptedResponse with a deterministic
status_uri. No DB or FastAPI dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.routers.me import _build_export_accepted

_NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)
_EXPIRES = datetime(2025, 6, 22, 12, 0, 0, tzinfo=timezone.utc)


class TestBuildExportAccepted:
    def test_all_fields_mapped(self):
        eid = uuid4()
        resp = _build_export_accepted(
            export_id=eid,
            status="accepted",
            requested_at=_NOW,
            expires_at=_EXPIRES,
            idempotency_key="key-1",
        )
        assert resp.export_id == eid
        assert resp.status == "accepted"
        assert resp.requested_at_utc == _NOW
        assert resp.expiry_at_utc == _EXPIRES
        assert resp.idempotency_key == "key-1"

    def test_status_uri_deterministic(self):
        eid = uuid4()
        resp = _build_export_accepted(
            export_id=eid,
            status="accepted",
            requested_at=_NOW,
            expires_at=_EXPIRES,
            idempotency_key="k",
        )
        assert resp.status_uri == f"/v0/me/export/{eid}"

    def test_existing_status_passthrough(self):
        """When returning an existing export, status comes from the DB row."""
        resp = _build_export_accepted(
            export_id=uuid4(),
            status="processing",
            requested_at=_NOW,
            expires_at=_EXPIRES,
            idempotency_key="k",
        )
        assert resp.status == "processing"

    def test_idempotency_key_none(self):
        resp = _build_export_accepted(
            export_id=uuid4(),
            status="accepted",
            requested_at=_NOW,
            expires_at=_EXPIRES,
            idempotency_key=None,
        )
        assert resp.idempotency_key is None

    def test_return_type(self):
        from app.models import ExportAcceptedResponse

        resp = _build_export_accepted(
            export_id=uuid4(),
            status="accepted",
            requested_at=_NOW,
            expires_at=_EXPIRES,
            idempotency_key="k",
        )
        assert isinstance(resp, ExportAcceptedResponse)
