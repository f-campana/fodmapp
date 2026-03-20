from __future__ import annotations

import base64
import uuid
from datetime import datetime, timezone
from typing import Any

import pytest
from psycopg import connect
from psycopg.rows import dict_row

from app.crypto_utils import canonical_json, hmac_signature, sha256_hex

pytestmark = [pytest.mark.integration, pytest.mark.usefixtures("me_security_schema", "tracking_schema")]


def _seed_secret(seed: str) -> str:
    return base64.urlsafe_b64encode(seed.encode("utf-8")).decode("ascii")


def _cleanup_account(db_url: str, user_id: uuid.UUID) -> None:
    with connect(db_url, row_factory=dict_row) as writer:
        with writer.transaction():
            writer.execute(
                """
                DELETE FROM meal_log_items
                WHERE meal_log_id IN (
                    SELECT meal_log_id FROM meal_logs WHERE user_id = %(user_id)s
                )
                """,
                {"user_id": user_id},
            )
            writer.execute("DELETE FROM meal_logs WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute(
                """
                DELETE FROM saved_meal_items
                WHERE saved_meal_id IN (
                    SELECT saved_meal_id FROM saved_meals WHERE user_id = %(user_id)s
                )
                """,
                {"user_id": user_id},
            )
            writer.execute("DELETE FROM saved_meals WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute("DELETE FROM custom_foods WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute("DELETE FROM symptom_logs WHERE user_id = %(user_id)s", {"user_id": user_id})
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


def _grant_sync_scope_consent(client, user_id: uuid.UUID) -> None:
    response = client.post(
        "/v0/me/consent",
        headers={"X-User-Id": str(user_id)},
        json={
            "policy_version": "gdpr-v2.1.0",
            "action": "grant",
            "scope": {
                "sync_mutations": True,
                "analytics": True,
                "profile": True,
                "symptom_logs": True,
                "symptoms": True,
                "diet_logs": True,
            },
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
    device_id: str,
    key_id: str = "k1",
    seed: str = "queue-signing-secret",
) -> str:
    secret_b64 = _seed_secret(seed)
    with connect(db_url, row_factory=dict_row) as writer:
        with writer.transaction():
            writer.execute(
                """
                INSERT INTO me_device_signing_keys (
                    user_id, device_id, key_id, secret_b64, algorithm, status, valid_until
                ) VALUES (
                    %(user_id)s, %(device_id)s, %(key_id)s, %(secret_b64)s, 'hmac-sha256', 'active', NULL
                )
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


def _mutation_signature_payload(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "mutation_id": item["mutation_id"],
        "idempotency_key": item["idempotency_key"],
        "operation_type": item["operation_type"],
        "entity_type": item.get("entity_type"),
        "entity_id": item.get("entity_id"),
        "base_version": item.get("base_version"),
        "client_seq": item["client_seq"],
        "client_created_at": item["client_created_at"],
        "payload": item["payload"],
        "source": item.get("source"),
        "depends_on_mutation_id": item.get("depends_on_mutation_id"),
    }


def _sign_mutation_item(secret_b64: str, item: dict[str, Any]) -> None:
    payload = _mutation_signature_payload(item)
    payload_hash = sha256_hex(canonical_json(payload))
    existing_integrity = item.get("integrity") or {}
    item["integrity"] = {
        "payload_hash": payload_hash,
        "signature_algo": "hmac-sha256",
        "signature": hmac_signature(secret_b64, canonical_json(payload)),
        "signature_version": 1,
    }
    if "chain_prev_hash" in existing_integrity:
        item["integrity"]["chain_prev_hash"] = existing_integrity.get("chain_prev_hash")


def _build_mutation_item(
    operation_type: str,
    *,
    entity_type: str | None = "symptom_log",
    client_seq: int,
    idempotency_key: str,
    mutation_id: str | None = None,
    entity_id: str | None = None,
    base_version: int | None = None,
    source: dict[str, Any] | None = None,
    depends_on_mutation_id: str | None = None,
    payload_extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "mutation_id": mutation_id or str(uuid.uuid4()),
        "idempotency_key": idempotency_key,
        "operation_type": operation_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "base_version": base_version,
        "client_seq": client_seq,
        "client_created_at": datetime.now(timezone.utc).isoformat(),
        "payload": payload_extra or {"symptom": "bloating"},
        "depends_on_mutation_id": depends_on_mutation_id,
        "source": source
        or {
            "platform": "ios",
            "screen": "symptoms",
            "actor": "user",
            "app_build": "1.0.0",
        },
        "integrity": {
            "payload_hash": "",
            "signature_algo": "hmac-sha256",
            "signature": "",
            "signature_version": 1,
        },
    }


def _build_batch_request(user_id: uuid.UUID, client_device_id: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "batch_id": str(uuid.uuid4()),
        "client_device_id": client_device_id,
        "sync_session_id": str(uuid.uuid4()),
        "client_time_utc": datetime.now(timezone.utc).isoformat(),
        "user_id": str(user_id),
        "items": items,
        "migration_mode": False,
    }


def test_sync_batch_withdraw_consent_cancels_following_mutations(client, db_url) -> None:
    user_id = uuid.uuid4()
    device_id = "batch-device-withdraw"

    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_sync_scope_consent(client, user_id)
            secret = _insert_device_key(db_url, user_id, device_id=device_id)

            symptom_id = str(uuid.uuid4())
            item_withdraw_after = _build_mutation_item(
                "SYMPTOM_CREATE",
                client_seq=1,
                idempotency_key="mut-01",
                entity_id=symptom_id,
                base_version=0,
            )
            item_withdraw = _build_mutation_item(
                "WITHDRAW_CONSENT",
                client_seq=2,
                idempotency_key="mut-02",
                entity_id=str(uuid.uuid4()),
                base_version=None,
                entity_type="global",
            )
            item_canceled = _build_mutation_item(
                "SYMPTOM_UPDATE",
                client_seq=3,
                idempotency_key="mut-03",
                entity_id=symptom_id,
                base_version=1,
                payload_extra={"symptom": "cramps"},
            )

            for item in [item_withdraw_after, item_withdraw, item_canceled]:
                _sign_mutation_item(secret, item)

            response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [item_withdraw_after, item_withdraw, item_canceled]),
            )
            assert response.status_code == 200
            payload = response.json()
            assert len(payload["items"]) == 3
            ordered_statuses = [item["status"] for item in payload["items"]]
            assert ordered_statuses == ["APPLIED", "APPLIED", "CANCELLED_BY_CONSENT"]
            consent_response = client.get(
                "/v0/me/consent",
                headers={"X-User-Id": str(user_id)},
            )
            assert consent_response.status_code == 200
            consent_payload = consent_response.json()
            assert consent_payload["consent_state"]["status"] == "revoked"
            assert consent_payload["consent_state"]["active"] is False

            assert payload["items"][2]["result_code"] == "CONSENT_REVOKED"
            assert payload["items"][2]["conflict"]["code"] == "CONSENT_REVOKED"

            row = db_conn.execute(
                """
                SELECT error_code, status
                FROM me_mutation_queue
                WHERE user_id = %(user_id)s
                  AND idempotency_key = 'mut-03'
                """,
                {"user_id": user_id},
            ).fetchone()
            assert row["status"] == "rejected"
            assert row["error_code"] == "CONSENT_REVOKED"

            _cleanup_account(db_url, user_id)


def test_sync_batch_delete_account_cancels_following_and_future_mutations(client, db_url) -> None:
    user_id = uuid.uuid4()

    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)


def test_sync_batch_applies_tracking_entities_with_version_parity(client, db_url) -> None:
    user_id = uuid.uuid4()
    device_id = "batch-device-tracking"

    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_sync_scope_consent(client, user_id)
            secret = _insert_device_key(db_url, user_id, device_id=device_id)

            custom_food_id = str(uuid.uuid4())
            saved_meal_id = str(uuid.uuid4())
            meal_log_id = str(uuid.uuid4())
            symptom_log_id = str(uuid.uuid4())

            custom_food_create = _build_mutation_item(
                "CUSTOM_FOOD_CREATE",
                entity_type="custom_food",
                entity_id=custom_food_id,
                client_seq=1,
                idempotency_key="tracking-01",
                base_version=0,
                payload_extra={
                    "custom_food_id": custom_food_id,
                    "label": "Poulet vapeur",
                },
            )
            saved_meal_create = _build_mutation_item(
                "SAVED_MEAL_CREATE",
                entity_type="saved_meal",
                entity_id=saved_meal_id,
                client_seq=2,
                idempotency_key="tracking-02",
                base_version=0,
                depends_on_mutation_id=custom_food_create["mutation_id"],
                payload_extra={
                    "saved_meal_id": saved_meal_id,
                    "label": "Déjeuner de base",
                    "items": [
                        {
                            "item_kind": "custom_food",
                            "custom_food_id": custom_food_id,
                        }
                    ],
                },
            )
            meal_create = _build_mutation_item(
                "MEAL_CREATE",
                entity_type="meal_log",
                entity_id=meal_log_id,
                client_seq=3,
                idempotency_key="tracking-03",
                base_version=0,
                depends_on_mutation_id=custom_food_create["mutation_id"],
                payload_extra={
                    "meal_log_id": meal_log_id,
                    "occurred_at_utc": "2026-03-19T11:00:00Z",
                    "items": [
                        {
                            "item_kind": "custom_food",
                            "custom_food_id": custom_food_id,
                            "quantity_text": "150 g",
                        }
                    ],
                },
            )
            symptom_create = _build_mutation_item(
                "SYMPTOM_CREATE",
                entity_type="symptom_log",
                entity_id=symptom_log_id,
                client_seq=4,
                idempotency_key="tracking-04",
                base_version=0,
                payload_extra={
                    "symptom_log_id": symptom_log_id,
                    "symptom_type": "bloating",
                    "severity": 5,
                    "noted_at_utc": "2026-03-19T13:00:00Z",
                },
            )

            for item in [custom_food_create, saved_meal_create, meal_create, symptom_create]:
                _sign_mutation_item(secret, item)

            response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(
                    user_id,
                    device_id,
                    [custom_food_create, saved_meal_create, meal_create, symptom_create],
                ),
            )
            assert response.status_code == 200
            payload = response.json()
            assert [item["status"] for item in payload["items"]] == ["APPLIED", "APPLIED", "APPLIED", "APPLIED"]

            versions = db_conn.execute(
                """
                SELECT entity_type, entity_id, current_version
                FROM me_entity_versions
                WHERE user_id = %(user_id)s
                ORDER BY entity_type, entity_id
                """,
                {"user_id": user_id},
            ).fetchall()
            assert {(row["entity_type"], row["entity_id"]): int(row["current_version"]) for row in versions} == {
                ("custom_food", custom_food_id): 1,
                ("meal_log", meal_log_id): 1,
                ("saved_meal", saved_meal_id): 1,
                ("symptom_log", symptom_log_id): 1,
            }

            assert (
                db_conn.execute(
                    "SELECT COUNT(*) AS count FROM custom_foods WHERE user_id = %(user_id)s",
                    {"user_id": user_id},
                ).fetchone()["count"]
                == 1
            )
            assert (
                db_conn.execute(
                    "SELECT COUNT(*) AS count FROM saved_meals WHERE user_id = %(user_id)s",
                    {"user_id": user_id},
                ).fetchone()["count"]
                == 1
            )
            assert (
                db_conn.execute(
                    "SELECT COUNT(*) AS count FROM meal_logs WHERE user_id = %(user_id)s",
                    {"user_id": user_id},
                ).fetchone()["count"]
                == 1
            )
            assert (
                db_conn.execute(
                    "SELECT COUNT(*) AS count FROM symptom_logs WHERE user_id = %(user_id)s",
                    {"user_id": user_id},
                ).fetchone()["count"]
                == 1
            )

            _cleanup_account(db_url, user_id)


def test_sync_batch_custom_food_version_conflict_then_delete_tombstone(client, db_url) -> None:
    user_id = uuid.uuid4()
    device_id = "batch-device-custom-food-delete"

    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_sync_scope_consent(client, user_id)
            secret = _insert_device_key(db_url, user_id, device_id=device_id)

            custom_food_id = str(uuid.uuid4())
            create_item = _build_mutation_item(
                "CUSTOM_FOOD_CREATE",
                entity_type="custom_food",
                entity_id=custom_food_id,
                client_seq=1,
                idempotency_key="custom-food-create",
                base_version=0,
                payload_extra={
                    "custom_food_id": custom_food_id,
                    "label": "Oeufs durs",
                },
            )
            _sign_mutation_item(secret, create_item)

            create_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [create_item]),
            )
            assert create_response.status_code == 200
            assert create_response.json()["items"][0]["status"] == "APPLIED"

            conflict_item = _build_mutation_item(
                "CUSTOM_FOOD_UPDATE",
                entity_type="custom_food",
                entity_id=custom_food_id,
                client_seq=2,
                idempotency_key="custom-food-conflict",
                base_version=0,
                payload_extra={
                    "label": "Oeufs durs bio",
                },
            )
            _sign_mutation_item(secret, conflict_item)
            conflict_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [conflict_item]),
            )
            assert conflict_response.status_code == 200
            conflict_payload = conflict_response.json()["items"][0]
            assert conflict_payload["status"] == "RETRY_WAIT"
            assert conflict_payload["result_code"] == "VERSION_CONFLICT"

            delete_item = _build_mutation_item(
                "CUSTOM_FOOD_DELETE",
                entity_type="custom_food",
                entity_id=custom_food_id,
                client_seq=3,
                idempotency_key="custom-food-delete",
                base_version=1,
                payload_extra={
                    "custom_food_id": custom_food_id,
                },
            )
            _sign_mutation_item(secret, delete_item)
            delete_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [delete_item]),
            )
            assert delete_response.status_code == 200
            delete_payload = delete_response.json()["items"][0]
            assert delete_payload["status"] == "APPLIED"
            assert delete_payload["applied_version"] == 2

            deleted_row = db_conn.execute(
                """
                SELECT deleted_at, version
                FROM custom_foods
                WHERE custom_food_id = %(custom_food_id)s
                """,
                {"custom_food_id": custom_food_id},
            ).fetchone()
            assert deleted_row["deleted_at"] is not None
            assert int(deleted_row["version"]) == 2

            _cleanup_account(db_url, user_id)
            _grant_sync_scope_consent(client, user_id)
            secret = _insert_device_key(db_url, user_id, device_id=device_id, key_id="k2", seed="queue-delete")

            symptom_id = str(uuid.uuid4())
            item_apply = _build_mutation_item(
                "SYMPTOM_CREATE",
                client_seq=1,
                idempotency_key="mut-11",
                entity_id=symptom_id,
                base_version=0,
            )
            item_delete = _build_mutation_item(
                "DELETE_ACCOUNT",
                client_seq=2,
                idempotency_key="mut-12",
                entity_id=str(uuid.uuid4()),
                base_version=None,
                entity_type="account",
                payload_extra={"reason": "user_request"},
            )
            item_canceled = _build_mutation_item(
                "SYMPTOM_DELETE",
                client_seq=3,
                idempotency_key="mut-13",
                entity_id=symptom_id,
                base_version=1,
            )

            for item in [item_apply, item_delete, item_canceled]:
                _sign_mutation_item(secret, item)

            response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [item_apply, item_delete, item_canceled]),
            )
            assert response.status_code == 200
            payload = response.json()
            assert [item["status"] for item in payload["items"]] == ["APPLIED", "APPLIED", "CANCELLED_BY_DELETE"]
            assert payload["items"][2]["result_code"] == "ACCOUNT_DELETED"
            assert payload["items"][2]["conflict"]["code"] == "ACCOUNT_DELETED"

            delete_count = db_conn.execute(
                "SELECT COUNT(*) AS count FROM me_delete_jobs WHERE user_id = %(user_id)s",
                {"user_id": user_id},
            ).fetchone()["count"]
            assert delete_count == 1

            stale_item = _build_mutation_item(
                "SYMPTOM_CREATE",
                client_seq=1,
                idempotency_key="mut-14",
                entity_id=str(uuid.uuid4()),
                base_version=0,
            )
            _sign_mutation_item(secret, stale_item)

            second_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [stale_item]),
            )
            assert second_response.status_code == 200
            second_payload = second_response.json()
            assert [item["status"] for item in second_payload["items"]] == ["CANCELLED_BY_DELETE"]
            assert second_payload["items"][0]["result_code"] == "ACCOUNT_DELETED"

            _cleanup_account(db_url, user_id)


def test_sync_batch_legacy_migration_accepts_unsigned_without_idempotency(client, db_url) -> None:
    user_id = uuid.uuid4()
    device_id = "batch-device-legacy-migration"

    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_sync_scope_consent(client, user_id)
            _insert_device_key(db_url, user_id, device_id=device_id, key_id="k3", seed="legacy-migration")

            mutation_id = str(uuid.uuid4())
            legacy_item = _build_mutation_item(
                "SYMPTOM_CREATE",
                client_seq=1,
                idempotency_key="",
                mutation_id=mutation_id,
                entity_id=str(uuid.uuid4()),
                base_version=0,
            )
            legacy_request = _build_batch_request(user_id, device_id, [legacy_item])
            legacy_request["migration_mode"] = True
            del legacy_item["integrity"]

            response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=legacy_request,
            )
            assert response.status_code == 200
            payload = response.json()
            assert payload["items"][0]["status"] == "APPLIED"
            assert payload["items"][0]["result_code"] == "OK"
            assert payload["items"][0]["observability"]["signature_valid"] is False

            queue_row = db_conn.execute(
                """
                SELECT idempotency_key, signature_kid, error_code
                FROM me_mutation_queue
                WHERE user_id = %(user_id)s
                  AND idempotency_key = %(idempotency_key)s
                """,
                {"user_id": user_id, "idempotency_key": f"legacy:{mutation_id}"},
            ).fetchone()
            assert queue_row is not None
            assert queue_row["idempotency_key"] == f"legacy:{mutation_id}"
            assert queue_row["signature_kid"] == "legacy"
            assert queue_row["error_code"] == "OK"

            retry_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=legacy_request,
            )
            assert retry_response.status_code == 200
            retry_payload = retry_response.json()
            assert retry_payload["items"][0]["status"] == "DUPLICATE"
            assert retry_payload["items"][0]["result_code"] == "DUPLICATE"

            conflict_item = dict(legacy_item)
            conflict_item["payload"] = {"symptom": "different"}
            conflict_request = _build_batch_request(user_id, device_id, [conflict_item])
            conflict_request["migration_mode"] = True
            conflict_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=conflict_request,
            )
            assert conflict_response.status_code == 200
            conflict_payload = conflict_response.json()
            assert conflict_payload["items"][0]["status"] == "FAILED_PERMANENT"
            assert conflict_payload["items"][0]["result_code"] == "INVALID_PAYLOAD"

            _cleanup_account(db_url, user_id)


def test_sync_batch_chain_prev_hash_required_and_tamper_detected(client, db_url) -> None:
    user_id = uuid.uuid4()
    device_id = "batch-device-chain"

    with connect(db_url, row_factory=dict_row) as db_conn:
        with db_conn.transaction():
            _cleanup_account(db_url, user_id)
            _grant_sync_scope_consent(client, user_id)
            secret = _insert_device_key(db_url, user_id, device_id=device_id, key_id="k4", seed="chain-integrity")

            first_entity_id = str(uuid.uuid4())
            first_item = _build_mutation_item(
                "SYMPTOM_CREATE",
                client_seq=1,
                idempotency_key="chain-01",
                entity_id=first_entity_id,
                base_version=0,
            )
            first_item["integrity"]["chain_prev_hash"] = None
            _sign_mutation_item(secret, first_item)

            first_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [first_item]),
            )
            assert first_response.status_code == 200
            first_payload = first_response.json()
            assert first_payload["items"][0]["status"] == "APPLIED"

            first_row = db_conn.execute(
                """
                SELECT chain_prev_hash, chain_item_hash
                FROM me_mutation_queue
                WHERE user_id = %(user_id)s
                  AND idempotency_key = %(idempotency_key)s
                """,
                {"user_id": user_id, "idempotency_key": "chain-01"},
            ).fetchone()
            assert first_row is not None
            assert first_row["chain_prev_hash"] is None
            assert first_row["chain_item_hash"] is not None

            second_item = _build_mutation_item(
                "SYMPTOM_UPDATE",
                client_seq=2,
                idempotency_key="chain-02",
                entity_id=first_entity_id,
                base_version=1,
            )
            second_item["integrity"]["chain_prev_hash"] = first_row["chain_item_hash"]
            _sign_mutation_item(secret, second_item)

            second_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [second_item]),
            )
            assert second_response.status_code == 200
            second_payload = second_response.json()
            assert second_payload["items"][0]["status"] == "APPLIED"

            second_row = db_conn.execute(
                """
                SELECT chain_prev_hash, chain_item_hash
                FROM me_mutation_queue
                WHERE user_id = %(user_id)s
                  AND idempotency_key = %(idempotency_key)s
                """,
                {"user_id": user_id, "idempotency_key": "chain-02"},
            ).fetchone()
            assert second_row is not None
            assert second_row["chain_prev_hash"] == first_row["chain_item_hash"]

            tampered_item = _build_mutation_item(
                "SYMPTOM_UPDATE",
                client_seq=3,
                idempotency_key="chain-03",
                entity_id=str(uuid.uuid4()),
                base_version=0,
            )
            tampered_item["integrity"]["chain_prev_hash"] = "tampered-chain-hash"
            _sign_mutation_item(secret, tampered_item)

            tamper_response = client.post(
                "/v0/sync/mutations:batch",
                headers={"X-User-Id": str(user_id)},
                json=_build_batch_request(user_id, device_id, [tampered_item]),
            )
            assert tamper_response.status_code == 200
            tamper_payload = tamper_response.json()
            assert tamper_payload["items"][0]["status"] == "FAILED_PERMANENT"
            assert tamper_payload["items"][0]["result_code"] == "INVALID_PAYLOAD"

            _cleanup_account(db_url, user_id)
