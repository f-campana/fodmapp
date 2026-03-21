from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from uuid import UUID, uuid4

import jwt
from fastapi import Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import sql
from app.config import get_settings
from app.db import Database
from app.errors import bad_request, unauthorized

_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class ApiAuthContext:
    user_id: UUID
    auth_provider: str
    auth_subject: str | None
    mode: str


def _get_db(request: Request) -> Database:
    return request.app.state.db


def _normalize_issuer_domain(raw_domain: Optional[str]) -> str | None:
    if raw_domain is None:
        return None
    value = raw_domain.strip()
    if not value:
        return None
    if value.startswith("https://") or value.startswith("http://"):
        return value.rstrip("/")
    return f"https://{value.rstrip('/')}"


def _verify_clerk_session_token(token: str) -> dict[str, object]:
    settings = get_settings()
    if not settings.clerk_jwt_key:
        raise unauthorized("Clerk bearer auth not configured")
    issuer = _normalize_issuer_domain(settings.clerk_jwt_issuer_domain)
    if issuer is None:
        raise unauthorized("Clerk bearer auth not configured")
    if not settings.clerk_authorized_parties:
        raise unauthorized("Clerk bearer auth not configured")

    try:
        claims = jwt.decode(
            token,
            settings.clerk_jwt_key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise unauthorized("Invalid Clerk session token") from exc

    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject.strip():
        raise unauthorized("Invalid Clerk session token subject")

    issued_party = claims.get("azp")
    if not isinstance(issued_party, str) or issued_party not in settings.clerk_authorized_parties:
        raise unauthorized("Invalid Clerk authorized party")

    return claims


def _upsert_clerk_identity(conn, auth_subject: str) -> UUID:
    row = conn.execute(
        sql.SQL_UPSERT_AUTH_IDENTITY,
        {
            "user_id": uuid4(),
            "auth_subject": auth_subject,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not persist auth identity")
    return row["user_id"]


def get_api_auth_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer_scheme),
) -> ApiAuthContext:
    settings = get_settings()
    db = _get_db(request)

    if credentials is not None:
        claims = _verify_clerk_session_token(credentials.credentials)
        auth_subject = str(claims["sub"])
        with db.connection() as conn:
            user_id = _upsert_clerk_identity(conn, auth_subject)
        return ApiAuthContext(
            user_id=user_id,
            auth_provider="clerk",
            auth_subject=auth_subject,
            mode="bearer",
        )

    authorization_header = request.headers.get("Authorization")
    if authorization_header:
        raise unauthorized("Bearer token required")

    if settings.node_env != "production" and settings.api_allow_preview_user_id_header:
        preview_user_id = request.headers.get("X-User-Id")
        if not preview_user_id:
            raise unauthorized("Missing Authorization header")
        try:
            user_id = UUID(preview_user_id)
        except ValueError as exc:
            raise bad_request("Invalid X-User-Id format") from exc
        return ApiAuthContext(
            user_id=user_id,
            auth_provider="preview",
            auth_subject=None,
            mode="preview",
        )

    raise unauthorized("Missing Authorization header")


def require_api_user_id(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer_scheme),
) -> UUID:
    return get_api_auth_context(request, credentials).user_id
