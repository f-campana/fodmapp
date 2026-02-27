from __future__ import annotations

import base64
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import pytest
from psycopg import connect
from psycopg.rows import dict_row

from app.consent_chain import proof_secret
from app.crypto_utils import canonical_json, hmac_signature, sha256_hex

pytestmark = pytest.mark.integration


def _secret_b64(seed: str) -> str:
    return base64.urlsafe_b64encode(seed.encode("utf-8")).decode("ascii")


def _sign_mutation(secret_b64: str, envelope: dict[str, Any]) -> str:
    payload_for_sig = dict(envelope)
    payload_for_sig.pop("signature")
    if isinstance(payload_for_sig.get("created_at_utc"), str):
        payload_for_sig["created_at_utc"] = payload_for_sig["created_at_utc"]
    else:
        payload_for_sig["created_at_utc"] = payload_for_sig["created_at_utc"].isoformat()
    payload_for_sig = {key: value for key, value in payload_for_sig.items() if value is not None}
    return hmac_signature(secret_b64, canonical_json(payload_for_sig))


def _proof_signature(payload: dict[str, Any]) -> str:
    return hmac_signature(proof_secret(), canonical_json(payload))


def _execute_committed(db_url: str, query: str, params: dict[str, Any] | None = None) -> None:
    with connect(db_url, row_factory=dict_row) as writer:
        with writer.transaction():
            writer.execute(query, params or {})


def _assert_export_proof(user_id: uuid.UUID, export_id: uuid.UUID, payload: dict[str, Any]) -> None:
    proof = payload["proof"]
    assert proof is not None
    manifest = payload["manifest"]
    expected_manifest_hash = sha256_hex(canonical_json(manifest))
    assert proof["manifest_hash"] == expected_manifest_hash

    signature_payload = {
        "scope": "export",
        "export_id": str(export_id),
        "user_id": str(user_id),
        "receipt_id": str(proof["receipt_id"]),
        "manifest_hash": expected_manifest_hash,
        "issued_at_utc": proof["issued_at_utc"],
        "actor": proof["actor"],
    }
    assert proof["proof_signature"] == _proof_signature(signature_payload)


def _assert_delete_proof(user_id: uuid.UUID, delete_request_id: uuid.UUID, payload: dict[str, Any]) -> None:
    proof = payload["proof"]
    assert proof is not None
    summary = payload["summary"]
    manifest_payload = {
        "scope": "delete",
        "delete_request_id": str(delete_request_id),
        "user_id": str(user_id),
        "consent_records_touched": summary["consent_records_touched"],
        "queue_items_dropped": summary["queue_items_dropped"],
        "symptom_logs_deleted": summary["symptom_logs_deleted"],
        "diet_logs_deleted": summary["diet_logs_deleted"],
        "swap_history_deleted": summary["swap_history_deleted"],
        "exports_invalidated": summary["exports_invalidated"],
        "issued_at_utc": proof["issued_at_utc"],
        "actor": proof["actor"],
    }
    assert proof["manifest_hash"] == sha256_hex(canonical_json(manifest_payload))
    assert proof["proof_signature"] == _proof_signature(manifest_payload)


def _cleanup_account(db_url: str, user_id: uuid.UUID) -> None:
    with connect(db_url, row_factory=dict_row) as writer:
        with writer.transaction():
            writer.execute("DELETE FROM me_mutation_queue WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute("DELETE FROM me_entity_versions WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute("DELETE FROM me_device_signing_keys WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute("DELETE FROM me_export_jobs WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute("DELETE FROM me_delete_jobs WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute(
                """
                DELETE FROM user_consent_ledger_events
                WHERE consent_id IN (
                    SELECT consent_id
                    FROM user_consent_ledger
                    WHERE user_id = %(user_id)s
                )
                """,
                {"user_id": user_id},
            )
            writer.execute("DELETE FROM user_consent_ledger WHERE user_id = %(user_id)s", {"user_id": user_id})


def _grant_consent(client, user_id: uuid.UUID, scope: dict[str, bool] | None = None) -> None:
    scope = scope or {
        "sync_mutations": True,
        "analytics": True,
        "profile": True,
        "symptoms": True,
        "diet_logs": True,
    }
    response = client.post(
        "/v0/me/consent",
        headers={"X-User-Id": str(user_id)},
        json={
            "policy_version": "gdpr-v2.1.0",
            "action": "grant",
            "scope": scope,
            "legal_basis": "consent",
            "method": "in_app_sheet",
            "source": "mobile_app",
            "language": "fr-FR",
            "reason": "initial",
        },
    )
    assert response.status_code == 200


def _insert_device_key(
    db_url: str,
    user_id: uuid.UUID,
    device_id: str = "test-device",
    key_id: str = "k1",
    secret_seed: str = "queue-signing-secret",
) -> str:
    secret_b64 = _secret_b64(secret_seed)
    with connect(db_url, row_factory=dict_row) as writer:
        with writer.transaction():
            writer.execute(
                """
                INSERT INTO me_device_signing_keys (
                    user_id, device_id, key_id, secret_b64, algorithm, status, valid_until
                )
                VALUES (%(user_id)s, %(device_id)s, %(key_id)s, %(secret_b64)s, 'hmac-sha256', 'active', NULL)
                ON CONFLICT (device_id, key_id)
                DO UPDATE SET
                  secret_b64 = EXCLUDED.secret_b64,
                  user_id = EXCLUDED.user_id,
                  status = 'active',
                  revoked_at = NULL,
                  valid_until = NULL
                """,
                {
                    "user_id": user_id,
                    "device_id": device_id,
                    "key_id": key_id,
                    "secret_b64": secret_b64,
                },
            )
    return secret_b64


def test_consent_grant_revoke_with_history(client, db_url) -> None:
    user_id = uuid.uuid4()
    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            response = client.post(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
                json={
                    "policy_version": "gdpr-v2.1.0",
                    "action": "grant",
                    "scope": {
                        "sync_mutations": True,
                        "analytics": True,
                    },
                    "legal_basis": "consent",
                    "method": "in_app_sheet",
                    "source": "mobile_app",
                    "language": "fr-FR",
                    "reason": "initial",
                },
            )
            assert response.status_code == 200
            grant_payload = response.json()
            grant_id = grant_payload["consent_id"]
            assert grant_payload["status"] == "active"
            assert grant_payload["history"]

            response = client.post(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
                json={
                    "policy_version": "gdpr-v2.1.0",
                    "action": "revoke",
                    "scope": {
                        "sync_mutations": True,
                        "analytics": False,
                    },
                    "reason": "cleanup",
                    "language": "fr-FR",
                },
            )
            assert response.status_code == 200
            revoke_payload = response.json()
            assert revoke_payload["status"] == "revoked"
            assert revoke_payload["previous_consent_id"] == grant_id
            assert revoke_payload["evidence_hash"]

            response = client.get(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
            )
            assert response.status_code == 200
            payload = response.json()
            assert payload["consent_state"]["status"] == "revoked"
            assert payload["consent_state"]["revocation_reason"] == "cleanup"
            assert payload["consent_state"]["scope"]["sync_mutations"] is True
            assert payload["history"][0]["event"] == "consent_revoke"

            records = db_conn.execute(
                """
                SELECT consent_id, status, parent_consent_id, replaced_by_consent_id
                FROM user_consent_ledger
                WHERE user_id = %(user_id)s
                ORDER BY granted_at_utc DESC
                """,
                {"user_id": user_id},
            ).fetchall()
            assert len(records) == 1
            assert records[0]["status"] == "revoked"
            assert records[0]["parent_consent_id"] is None
            assert records[0]["replaced_by_consent_id"] is None

            event_count = db_conn.execute(
                "SELECT COUNT(*) AS n FROM user_consent_ledger_events WHERE consent_id = %(consent_id)s",
                {"consent_id": records[0]["consent_id"]},
            ).fetchone()["n"]
            assert event_count >= 1

            _cleanup_account(db_url, user_id)


def test_consent_chain_integrity_is_enforced(client, db_url) -> None:
    user_id = uuid.uuid4()
    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_consent(client, user_id)

            revoke_resp = client.post(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
                json={
                    "policy_version": "gdpr-v2.1.0",
                    "action": "revoke",
                    "scope": {"sync_mutations": True},
                    "reason": "rotation",
                    "language": "fr-FR",
                },
            )
            assert revoke_resp.status_code == 200

            event = db_conn.execute(
                """
                SELECT e.event_id, e.event_hash
                FROM user_consent_ledger l
                JOIN user_consent_ledger_events e ON e.consent_id = l.consent_id
                WHERE l.user_id = %(user_id)s
                ORDER BY e.at_utc DESC
                LIMIT 1
                """,
                {"user_id": user_id},
            ).fetchone()
            assert event is not None

            _execute_committed(
                db_url,
                """
                UPDATE user_consent_ledger_events
                SET event_hash = 'tampered'
                WHERE event_id = %(event_id)s
                """,
                {"event_id": event["event_id"]},
            )

            check = client.get("/v0/me/consent", headers={"X-User-Id": str(user_id)})
            assert check.status_code == 409

            _cleanup_account(db_url, user_id)
            _grant_consent(client, user_id)

            response = client.post(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
                json={
                    "policy_version": "gdpr-v2.1.0",
                    "action": "revoke",
                    "scope": {
                        "sync_mutations": True,
                        "analytics": False,
                    },
                    "reason": "user_request",
                },
            )
            assert response.status_code == 200

            response = client.get("/v0/me/consent", headers={"X-User-Id": str(user_id)})
            assert response.status_code == 200
            payload = response.json()
            assert payload["consent_state"]["status"] == "revoked"
            assert payload["consent_state"]["active"] is False
            assert payload["consent_state"]["revocation_reason"] == "user_request"

            records = db_conn.execute(
                """
                SELECT consent_id, status
                FROM user_consent_ledger
                WHERE user_id = %(user_id)s
                ORDER BY granted_at_utc DESC
                """,
                {"user_id": user_id},
            ).fetchall()
            assert len(records) >= 1
            assert records[0]["status"] == "revoked"

            event_count = db_conn.execute(
                "SELECT COUNT(*) AS n FROM user_consent_ledger_events WHERE consent_id = %(consent_id)s",
                {"consent_id": records[0]["consent_id"]},
            ).fetchone()["n"]
            assert event_count >= 1
            events = db_conn.execute(
                """
                SELECT event_type, reason
                FROM user_consent_ledger_events
                WHERE consent_id = %(consent_id)s
                ORDER BY at_utc DESC
                """,
                {"consent_id": records[0]["consent_id"]},
            ).fetchall()
            assert events[0]["event_type"] == "consent_revoke"
            assert events[0]["reason"] == "user_request"

            _cleanup_account(db_url, user_id)


def test_consent_request_strict_validation(client, db_url) -> None:
    user_id = uuid.uuid4()
    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)

            base_payload = {
                "policy_version": "gdpr-v2.1.0",
                "action": "grant",
                "scope": {"sync_mutations": True, "analytics": True},
                "language": "fr-FR",
            }

            invalid_method = client.post(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
                json={**base_payload, "method": "api"},
            )
            assert invalid_method.status_code == 422

            invalid_source = client.post(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
                json={**base_payload, "source": "cli_tool"},
            )
            assert invalid_source.status_code == 422

            invalid_legal_basis = client.post(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
                json={**base_payload, "legal_basis": "unknown_basis"},
            )
            assert invalid_legal_basis.status_code == 422

            _cleanup_account(db_url, user_id)


def _build_mutation_payload(
    *,
    user_id: uuid.UUID,
    device_id: str,
    key_id: str,
    queue_item_id: str,
    idempotency_key: str,
    client_seq: int,
    base_version: int | None = 0,
    payload_extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload = {
        "queue_item_id": queue_item_id,
        "idempotency_key": idempotency_key,
        "device_id": device_id,
        "app_install_id": "install-v2",
        "op": "create_symptom_log",
        "entity_type": "symptom_log",
        "entity_id": str(uuid.uuid4()),
        "client_seq": client_seq,
        "base_version": base_version,
        "attempt": 1,
        "ttl_seconds": 172800,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "payload": payload_extra or {"symptom": "bloating"},
        "aad": {"language": "fr-FR", "user_id": str(user_id)},
        "signature": "",
        "signature_kid": key_id,
        "signature_algorithm": "hmac-sha256",
    }
    return payload


def test_sync_replay_idempotency_and_tamper_reject(client, db_url) -> None:
    user_id = uuid.uuid4()
    device_id = "test-device-sync"
    key_id = "k1"

    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_consent(client, user_id)
            secret = _insert_device_key(db_url, user_id, device_id=device_id, key_id=key_id)

            payload = _build_mutation_payload(
                user_id=user_id,
                device_id=device_id,
                key_id=key_id,
                queue_item_id=str(uuid.uuid4()),
                idempotency_key=str(uuid.uuid4()),
                client_seq=1,
            )
            payload["signature"] = _sign_mutation(secret, payload)

            response = client.post(
                "/v0/sync/mutations",
                headers={"X-User-Id": str(user_id), "X-Device-Id": device_id},
                json={"items": [payload]},
            )
            assert response.status_code == 200
            assert response.headers.get("Deprecation") == "true"
            warning_header = response.headers.get("Warning") or ""
            assert "/v0/sync/mutations is deprecated" in warning_header
            assert "/v0/sync/mutations:batch" in (response.headers.get("Link") or "")
            assert response.headers.get("X-API-Compatibility-Mode") == "legacy_migration_route"
            first = response.json()
            assert first["accepted"] == 1
            assert first["results"][0]["status"] == "accepted"
            version_row = db_conn.execute(
                """
                SELECT current_version
                FROM me_entity_versions
                WHERE user_id = %(user_id)s
                  AND entity_type = %(entity_type)s
                  AND entity_id = %(entity_id)s
                """,
                {
                    "user_id": user_id,
                    "entity_type": payload["entity_type"],
                    "entity_id": payload["entity_id"],
                },
            ).fetchone()
            assert version_row is not None
            first_version = int(version_row["current_version"])

            response = client.post(
                "/v0/sync/mutations",
                headers={"X-User-Id": str(user_id), "X-Device-Id": device_id},
                json={"items": [payload]},
            )
            assert response.status_code == 200
            second = response.json()
            assert second["duplicates"] == 1
            assert second["results"][0]["status"] == "duplicate"
            second_version = db_conn.execute(
                """
                SELECT current_version
                FROM me_entity_versions
                WHERE user_id = %(user_id)s
                  AND entity_type = %(entity_type)s
                  AND entity_id = %(entity_id)s
                """,
                {
                    "user_id": user_id,
                    "entity_type": payload["entity_type"],
                    "entity_id": payload["entity_id"],
                },
            ).fetchone()
            assert second_version is not None
            assert int(second_version["current_version"]) == first_version

            collision = dict(payload)
            collision["payload"] = {"symptom": "other"}
            collision["signature"] = _sign_mutation(secret, collision)
            collision["idempotency_key"] = payload["idempotency_key"]

            response = client.post(
                "/v0/sync/mutations",
                headers={"X-User-Id": str(user_id), "X-Device-Id": device_id},
                json={"items": [collision]},
            )
            assert response.status_code == 200
            third = response.json()
            assert third["results"][0]["status"] == "conflict"

            queued_rows = db_conn.execute(
                "SELECT COUNT(*) AS count FROM me_mutation_queue WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            ).fetchone()["count"]
            assert queued_rows == 1
            queue_row = db_conn.execute(
                """
                SELECT chain_prev_hash, chain_item_hash
                FROM me_mutation_queue
                WHERE user_id = %(user_id)s
                  AND idempotency_key = %(idempotency_key)s
                """,
                {"user_id": user_id, "idempotency_key": payload["idempotency_key"]},
            ).fetchone()
            assert queue_row is not None
            assert queue_row["chain_prev_hash"] is None
            assert queue_row["chain_item_hash"] is not None
            third_version = db_conn.execute(
                """
                SELECT current_version
                FROM me_entity_versions
                WHERE user_id = %(user_id)s
                  AND entity_type = %(entity_type)s
                  AND entity_id = %(entity_id)s
                """,
                {
                    "user_id": user_id,
                    "entity_type": payload["entity_type"],
                    "entity_id": payload["entity_id"],
                },
            ).fetchone()
            assert third_version is not None
            assert int(third_version["current_version"]) == first_version

            _execute_committed(
                db_url,
                """
                UPDATE me_mutation_queue
                SET replay_window_expires_at = NOW() - INTERVAL '1 second'
                WHERE user_id = %(user_id)s
                  AND idempotency_key = %(idempotency_key)s
                """,
                {"user_id": user_id, "idempotency_key": payload["idempotency_key"]},
            )
            stale_replay = client.post(
                "/v0/sync/mutations",
                headers={"X-User-Id": str(user_id), "X-Device-Id": device_id},
                json={"items": [payload]},
            )
            assert stale_replay.status_code == 200
            stale_payload = stale_replay.json()
            assert stale_payload["results"][0]["status"] == "duplicate"
            queued_rows_after_stale = db_conn.execute(
                "SELECT COUNT(*) AS count FROM me_mutation_queue WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            ).fetchone()["count"]
            assert queued_rows_after_stale == 1
            stale_version = db_conn.execute(
                """
                SELECT current_version
                FROM me_entity_versions
                WHERE user_id = %(user_id)s
                  AND entity_type = %(entity_type)s
                  AND entity_id = %(entity_id)s
                """,
                {
                    "user_id": user_id,
                    "entity_type": payload["entity_type"],
                    "entity_id": payload["entity_id"],
                },
            ).fetchone()
            assert stale_version is not None
            assert int(stale_version["current_version"]) == first_version

            _cleanup_account(db_url, user_id)


def _wait_for_export_completed(client, user_id: uuid.UUID, export_id: str) -> dict[str, Any]:
    for _ in range(3):
        response = client.get(f"/v0/me/export/{export_id}", headers={"X-User-Id": str(user_id)})
        assert response.status_code == 200
        payload = response.json()
        if payload["status"] in {"ready", "ready_with_redactions", "failed", "completed"}:
            return payload
        time.sleep(0.2)
    return payload


def test_export_delete_async_lifecycle_and_sync_reject(client, db_url) -> None:
    user_id = uuid.uuid4()
    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_consent(client, user_id, scope={"sync_mutations": True, "analytics": True})

            export_resp = client.post(
                "/v0/me/export",
                headers={"X-User-Id": str(user_id)},
                json={
                    "format": "json",
                    "include": ["consent", "symptoms"],
                    "anonymize": True,
                    "idempotency_key": str(uuid.uuid4()),
                },
            )
            assert export_resp.status_code == 202
            export_payload = export_resp.json()
            export_id = export_payload["export_id"]

            polled_export = _wait_for_export_completed(client, user_id, export_id)
            assert polled_export["status"] in {"ready", "ready_with_redactions"}
            _assert_export_proof(user_id, uuid.UUID(str(export_id)), polled_export)

            delete_resp = client.post(
                "/v0/me/delete",
                headers={"X-User-Id": str(user_id)},
                json={
                    "scope": "all",
                    "confirm_text": "SUPPRIMER MES DONNÉES",
                    "soft_delete_window_days": 0,
                    "hard_delete": True,
                    "reason": "user_request",
                    "idempotency_key": str(uuid.uuid4()),
                },
            )
            assert delete_resp.status_code == 202
            delete_payload = delete_resp.json()
            delete_request_id = delete_payload["delete_request_id"]

            poll_resp = client.get(f"/v0/me/delete/{delete_request_id}", headers={"X-User-Id": str(user_id)})
            assert poll_resp.status_code == 200
            poll_payload = poll_resp.json()
            assert poll_payload["status"] in {"completed", "failed", "partial", "processing"}
            _assert_delete_proof(user_id, uuid.UUID(delete_request_id), poll_payload)

            export_after_delete = client.get(f"/v0/me/export/{export_id}", headers={"X-User-Id": str(user_id)})
            assert export_after_delete.status_code == 200
            export_after_payload = export_after_delete.json()
            assert export_after_payload["status"] == "failed"
            assert export_after_payload["failure"] is not None
            assert export_after_payload["failure"]["code"] == "deleted_by_user_request"

            sync_payload = _build_mutation_payload(
                user_id=user_id,
                device_id="test-device-sync-delete",
                key_id="k1",
                queue_item_id=str(uuid.uuid4()),
                idempotency_key=str(uuid.uuid4()),
                client_seq=1,
            )
            sync_response = client.post(
                "/v0/sync/mutations",
                headers={"X-User-Id": str(user_id), "X-Device-Id": "test-device-sync-delete"},
                json={"items": [sync_payload]},
            )
            assert sync_response.status_code == 423

            _cleanup_account(db_url, user_id)


def test_purge_proof_and_negative_queries_after_delete(client, db_url) -> None:
    user_id = uuid.uuid4()
    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_consent(client, user_id)
            secret = _insert_device_key(db_url, user_id, device_id="proof-device", key_id="k1")

            export_resp = client.post(
                "/v0/me/export",
                headers={"X-User-Id": str(user_id)},
                json={
                    "format": "json",
                    "include": ["consent", "symptoms"],
                    "anonymize": True,
                    "idempotency_key": str(uuid.uuid4()),
                },
            )
            assert export_resp.status_code == 202
            export_id = export_resp.json()["export_id"]
            polled_export = _wait_for_export_completed(client, user_id, export_id)
            assert polled_export["status"] in {"ready", "ready_with_redactions"}
            _assert_export_proof(user_id, uuid.UUID(str(export_id)), polled_export)

            mutation = _build_mutation_payload(
                user_id=user_id,
                device_id="proof-device",
                key_id="k1",
                queue_item_id=str(uuid.uuid4()),
                idempotency_key=str(uuid.uuid4()),
                client_seq=1,
            )
            mutation["signature"] = _sign_mutation(secret, mutation)
            sync_resp = client.post(
                "/v0/sync/mutations",
                headers={"X-User-Id": str(user_id), "X-Device-Id": "proof-device"},
                json={"items": [mutation]},
            )
            assert sync_resp.status_code == 200

            delete_resp = client.post(
                "/v0/me/delete",
                headers={"X-User-Id": str(user_id)},
                json={
                    "scope": "all",
                    "confirm_text": "SUPPRIMER MES DONNÉES",
                    "hard_delete": True,
                    "reason": "user_request",
                    "idempotency_key": str(uuid.uuid4()),
                },
            )
            assert delete_resp.status_code == 202
            delete_id = delete_resp.json()["delete_request_id"]

            poll_resp = client.get(f"/v0/me/delete/{delete_id}", headers={"X-User-Id": str(user_id)})
            assert poll_resp.status_code == 200
            poll_payload = poll_resp.json()
            assert poll_payload["proof"] is not None
            assert poll_payload["status"] in {"completed", "partial", "failed"}
            _assert_delete_proof(user_id, uuid.UUID(delete_id), poll_payload)

            export_after_delete = client.get(f"/v0/me/export/{export_id}", headers={"X-User-Id": str(user_id)})
            assert export_after_delete.status_code == 200
            export_after_payload = export_after_delete.json()
            assert export_after_payload["status"] == "failed"
            assert export_after_payload["failure"] is not None
            assert export_after_payload["failure"]["code"] == "deleted_by_user_request"

            queue_count = db_conn.execute(
                "SELECT COUNT(*) AS count FROM me_mutation_queue WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            ).fetchone()["count"]
            assert queue_count == 0

            versions_count = db_conn.execute(
                "SELECT COUNT(*) AS count FROM me_entity_versions WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            ).fetchone()["count"]
            assert versions_count == 0

            keys_count = db_conn.execute(
                "SELECT COUNT(*) AS count FROM me_device_signing_keys WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            ).fetchone()["count"]
            assert keys_count == 0

            consent_status_count = db_conn.execute(
                "SELECT COUNT(*) AS count FROM user_consent_ledger WHERE user_id = %(user_id)s AND status='active'",
                {"user_id": user_id},
            ).fetchone()["count"]
            assert consent_status_count == 0

            consent_check = client.get(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
            )
            assert consent_check.status_code == 404

            sync_check = client.post(
                "/v0/sync/mutations",
                headers={"X-User-Id": str(user_id), "X-Device-Id": "proof-device"},
                json={
                    "items": [
                        _build_mutation_payload(
                            user_id=user_id,
                            device_id="proof-device",
                            key_id="k1",
                            queue_item_id=str(uuid.uuid4()),
                            idempotency_key=str(uuid.uuid4()),
                            client_seq=9,
                            base_version=0,
                        )
                    ]
                },
            )
            assert sync_check.status_code == 423

            _cleanup_account(db_url, user_id)


def test_delete_all_requires_confirmation_text(client, db_url) -> None:
    user_id = uuid.uuid4()
    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_consent(client, user_id)
            bad = client.post(
                "/v0/me/delete",
                headers={"X-User-Id": str(user_id)},
                json={
                    "scope": "all",
                    "confirm_text": "CONFIRM",
                    "hard_delete": True,
                    "idempotency_key": str(uuid.uuid4()),
                },
            )
            assert bad.status_code == 400

            row = db_conn.execute(
                "SELECT COUNT(*) AS count FROM me_delete_jobs WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            ).fetchone()
            assert row["count"] == 0

            _cleanup_account(db_url, user_id)
