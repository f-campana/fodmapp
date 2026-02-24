from __future__ import annotations

import secrets

from fastapi import Request

from app.config import get_settings
from app.errors import not_found, unauthorized


def require_barcode_admin(request: Request) -> None:
    settings = get_settings()
    if not settings.barcode_internal_enabled:
        raise not_found("Resource not found")

    expected = settings.barcode_admin_token
    if not expected:
        raise unauthorized("Barcode admin token is not configured")

    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise unauthorized("Missing bearer token")

    provided = header.removeprefix("Bearer ").strip()
    if not provided or not secrets.compare_digest(provided, expected):
        raise unauthorized("Invalid bearer token")
