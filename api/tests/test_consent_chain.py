"""Focused unit tests for api/app/consent_chain.py.

Pure-function tests exercise logic directly.  DB-dependent functions use
lightweight mocks for the connection and sql helpers — no real database needed.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.consent_chain import (
    ConsentChainInvalidError,
    build_event_payload,
    compute_event_hash,
    fetch_last_event_hash,
    insert_event,
    proof_payload_signature,
    proof_secret,
    verify_user_consent_chain,
)

# ---------------------------------------------------------------------------
# proof_secret
# ---------------------------------------------------------------------------


class TestProofSecret:
    def test_default_fallback(self, monkeypatch):
        monkeypatch.delenv("ME_PROOF_SECRET", raising=False)
        assert proof_secret() == "YXBpLXByb29mLXNlY3JldA=="

    def test_reads_env(self, monkeypatch):
        monkeypatch.setenv("ME_PROOF_SECRET", "custom-secret-b64")
        assert proof_secret() == "custom-secret-b64"


# ---------------------------------------------------------------------------
# proof_payload_signature / compute_event_hash
# ---------------------------------------------------------------------------


class TestProofPayloadSignature:
    def test_deterministic(self):
        payload = {"a": 1}
        assert proof_payload_signature(payload) == proof_payload_signature(payload)

    def test_different_payloads_differ(self):
        assert proof_payload_signature({"x": 1}) != proof_payload_signature({"x": 2})

    def test_compute_event_hash_is_alias(self):
        payload = {"foo": "bar"}
        assert compute_event_hash(payload) == proof_payload_signature(payload)


# ---------------------------------------------------------------------------
# build_event_payload
# ---------------------------------------------------------------------------

_CONSENT_ID = uuid4()
_ACTOR_ID = uuid4()


class TestBuildEventPayload:
    def test_full_payload(self):
        result = build_event_payload(
            consent_id=_CONSENT_ID,
            event_type="consent_granted",
            actor_type="user",
            actor_id=_ACTOR_ID,
            reason="initial",
            metadata={"scope": "tracking"},
            prev_hash="abc123",
        )
        assert result == {
            "consent_id": str(_CONSENT_ID),
            "event_type": "consent_granted",
            "actor_type": "user",
            "actor_id": str(_ACTOR_ID),
            "reason": "initial",
            "metadata": {"scope": "tracking"},
            "prev_hash": "abc123",
        }

    def test_none_actor_id(self):
        result = build_event_payload(
            consent_id=_CONSENT_ID,
            event_type="revoke",
            actor_type="system",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=None,
        )
        assert result["actor_id"] is None
        assert result["reason"] is None
        assert result["prev_hash"] is None

    def test_string_consent_id(self):
        result = build_event_payload(
            consent_id="raw-string-id",
            event_type="t",
            actor_type="a",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=None,
        )
        assert result["consent_id"] == "raw-string-id"


# ---------------------------------------------------------------------------
# fetch_last_event_hash (DB — mocked)
# ---------------------------------------------------------------------------


class TestFetchLastEventHash:
    def test_returns_hash_when_row_exists(self):
        conn = MagicMock()
        cid = uuid4()
        with patch("app.consent_chain.sql.fetch_one", return_value={"event_hash": "h1"}) as mock:
            result = fetch_last_event_hash(conn, cid)
        assert result == "h1"
        mock.assert_called_once()

    def test_returns_none_when_no_row(self):
        conn = MagicMock()
        with patch("app.consent_chain.sql.fetch_one", return_value=None):
            result = fetch_last_event_hash(conn, uuid4())
        assert result is None


# ---------------------------------------------------------------------------
# insert_event (DB — mocked)
# ---------------------------------------------------------------------------


class TestInsertEvent:
    def test_inserts_and_returns_hash(self):
        conn = MagicMock()
        cid = uuid4()
        aid = uuid4()
        with (
            patch("app.consent_chain.fetch_last_event_hash", return_value=None),
            patch("app.consent_chain.compute_event_hash", return_value="computed-hash"),
        ):
            result = insert_event(
                conn,
                consent_id=cid,
                event_type="consent_granted",
                actor_type="user",
                actor_id=aid,
                reason="test",
                metadata={"k": "v"},
            )
        assert result == "computed-hash"
        conn.execute.assert_called_once()

    def test_chains_prev_hash(self):
        conn = MagicMock()
        cid = uuid4()
        with (
            patch("app.consent_chain.fetch_last_event_hash", return_value="prev-h"),
            patch("app.consent_chain.compute_event_hash", return_value="new-h"),
        ):
            result = insert_event(
                conn,
                consent_id=cid,
                event_type="revoke",
                actor_type="system",
                actor_id=None,
                reason=None,
                metadata={},
            )
        assert result == "new-h"
        call_kwargs = conn.execute.call_args[0][1]
        assert call_kwargs["prev_hash"] == "prev-h"


# ---------------------------------------------------------------------------
# verify_user_consent_chain
# ---------------------------------------------------------------------------


class TestVerifyUserConsentChain:
    def test_empty_chain_returns_none(self):
        conn = MagicMock()
        with patch("app.consent_chain.sql.fetch_all", return_value=[]):
            verify_user_consent_chain(conn, uuid4())  # should not raise

    def test_valid_single_event_chain(self):
        """Build a real single-event chain and verify it passes."""
        cid = uuid4()
        payload = build_event_payload(
            consent_id=cid,
            event_type="consent_granted",
            actor_type="user",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=None,
        )
        event_hash = compute_event_hash(payload)

        row = {
            "consent_id": cid,
            "event_type": "consent_granted",
            "actor_type": "user",
            "actor_id": None,
            "reason": None,
            "metadata_json": {},
            "event_hash": event_hash,
            "prev_hash": None,
        }

        conn = MagicMock()
        with patch("app.consent_chain.sql.fetch_all", return_value=[row]):
            verify_user_consent_chain(conn, uuid4())  # should not raise

    def test_valid_two_event_chain(self):
        """Build a real two-event chain for one consent_id and verify."""
        cid = uuid4()

        # Event 1
        p1 = build_event_payload(
            consent_id=cid,
            event_type="grant",
            actor_type="user",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=None,
        )
        h1 = compute_event_hash(p1)

        # Event 2 — chains from event 1
        p2 = build_event_payload(
            consent_id=cid,
            event_type="revoke",
            actor_type="user",
            actor_id=None,
            reason="changed mind",
            metadata={},
            prev_hash=h1,
        )
        h2 = compute_event_hash(p2)

        rows = [
            {
                "consent_id": cid,
                "event_type": "grant",
                "actor_type": "user",
                "actor_id": None,
                "reason": None,
                "metadata_json": {},
                "event_hash": h1,
                "prev_hash": None,
            },
            {
                "consent_id": cid,
                "event_type": "revoke",
                "actor_type": "user",
                "actor_id": None,
                "reason": "changed mind",
                "metadata_json": {},
                "event_hash": h2,
                "prev_hash": h1,
            },
        ]

        conn = MagicMock()
        with patch("app.consent_chain.sql.fetch_all", return_value=rows):
            verify_user_consent_chain(conn, uuid4())  # should not raise

    def test_tampered_hash_raises(self):
        """Tampered event_hash triggers ConsentChainInvalidError (line 112)."""
        cid = uuid4()
        payload = build_event_payload(
            consent_id=cid,
            event_type="grant",
            actor_type="user",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=None,
        )
        _real_hash = compute_event_hash(payload)

        row = {
            "consent_id": cid,
            "event_type": "grant",
            "actor_type": "user",
            "actor_id": None,
            "reason": None,
            "metadata_json": {},
            "event_hash": "tampered-hash",  # does not match computed hash
            "prev_hash": None,
        }

        conn = MagicMock()
        with patch("app.consent_chain.sql.fetch_all", return_value=[row]):
            with pytest.raises(ConsentChainInvalidError, match="chain invalid"):
                verify_user_consent_chain(conn, uuid4())

    def test_broken_prev_hash_raises(self):
        """Wrong prev_hash in second event triggers ConsentChainInvalidError."""
        cid = uuid4()

        p1 = build_event_payload(
            consent_id=cid,
            event_type="grant",
            actor_type="user",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=None,
        )
        h1 = compute_event_hash(p1)

        # Build event 2 with correct prev_hash for hash computation,
        # but store a wrong prev_hash in the row.
        p2 = build_event_payload(
            consent_id=cid,
            event_type="revoke",
            actor_type="user",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=h1,
        )
        h2 = compute_event_hash(p2)

        rows = [
            {
                "consent_id": cid,
                "event_type": "grant",
                "actor_type": "user",
                "actor_id": None,
                "reason": None,
                "metadata_json": {},
                "event_hash": h1,
                "prev_hash": None,
            },
            {
                "consent_id": cid,
                "event_type": "revoke",
                "actor_type": "user",
                "actor_id": None,
                "reason": None,
                "metadata_json": {},
                "event_hash": h2,
                "prev_hash": "wrong-prev",  # mismatch
            },
        ]

        conn = MagicMock()
        with patch("app.consent_chain.sql.fetch_all", return_value=rows):
            with pytest.raises(ConsentChainInvalidError):
                verify_user_consent_chain(conn, uuid4())

    def test_missing_metadata_json_defaults_to_empty(self):
        """Row with metadata_json=None uses empty dict (line 107 falsy branch)."""
        cid = uuid4()
        payload = build_event_payload(
            consent_id=cid,
            event_type="grant",
            actor_type="user",
            actor_id=None,
            reason=None,
            metadata={},
            prev_hash=None,
        )
        event_hash = compute_event_hash(payload)

        row = {
            "consent_id": cid,
            "event_type": "grant",
            "actor_type": "user",
            "actor_id": None,
            "reason": None,
            "metadata_json": None,
            "event_hash": event_hash,
            "prev_hash": None,
        }

        conn = MagicMock()
        with patch("app.consent_chain.sql.fetch_all", return_value=[row]):
            verify_user_consent_chain(conn, uuid4())  # should not raise
