"""Focused unit tests for api/app/crypto_utils.py.

Pure-function module — no DB or FastAPI app dependency.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json

import pytest

from app.crypto_utils import canonical_json, hmac_signature, hmac_verify, sha256_hex

# ---------------------------------------------------------------------------
# canonical_json
# ---------------------------------------------------------------------------


class TestCanonicalJson:
    def test_sorts_keys(self):
        assert canonical_json({"b": 1, "a": 2}) == '{"a":2,"b":1}'

    def test_compact_separators(self):
        result = canonical_json({"k": "v"})
        assert " " not in result
        assert result == '{"k":"v"}'

    def test_non_ascii_preserved(self):
        result = canonical_json({"clé": "valeur"})
        assert "clé" in result
        assert "valeur" in result

    def test_nested_structure(self):
        payload = {"z": [3, 1], "a": {"c": True, "b": False}}
        result = canonical_json(payload)
        parsed = json.loads(result)
        assert list(parsed.keys()) == ["a", "z"]
        assert list(parsed["a"].keys()) == ["b", "c"]

    def test_empty_object(self):
        assert canonical_json({}) == "{}"


# ---------------------------------------------------------------------------
# sha256_hex
# ---------------------------------------------------------------------------


class TestSha256Hex:
    def test_known_digest(self):
        # SHA-256 of empty string is well-known
        expected = hashlib.sha256(b"").hexdigest()
        assert sha256_hex("") == expected

    def test_deterministic(self):
        assert sha256_hex("hello") == sha256_hex("hello")

    def test_different_inputs(self):
        assert sha256_hex("a") != sha256_hex("b")

    def test_utf8_encoding(self):
        expected = hashlib.sha256("café".encode("utf-8")).hexdigest()
        assert sha256_hex("café") == expected


# ---------------------------------------------------------------------------
# hmac_signature
# ---------------------------------------------------------------------------

# Fixed test secret: 32 random-looking bytes, base64url-encoded
_TEST_SECRET_RAW = b"0123456789abcdef0123456789abcdef"
_TEST_SECRET_B64 = base64.urlsafe_b64encode(_TEST_SECRET_RAW).decode("ascii").rstrip("=")


class TestHmacSignature:
    def test_returns_base64url_string(self):
        sig = hmac_signature(_TEST_SECRET_B64, "payload")
        # Should be valid base64url (no + or /)
        assert isinstance(sig, str)
        # Decoding should not raise
        base64.urlsafe_b64decode(sig + "====")

    def test_deterministic(self):
        sig1 = hmac_signature(_TEST_SECRET_B64, "data")
        sig2 = hmac_signature(_TEST_SECRET_B64, "data")
        assert sig1 == sig2

    def test_different_payloads_differ(self):
        sig1 = hmac_signature(_TEST_SECRET_B64, "aaa")
        sig2 = hmac_signature(_TEST_SECRET_B64, "bbb")
        assert sig1 != sig2

    def test_matches_manual_computation(self):
        payload = "test-payload"
        expected_raw = hmac.new(_TEST_SECRET_RAW, payload.encode("utf-8"), hashlib.sha256).digest()
        expected = base64.urlsafe_b64encode(expected_raw).decode("ascii")
        assert hmac_signature(_TEST_SECRET_B64, payload) == expected

    def test_unsupported_digest_raises(self):
        with pytest.raises(ValueError, match="unsupported digest"):
            hmac_signature(_TEST_SECRET_B64, "data", digest="md5")


# ---------------------------------------------------------------------------
# hmac_verify
# ---------------------------------------------------------------------------


class TestHmacVerify:
    def test_valid_signature_returns_true(self):
        sig = hmac_signature(_TEST_SECRET_B64, "hello")
        assert hmac_verify(_TEST_SECRET_B64, "hello", sig) is True

    def test_wrong_signature_returns_false(self):
        assert hmac_verify(_TEST_SECRET_B64, "hello", "bad-sig") is False

    def test_wrong_payload_returns_false(self):
        sig = hmac_signature(_TEST_SECRET_B64, "hello")
        assert hmac_verify(_TEST_SECRET_B64, "wrong", sig) is False

    def test_invalid_secret_returns_false(self):
        # Non-ASCII secret triggers UnicodeEncodeError inside hmac_signature,
        # exercising the except branch in hmac_verify.
        assert hmac_verify("clé-secrète", "data", "sig") is False

    def test_empty_signature_returns_false(self):
        assert hmac_verify(_TEST_SECRET_B64, "hello", "") is False
