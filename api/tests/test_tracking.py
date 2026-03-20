from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from psycopg import connect
from psycopg.rows import dict_row

pytestmark = [pytest.mark.integration, pytest.mark.usefixtures("me_security_schema", "tracking_schema")]


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
            writer.execute("DELETE FROM me_entity_versions WHERE user_id = %(user_id)s", {"user_id": user_id})
            writer.execute("DELETE FROM me_mutation_queue WHERE user_id = %(user_id)s", {"user_id": user_id})
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


def _grant_tracking_consent(client, user_id: uuid.UUID, *, symptom_logs: bool = True, diet_logs: bool = True) -> None:
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
                "symptom_logs": symptom_logs,
                "symptoms": symptom_logs,
                "diet_logs": diet_logs,
            },
            "legal_basis": "consent",
            "method": "in_app_sheet",
            "source": "mobile_app",
            "language": "fr-FR",
            "reason": "tracking_test",
        },
    )
    assert response.status_code == 200


def test_tracking_write_endpoints_require_scoped_consent(client, db_url) -> None:
    user_id = uuid.uuid4()
    _cleanup_account(db_url, user_id)
    _grant_tracking_consent(client, user_id, symptom_logs=False, diet_logs=False)

    symptom_response = client.post(
        "/v0/me/tracking/symptoms",
        headers={"X-User-Id": str(user_id)},
        json={
            "symptom_type": "bloating",
            "severity": 4,
            "noted_at_utc": "2026-03-19T11:00:00Z",
            "note": "after lunch",
        },
    )
    assert symptom_response.status_code == 423
    assert symptom_response.json()["error"]["code"] == "locked"

    meal_response = client.post(
        "/v0/me/tracking/meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "occurred_at_utc": "2026-03-19T10:00:00Z",
            "items": [
                {
                    "item_kind": "free_text",
                    "free_text_label": "Soupe maison",
                }
            ],
        },
    )
    assert meal_response.status_code == 423
    assert meal_response.json()["error"]["code"] == "locked"

    _cleanup_account(db_url, user_id)


def test_tracking_crud_feed_and_summary(client, db_url) -> None:
    user_id = uuid.uuid4()
    _cleanup_account(db_url, user_id)
    _grant_tracking_consent(client, user_id)

    custom_food_response = client.post(
        "/v0/me/tracking/custom-foods",
        headers={"X-User-Id": str(user_id)},
        json={"label": "Poulet maison", "note": "nature"},
    )
    assert custom_food_response.status_code == 201
    custom_food = custom_food_response.json()

    saved_meal_response = client.post(
        "/v0/me/tracking/saved-meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "label": "Déjeuner simple",
            "items": [
                {
                    "item_kind": "canonical_food",
                    "food_slug": "ail-cru",
                    "quantity_text": "1 c. à soupe",
                },
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                },
            ],
        },
    )
    assert saved_meal_response.status_code == 201

    meal_time = datetime(2026, 3, 19, 10, 0, tzinfo=timezone.utc)
    meal_response = client.post(
        "/v0/me/tracking/meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "title": "Déjeuner",
            "occurred_at_utc": meal_time.isoformat().replace("+00:00", "Z"),
            "note": "batch test",
            "items": [
                {
                    "item_kind": "canonical_food",
                    "food_slug": "ail-cru",
                    "quantity_text": "1 c. à soupe",
                },
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                    "quantity_text": "120 g",
                },
                {
                    "item_kind": "free_text",
                    "free_text_label": "Salade verte",
                },
            ],
        },
    )
    assert meal_response.status_code == 201
    meal_payload = meal_response.json()
    assert len(meal_payload["items"]) == 3
    assert meal_payload["items"][1]["label"] == "Poulet maison"

    symptom_time = meal_time + timedelta(hours=2)
    symptom_response = client.post(
        "/v0/me/tracking/symptoms",
        headers={"X-User-Id": str(user_id)},
        json={
            "symptom_type": "bloating",
            "severity": 6,
            "noted_at_utc": symptom_time.isoformat().replace("+00:00", "Z"),
            "note": "ballonnements après le repas",
        },
    )
    assert symptom_response.status_code == 201
    symptom_payload = symptom_response.json()

    feed_response = client.get(
        "/v0/me/tracking/feed?limit=10",
        headers={"X-User-Id": str(user_id)},
    )
    assert feed_response.status_code == 200
    feed_payload = feed_response.json()
    assert feed_payload["total"] == 2
    assert [item["entry_type"] for item in feed_payload["items"]] == ["symptom", "meal"]

    summary_response = client.get(
        "/v0/me/tracking/summary/weekly?anchor_date=2026-03-19",
        headers={"X-User-Id": str(user_id)},
    )
    assert summary_response.status_code == 200
    summary_payload = summary_response.json()
    assert summary_payload["anchor_date"] == "2026-03-19"
    assert summary_payload["severity"]["average"] == 6.0
    assert summary_payload["severity"]["maximum"] == 6
    assert summary_payload["symptom_counts"] == [{"symptom_type": "bloating", "count": 1}]
    assert len(summary_payload["daily_counts"]) == 7
    assert summary_payload["proximity_groups"][0]["symptom_log_id"] == symptom_payload["symptom_log_id"]
    assert summary_payload["proximity_groups"][0]["nearby_meals"][0]["meal_log_id"] == meal_payload["meal_log_id"]
    assert "cause" not in summary_payload["proximity_groups"][0]

    delete_response = client.delete(
        f"/v0/me/tracking/symptoms/{symptom_payload['symptom_log_id']}",
        headers={"X-User-Id": str(user_id)},
    )
    assert delete_response.status_code == 204

    symptoms_response = client.get(
        "/v0/me/tracking/symptoms",
        headers={"X-User-Id": str(user_id)},
    )
    assert symptoms_response.status_code == 200
    assert symptoms_response.json() == []

    _cleanup_account(db_url, user_id)


def test_tracking_writes_stay_locked_after_full_account_delete(client, db_url) -> None:
    user_id = uuid.uuid4()
    _cleanup_account(db_url, user_id)
    _grant_tracking_consent(client, user_id)

    symptom_response = client.post(
        "/v0/me/tracking/symptoms",
        headers={"X-User-Id": str(user_id)},
        json={
            "symptom_type": "pain",
            "severity": 5,
            "noted_at_utc": "2026-03-19T15:00:00Z",
        },
    )
    assert symptom_response.status_code == 201
    symptom_id = symptom_response.json()["symptom_log_id"]

    custom_food_response = client.post(
        "/v0/me/tracking/custom-foods",
        headers={"X-User-Id": str(user_id)},
        json={"label": "Bol maison"},
    )
    assert custom_food_response.status_code == 201
    custom_food_id = custom_food_response.json()["custom_food_id"]

    delete_request = client.post(
        "/v0/me/delete",
        headers={"X-User-Id": str(user_id)},
        json={
            "scope": "all",
            "hard_delete": True,
            "soft_delete_window_days": 0,
            "confirm_text": "SUPPRIMER MES DONNÉES",
            "reason": "tracking_lock_regression",
        },
    )
    assert delete_request.status_code == 202

    delete_status = client.get(
        delete_request.json()["status_uri"],
        headers={"X-User-Id": str(user_id)},
    )
    assert delete_status.status_code == 200
    assert delete_status.json()["status"] in {"processing", "completed"}

    _grant_tracking_consent(client, user_id)

    create_symptom_after_delete = client.post(
        "/v0/me/tracking/symptoms",
        headers={"X-User-Id": str(user_id)},
        json={
            "symptom_type": "gas",
            "severity": 4,
            "noted_at_utc": "2026-03-19T16:00:00Z",
        },
    )
    assert create_symptom_after_delete.status_code == 423
    assert create_symptom_after_delete.json()["error"]["code"] == "locked"

    update_symptom_after_delete = client.patch(
        f"/v0/me/tracking/symptoms/{symptom_id}",
        headers={"X-User-Id": str(user_id)},
        json={"severity": 6},
    )
    assert update_symptom_after_delete.status_code == 423
    assert update_symptom_after_delete.json()["error"]["code"] == "locked"

    create_custom_food_after_delete = client.post(
        "/v0/me/tracking/custom-foods",
        headers={"X-User-Id": str(user_id)},
        json={"label": "Riz nature"},
    )
    assert create_custom_food_after_delete.status_code == 423
    assert create_custom_food_after_delete.json()["error"]["code"] == "locked"

    delete_custom_food_after_delete = client.delete(
        f"/v0/me/tracking/custom-foods/{custom_food_id}",
        headers={"X-User-Id": str(user_id)},
    )
    assert delete_custom_food_after_delete.status_code == 423
    assert delete_custom_food_after_delete.json()["error"]["code"] == "locked"

    _cleanup_account(db_url, user_id)


def test_tracking_feed_total_counts_full_history_beyond_limit(client, db_url) -> None:
    user_id = uuid.uuid4()
    _cleanup_account(db_url, user_id)
    _grant_tracking_consent(client, user_id)

    base_time = datetime(2026, 3, 20, 8, 0, tzinfo=timezone.utc)

    for index in range(6):
        meal_time = base_time + timedelta(minutes=index * 2)
        meal_response = client.post(
            "/v0/me/tracking/meals",
            headers={"X-User-Id": str(user_id)},
            json={
                "title": f"Repas {index}",
                "occurred_at_utc": meal_time.isoformat().replace("+00:00", "Z"),
                "items": [
                    {
                        "item_kind": "free_text",
                        "free_text_label": f"Plat {index}",
                    }
                ],
            },
        )
        assert meal_response.status_code == 201

        symptom_time = base_time + timedelta(minutes=index * 2 + 1)
        symptom_response = client.post(
            "/v0/me/tracking/symptoms",
            headers={"X-User-Id": str(user_id)},
            json={
                "symptom_type": "bloating",
                "severity": index % 10,
                "noted_at_utc": symptom_time.isoformat().replace("+00:00", "Z"),
            },
        )
        assert symptom_response.status_code == 201

    feed_response = client.get(
        "/v0/me/tracking/feed?limit=5",
        headers={"X-User-Id": str(user_id)},
    )
    assert feed_response.status_code == 200

    feed_payload = feed_response.json()
    assert feed_payload["total"] == 12
    assert len(feed_payload["items"]) == 5
    assert [item["entry_type"] for item in feed_payload["items"]] == [
        "symptom",
        "meal",
        "symptom",
        "meal",
        "symptom",
    ]

    occurred_times = [
        datetime.fromisoformat(item["occurred_at_utc"].replace("Z", "+00:00")) for item in feed_payload["items"]
    ]
    assert occurred_times == sorted(occurred_times, reverse=True)
    assert occurred_times == [
        base_time + timedelta(minutes=11),
        base_time + timedelta(minutes=10),
        base_time + timedelta(minutes=9),
        base_time + timedelta(minutes=8),
        base_time + timedelta(minutes=7),
    ]

    _cleanup_account(db_url, user_id)


def test_deleted_custom_foods_still_resolve_for_existing_tracking_references(client, db_url) -> None:
    user_id = uuid.uuid4()
    _cleanup_account(db_url, user_id)
    _grant_tracking_consent(client, user_id)

    custom_food_response = client.post(
        "/v0/me/tracking/custom-foods",
        headers={"X-User-Id": str(user_id)},
        json={"label": "Soupe maison"},
    )
    assert custom_food_response.status_code == 201
    custom_food = custom_food_response.json()

    saved_meal_response = client.post(
        "/v0/me/tracking/saved-meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "label": "Modèle soupe",
            "items": [
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                }
            ],
        },
    )
    assert saved_meal_response.status_code == 201
    saved_meal = saved_meal_response.json()

    meal_response = client.post(
        "/v0/me/tracking/meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "occurred_at_utc": "2026-03-19T12:00:00Z",
            "items": [
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                }
            ],
        },
    )
    assert meal_response.status_code == 201
    meal = meal_response.json()

    delete_response = client.delete(
        f"/v0/me/tracking/custom-foods/{custom_food['custom_food_id']}",
        headers={"X-User-Id": str(user_id)},
    )
    assert delete_response.status_code == 204

    update_saved_meal_response = client.patch(
        f"/v0/me/tracking/saved-meals/{saved_meal['saved_meal_id']}",
        headers={"X-User-Id": str(user_id)},
        json={
            "note": "toujours utile",
            "items": [
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                }
            ],
        },
    )
    assert update_saved_meal_response.status_code == 200
    assert update_saved_meal_response.json()["items"][0]["label"] == "Soupe maison"

    update_meal_response = client.patch(
        f"/v0/me/tracking/meals/{meal['meal_log_id']}",
        headers={"X-User-Id": str(user_id)},
        json={
            "note": "historique conservé",
            "items": [
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                }
            ],
        },
    )
    assert update_meal_response.status_code == 200
    assert update_meal_response.json()["items"][0]["label"] == "Soupe maison"

    create_meal_from_deleted_reference = client.post(
        "/v0/me/tracking/meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "occurred_at_utc": "2026-03-19T13:00:00Z",
            "items": [
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                }
            ],
        },
    )
    assert create_meal_from_deleted_reference.status_code == 201
    assert create_meal_from_deleted_reference.json()["items"][0]["label"] == "Soupe maison"

    _cleanup_account(db_url, user_id)


def test_meal_logs_keep_snapshot_labels_when_custom_food_changes(client, db_url) -> None:
    user_id = uuid.uuid4()
    _cleanup_account(db_url, user_id)
    _grant_tracking_consent(client, user_id)

    custom_food_response = client.post(
        "/v0/me/tracking/custom-foods",
        headers={"X-User-Id": str(user_id)},
        json={"label": "Galette maison"},
    )
    assert custom_food_response.status_code == 201
    custom_food = custom_food_response.json()

    meal_response = client.post(
        "/v0/me/tracking/meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "occurred_at_utc": "2026-03-18T12:00:00Z",
            "items": [
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                }
            ],
        },
    )
    assert meal_response.status_code == 201
    meal_payload = meal_response.json()
    assert meal_payload["items"][0]["label"] == "Galette maison"

    update_custom_food_response = client.patch(
        f"/v0/me/tracking/custom-foods/{custom_food['custom_food_id']}",
        headers={"X-User-Id": str(user_id)},
        json={"label": "Galette sarrasin maison"},
    )
    assert update_custom_food_response.status_code == 200

    meals_response = client.get(
        "/v0/me/tracking/meals",
        headers={"X-User-Id": str(user_id)},
    )
    assert meals_response.status_code == 200
    meals_payload = meals_response.json()
    assert meals_payload[0]["items"][0]["label"] == "Galette maison"

    custom_foods_response = client.get(
        "/v0/me/tracking/custom-foods",
        headers={"X-User-Id": str(user_id)},
    )
    assert custom_foods_response.status_code == 200
    assert custom_foods_response.json()[0]["label"] == "Galette sarrasin maison"

    _cleanup_account(db_url, user_id)


def test_export_and_delete_include_tracking_domains(client, db_url) -> None:
    user_id = uuid.uuid4()
    _cleanup_account(db_url, user_id)
    _grant_tracking_consent(client, user_id)

    create_custom_food = client.post(
        "/v0/me/tracking/custom-foods",
        headers={"X-User-Id": str(user_id)},
        json={"label": "Omelette nature"},
    )
    assert create_custom_food.status_code == 201
    custom_food = create_custom_food.json()

    create_meal = client.post(
        "/v0/me/tracking/meals",
        headers={"X-User-Id": str(user_id)},
        json={
            "occurred_at_utc": "2026-03-20T08:00:00Z",
            "items": [
                {
                    "item_kind": "custom_food",
                    "custom_food_id": custom_food["custom_food_id"],
                }
            ],
        },
    )
    assert create_meal.status_code == 201

    create_symptom = client.post(
        "/v0/me/tracking/symptoms",
        headers={"X-User-Id": str(user_id)},
        json={
            "symptom_type": "nausea",
            "severity": 3,
            "noted_at_utc": "2026-03-20T09:00:00Z",
        },
    )
    assert create_symptom.status_code == 201

    export_request = client.post(
        "/v0/me/export",
        headers={"X-User-Id": str(user_id)},
        json={
            "format": "json",
            "include": ["consent", "symptoms", "diet_logs"],
            "anonymize": True,
        },
    )
    assert export_request.status_code == 202
    export_status_uri = export_request.json()["status_uri"]

    export_status = client.get(
        export_status_uri,
        headers={"X-User-Id": str(user_id)},
    )
    assert export_status.status_code == 200
    export_payload = export_status.json()
    assert export_payload["rows_by_domain"]["symptoms"] == 1
    assert export_payload["rows_by_domain"]["diet_logs"] >= 3

    delete_request = client.post(
        "/v0/me/delete",
        headers={"X-User-Id": str(user_id)},
        json={
            "scope": "diet_only",
            "hard_delete": True,
            "soft_delete_window_days": 0,
            "confirm_text": "IGNORED FOR PARTIAL SCOPE",
            "reason": "diet_cleanup",
        },
    )
    assert delete_request.status_code == 202
    delete_status = client.get(
        delete_request.json()["status_uri"],
        headers={"X-User-Id": str(user_id)},
    )
    assert delete_status.status_code == 200
    delete_payload = delete_status.json()
    assert delete_payload["summary"]["diet_logs_deleted"] >= 3
    assert delete_payload["summary"]["symptom_logs_deleted"] == 0

    remaining_meals = client.get("/v0/me/tracking/meals", headers={"X-User-Id": str(user_id)})
    assert remaining_meals.status_code == 200
    assert remaining_meals.json() == []

    remaining_symptoms = client.get("/v0/me/tracking/symptoms", headers={"X-User-Id": str(user_id)})
    assert remaining_symptoms.status_code == 200
    assert len(remaining_symptoms.json()) == 1

    _cleanup_account(db_url, user_id)
