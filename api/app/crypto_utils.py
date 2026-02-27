from __future__ import annotations

import base64
import hashlib
import hmac
import json
from typing import Any


def canonical_json(payload: Any) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def hmac_signature(secret_b64: str, payload: str, digest: str = "sha256") -> str:
    raw_secret = base64.urlsafe_b64decode(secret_b64.encode("ascii") + b"====")
    if digest != "sha256":
        raise ValueError("unsupported digest")

    return base64.urlsafe_b64encode(
        hmac.new(raw_secret, payload.encode("utf-8"), hashlib.sha256).digest(),
    ).decode("ascii")


def hmac_verify(secret_b64: str, payload: str, signature: str) -> bool:
    try:
        expected = hmac_signature(secret_b64, payload)
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False
