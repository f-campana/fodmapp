from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
import psycopg
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.config import get_settings
from app.main import create_app

ISSUER_DOMAIN = "clerk.test.local"
AUTHORIZED_PARTY = "http://localhost:3000"


def _generate_key_pair() -> tuple[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")
    public_pem = (
        private_key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        .decode("utf-8")
    )
    return private_pem, public_pem


def _build_session_token(
    private_key_pem: str,
    *,
    subject: str | None,
    azp: str | None = AUTHORIZED_PARTY,
    issuer_domain: str = ISSUER_DOMAIN,
    expires_in_seconds: int = 300,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "azp": azp,
        "iss": f"https://{issuer_domain}",
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in_seconds)).timestamp()),
    }
    if subject is not None:
        payload["sub"] = subject
    if azp is None:
        payload.pop("azp")
    return jwt.encode(payload, private_key_pem, algorithm="RS256")


@pytest.fixture()
def clerk_auth_env(monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
    private_key, public_key = _generate_key_pair()
    monkeypatch.setenv("CLERK_JWT_KEY", public_key)
    monkeypatch.setenv("CLERK_JWT_ISSUER_DOMAIN", ISSUER_DOMAIN)
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", AUTHORIZED_PARTY)
    monkeypatch.setenv("API_ALLOW_PREVIEW_USER_ID_HEADER", "false")
    return {
        "private_key": private_key,
        "public_key": public_key,
    }


def _fetch_identity_user_id(db_url: str, subject: str) -> UUID | None:
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        row = conn.execute(
            "SELECT user_id FROM me_auth_identities WHERE auth_subject = %(subject)s",
            {"subject": subject},
        ).fetchone()
        return row["user_id"] if row else None


def _cleanup_identity(db_url: str, user_id: UUID | None, subject: str) -> None:
    with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
        if user_id is not None:
            conn.execute(
                "DELETE FROM me_device_signing_keys WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            )
            conn.execute(
                "DELETE FROM me_mutation_queue WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            )
            conn.execute(
                "DELETE FROM me_entity_versions WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            )
            conn.execute(
                "DELETE FROM me_export_jobs WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            )
            conn.execute(
                "DELETE FROM me_delete_jobs WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            )
            conn.execute("DELETE FROM symptom_logs WHERE user_id = %(user_id)s", {"user_id": user_id})
            conn.execute(
                (
                    "DELETE FROM meal_log_items WHERE meal_log_id IN ("
                    "SELECT meal_log_id FROM meal_logs WHERE user_id = %(user_id)s)"
                ),
                {"user_id": user_id},
            )
            conn.execute("DELETE FROM meal_logs WHERE user_id = %(user_id)s", {"user_id": user_id})
            conn.execute("DELETE FROM custom_foods WHERE user_id = %(user_id)s", {"user_id": user_id})
            conn.execute(
                (
                    "DELETE FROM saved_meal_items WHERE saved_meal_id IN ("
                    "SELECT saved_meal_id FROM saved_meals WHERE user_id = %(user_id)s)"
                ),
                {"user_id": user_id},
            )
            conn.execute("DELETE FROM saved_meals WHERE user_id = %(user_id)s", {"user_id": user_id})
            conn.execute(
                (
                    "DELETE FROM user_consent_ledger_events WHERE consent_id IN ("
                    "SELECT consent_id FROM user_consent_ledger WHERE user_id = %(user_id)s)"
                ),
                {"user_id": user_id},
            )
            conn.execute("DELETE FROM user_consent_ledger WHERE user_id = %(user_id)s", {"user_id": user_id})
        conn.execute("DELETE FROM me_auth_identities WHERE auth_subject = %(subject)s", {"subject": subject})


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_protected_me_routes_require_bearer_when_preview_fallback_disabled(client, clerk_auth_env):
    response = client.get("/v0/me/consent")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_valid_bearer_token_provisions_and_reuses_identity(client, db_url, clerk_auth_env):
    subject = "user_test_auth_subject_reuse"
    token = _build_session_token(clerk_auth_env["private_key"], subject=subject)

    try:
        first = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})
        assert first.status_code in {200, 404}

        first_user_id = _fetch_identity_user_id(db_url, subject)
        assert first_user_id is not None

        second = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})
        assert second.status_code in {200, 404}

        second_user_id = _fetch_identity_user_id(db_url, subject)
        assert second_user_id == first_user_id
    finally:
        _cleanup_identity(db_url, _fetch_identity_user_id(db_url, subject), subject)


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_valid_bearer_token_without_azp_is_accepted(client, db_url, clerk_auth_env):
    subject = "user_test_auth_subject_no_azp"
    token = _build_session_token(clerk_auth_env["private_key"], subject=subject, azp=None)

    try:
        response = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code in {200, 404}

        user_id = _fetch_identity_user_id(db_url, subject)
        assert user_id is not None
    finally:
        _cleanup_identity(db_url, _fetch_identity_user_id(db_url, subject), subject)


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_invalid_authorized_party_is_rejected(client, clerk_auth_env):
    token = _build_session_token(
        clerk_auth_env["private_key"],
        subject="user_test_auth_subject_bad_azp",
        azp="http://malicious.localhost",
    )

    response = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_missing_subject_is_rejected(client, clerk_auth_env):
    token = _build_session_token(
        clerk_auth_env["private_key"],
        subject=None,
    )

    response = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_expired_bearer_token_is_rejected(client, clerk_auth_env):
    token = _build_session_token(
        clerk_auth_env["private_key"],
        subject="user_test_auth_subject_expired",
        expires_in_seconds=-1,
    )

    response = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_invalid_bearer_issuer_is_rejected(client, clerk_auth_env):
    token = _build_session_token(
        clerk_auth_env["private_key"],
        subject="user_test_auth_subject_bad_issuer",
        issuer_domain="clerk.other.local",
    )

    response = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_invalid_bearer_signature_is_rejected(client, clerk_auth_env):
    other_private_key, _ = _generate_key_pair()
    token = _build_session_token(other_private_key, subject="user_test_auth_subject_bad_sig")

    response = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_debug_claim_logging_emits_safe_claim_shape(client, clerk_auth_env, monkeypatch, caplog):
    monkeypatch.setenv("API_DEBUG_CLERK_CLAIMS", "true")
    token = _build_session_token(clerk_auth_env["private_key"], subject="user_test_auth_subject_debug", azp=None)

    with caplog.at_level("INFO", logger="app.auth"):
        response = client.get("/v0/me/consent", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code in {200, 404}
    assert "Clerk claim debug:" in caplog.text
    assert "azp=None" in caplog.text
    assert token not in caplog.text


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_preview_user_id_header_requires_explicit_non_production_flag(client, monkeypatch):
    preview_user_id = "11111111-1111-4111-8111-111111111111"

    consent_payload = {
        "action": "grant",
        "scope": {
            "symptom_logs": True,
            "diet_logs": True,
            "sync_mutations": True,
        },
        "policy_version": "gdpr-v1",
        "method": "in_app_sheet",
        "source": "mobile_app",
        "source_ref": "web_scaffold",
        "language": "fr",
        "reason": None,
        "signature": None,
        "public_key_id": None,
        "signature_payload": None,
    }

    monkeypatch.setenv("NODE_ENV", "development")
    monkeypatch.setenv("API_ALLOW_PREVIEW_USER_ID_HEADER", "false")
    get_settings.cache_clear()
    denied = client.post("/v0/me/consent", headers={"X-User-Id": preview_user_id}, json=consent_payload)
    assert denied.status_code == 401
    assert denied.json()["error"]["code"] == "unauthorized"

    monkeypatch.setenv("API_ALLOW_PREVIEW_USER_ID_HEADER", "true")
    get_settings.cache_clear()
    allowed = client.post("/v0/me/consent", headers={"X-User-Id": preview_user_id}, json=consent_payload)
    assert allowed.status_code == 200

    monkeypatch.setenv("NODE_ENV", "production")
    get_settings.cache_clear()
    production = client.post(
        "/v0/me/consent",
        headers={"X-User-Id": preview_user_id},
        json=consent_payload,
    )
    assert production.status_code == 401
    assert production.json()["error"]["code"] == "unauthorized"


def test_cors_preflight_allows_authorized_party_origin(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", AUTHORIZED_PARTY)
    monkeypatch.delenv("API_CORS_ALLOW_ORIGINS", raising=False)
    get_settings.cache_clear()

    with TestClient(create_app()) as local_client:
        response = local_client.options(
            "/v0/me/consent",
            headers={
                "Origin": AUTHORIZED_PARTY,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == AUTHORIZED_PARTY
    get_settings.cache_clear()


def test_cors_preflight_allows_explicit_preview_origin(monkeypatch: pytest.MonkeyPatch):
    preview_origin = "http://127.0.0.1:3000"
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", AUTHORIZED_PARTY)
    monkeypatch.setenv("API_CORS_ALLOW_ORIGINS", preview_origin)
    get_settings.cache_clear()

    with TestClient(create_app()) as local_client:
        response = local_client.options(
            "/v0/me/consent",
            headers={
                "Origin": preview_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "x-user-id,content-type",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == preview_origin
    get_settings.cache_clear()


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_deleted_account_remains_locked_for_bearer_auth_tracking_writes(client, db_url, clerk_auth_env):
    subject = "user_test_auth_subject_delete"
    token = _build_session_token(clerk_auth_env["private_key"], subject=subject)
    headers = {"Authorization": f"Bearer {token}"}

    try:
        grant_response = client.post(
            "/v0/me/consent",
            headers=headers,
            json={
                "action": "grant",
                "scope": {
                    "symptom_logs": True,
                    "diet_logs": True,
                    "sync_mutations": True,
                },
                "policy_version": "gdpr-v1",
                "method": "in_app_sheet",
                "source": "mobile_app",
                "source_ref": "web_scaffold",
                "language": "fr",
                "reason": None,
                "signature": None,
                "public_key_id": None,
                "signature_payload": None,
            },
        )
        assert grant_response.status_code == 200

        delete_request = client.post(
            "/v0/me/delete",
            headers=headers,
            json={
                "scope": "all",
                "soft_delete_window_days": 0,
                "hard_delete": True,
                "confirm_text": "SUPPRIMER MES DONNÉES",
                "reason": "user_request",
                "idempotency_key": None,
            },
        )
        assert delete_request.status_code == 202

        symptom_response = client.post(
            "/v0/me/tracking/symptoms",
            headers=headers,
            json={
                "symptom_type": "bloating",
                "severity": 4,
                "noted_at_utc": "2026-03-21T10:00:00Z",
                "note": None,
            },
        )
        assert symptom_response.status_code == 423
        assert symptom_response.json()["error"]["code"] == "locked"
    finally:
        _cleanup_identity(db_url, _fetch_identity_user_id(db_url, subject), subject)


@pytest.mark.usefixtures("me_security_schema", "tracking_schema")
def test_bearer_auth_allows_sync_batch_without_request_user_id(client, db_url, clerk_auth_env):
    subject = "user_test_auth_subject_sync"
    token = _build_session_token(clerk_auth_env["private_key"], subject=subject)

    response = client.post(
        "/v0/sync/mutations:batch",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "schema_version": 1,
            "batch_id": "batch-auth-test",
            "client_device_id": "device-auth-test",
            "sync_session_id": "sync-session-auth-test",
            "client_time_utc": datetime.now(timezone.utc).isoformat(),
            "items": [
                {
                    "operation_type": "DELETE_ACCOUNT",
                    "client_created_at": datetime.now(timezone.utc).isoformat(),
                    "payload": {},
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["items"][0]["result_code"] == "INVALID_PAYLOAD"
    assert _fetch_identity_user_id(db_url, subject) is not None
