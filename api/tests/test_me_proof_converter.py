"""Focused unit tests for _proof_to_receipt in routers/me.py.

Pure function that converts a raw proof JSON dict to a Receipt model.
No DB or FastAPI dependency.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.routers.me import _proof_to_receipt

_NOW = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)
_RECEIPT_ID = uuid4()


def _make_proof(**overrides):
    base = {
        "receipt_id": str(_RECEIPT_ID),
        "issued_at_utc": _NOW.isoformat(),
        "actor": "user:abc123",
        "policy_version": "2025-06-01",
        "manifest_hash": "sha256:abcdef1234567890",
        "proof_signature": "sig:xyz",
    }
    base.update(overrides)
    return base


class TestProofToReceipt:
    def test_all_fields_mapped(self):
        raw = _make_proof()
        model = _proof_to_receipt(raw)
        assert model.receipt_id == _RECEIPT_ID
        assert model.issued_at_utc == _NOW
        assert model.actor == "user:abc123"
        assert model.policy_version == "2025-06-01"
        assert model.manifest_hash == "sha256:abcdef1234567890"
        assert model.proof_signature == "sig:xyz"

    def test_receipt_id_string_coerced_to_uuid(self):
        rid = uuid4()
        raw = _make_proof(receipt_id=str(rid))
        model = _proof_to_receipt(raw)
        assert model.receipt_id == rid
        assert isinstance(model.receipt_id, UUID)

    def test_receipt_id_already_uuid(self):
        rid = uuid4()
        raw = _make_proof(receipt_id=rid)
        model = _proof_to_receipt(raw)
        assert model.receipt_id == rid

    def test_policy_version_none(self):
        raw = _make_proof()
        del raw["policy_version"]
        model = _proof_to_receipt(raw)
        assert model.policy_version is None

    def test_proof_signature_none(self):
        raw = _make_proof()
        del raw["proof_signature"]
        model = _proof_to_receipt(raw)
        assert model.proof_signature is None

    def test_issued_at_utc_z_suffix(self):
        raw = _make_proof(issued_at_utc="2025-06-15T12:00:00Z")
        model = _proof_to_receipt(raw)
        assert model.issued_at_utc == _NOW

    def test_issued_at_utc_already_datetime(self):
        raw = _make_proof(issued_at_utc=_NOW)
        model = _proof_to_receipt(raw)
        assert model.issued_at_utc == _NOW

    def test_issued_at_utc_with_offset(self):
        raw = _make_proof(issued_at_utc="2025-06-15T12:00:00+00:00")
        model = _proof_to_receipt(raw)
        assert model.issued_at_utc == _NOW
