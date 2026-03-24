"""Focused unit tests for _prepare_export_manifest in routers/me.py.

Pure function that builds requested_scope, manifest, and initial
rows_by_domain from an ExportRequest payload. No DB or FastAPI dependency.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.models import ExportRequest
from app.routers.me import _prepare_export_manifest

_EXPORTED_AT = "2025-06-15T12:00:00+00:00"
_FROM = datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
_TO = datetime(2025, 6, 1, 0, 0, 0, tzinfo=timezone.utc)


def _make_payload(**overrides) -> ExportRequest:
    defaults = {
        "format": "json",
        "from_ts_utc": None,
        "to_ts_utc": None,
        "include": ["consent", "symptoms"],
        "anonymize": True,
        "idempotency_key": "idem-1",
    }
    defaults.update(overrides)
    return ExportRequest(**defaults)


class TestPrepareExportManifest:
    def test_requested_scope_fields(self):
        payload = _make_payload(include=["consent", "symptoms"])
        scope, _, _ = _prepare_export_manifest(payload, ["consent", "symptoms"], _EXPORTED_AT)
        assert scope["format"] == "json"
        assert scope["from_ts_utc"] is None
        assert scope["to_ts_utc"] is None
        assert scope["anonymize"] is True
        assert scope["include"] == ["consent", "symptoms"]

    def test_from_to_timestamps_serialized(self):
        payload = _make_payload(from_ts_utc=_FROM, to_ts_utc=_TO)
        scope, _, _ = _prepare_export_manifest(payload, ["consent"], _EXPORTED_AT)
        assert scope["from_ts_utc"] == _FROM.isoformat()
        assert scope["to_ts_utc"] == _TO.isoformat()

    def test_manifest_references_scope(self):
        payload = _make_payload()
        scope, manifest, _ = _prepare_export_manifest(payload, ["consent"], _EXPORTED_AT)
        assert manifest["requested_scope"] is scope

    def test_manifest_exported_at_utc(self):
        payload = _make_payload()
        _, manifest, _ = _prepare_export_manifest(payload, ["consent"], _EXPORTED_AT)
        assert manifest["exported_at_utc"] == _EXPORTED_AT

    def test_manifest_anonymize_passthrough(self):
        payload_true = _make_payload(anonymize=True)
        _, m1, _ = _prepare_export_manifest(payload_true, ["consent"], _EXPORTED_AT)
        assert m1["anonymize"] is True

        payload_false = _make_payload(anonymize=False)
        _, m2, _ = _prepare_export_manifest(payload_false, ["consent"], _EXPORTED_AT)
        assert m2["anonymize"] is False

    def test_rows_by_domain_all_keys_zero(self):
        payload = _make_payload()
        _, _, rows = _prepare_export_manifest(payload, ["consent"], _EXPORTED_AT)
        expected_keys = {"consent", "profile", "symptoms", "diet_logs", "swap_history"}
        assert set(rows.keys()) == expected_keys
        assert all(v == 0 for v in rows.values())

    def test_ndjson_format(self):
        payload = _make_payload(format="ndjson")
        scope, _, _ = _prepare_export_manifest(payload, ["consent"], _EXPORTED_AT)
        assert scope["format"] == "ndjson"

    def test_include_uses_normalized_list(self):
        """The helper uses the pre-normalized include list, not the raw payload."""
        payload = _make_payload(include=["consent", "symptoms", "diet_logs"])
        normalized = ["consent", "symptoms"]
        scope, _, _ = _prepare_export_manifest(payload, normalized, _EXPORTED_AT)
        assert scope["include"] == ["consent", "symptoms"]

    def test_return_types(self):
        payload = _make_payload()
        scope, manifest, rows = _prepare_export_manifest(payload, ["consent"], _EXPORTED_AT)
        assert isinstance(scope, dict)
        assert isinstance(manifest, dict)
        assert isinstance(rows, dict)
