"""Tracking entity dispatch for sync mutations.

Routes each tracking operation (symptom, meal, custom food, saved meal)
to the appropriate tracking_store module. Called by sync_mutations_batch
in sync.py after version/signature/consent checks pass.

No queue, signature, or result-building logic — kept deliberately
focused on entity CRUD dispatch only.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict
from uuid import UUID

from app import tracking_store, tracking_store_meals, tracking_store_saved_meals, tracking_store_symptoms
from app.models import (
    CustomFoodCreateRequest,
    CustomFoodUpdateRequest,
    MealLogCreateRequest,
    MealLogUpdateRequest,
    SavedMealCreateRequest,
    SavedMealUpdateRequest,
    SymptomLogCreateRequest,
    SymptomLogUpdateRequest,
    SyncV1MutationItem,
)


def _coerce_symptom_payload(payload: Dict[str, Any], fallback_noted_at: datetime, *, partial: bool) -> Dict[str, Any]:
    symptom_value = payload.get("symptom_type") or payload.get("symptom")
    allowed = {
        "bloating",
        "pain",
        "gas",
        "diarrhea",
        "constipation",
        "nausea",
        "reflux",
        "other",
    }
    symptom_type = symptom_value if symptom_value in allowed else ("other" if symptom_value else None)
    note_parts = []
    if symptom_type == "other" and symptom_value and symptom_value != "other":
        note_parts.append(str(symptom_value))
    if payload.get("note"):
        note_parts.append(str(payload["note"]))

    normalized: Dict[str, Any] = {}
    if symptom_type is not None:
        normalized["symptom_type"] = symptom_type
    elif not partial:
        normalized["symptom_type"] = "other"

    if "severity" in payload:
        normalized["severity"] = int(payload.get("severity") or 0)
    elif not partial:
        normalized["severity"] = 0

    if "noted_at_utc" in payload:
        normalized["noted_at_utc"] = payload["noted_at_utc"]
    elif not partial:
        normalized["noted_at_utc"] = fallback_noted_at

    if note_parts:
        normalized["note"] = " — ".join(note_parts)
    elif "note" in payload:
        normalized["note"] = payload.get("note")

    return normalized


def _apply_symptom_mutation(
    conn,
    user_id: UUID,
    mutation: SyncV1MutationItem,
    entity_uuid: UUID,
    next_version: int,
) -> None:
    """Dispatch a SYMPTOM_CREATE/UPDATE/DELETE to tracking_store."""
    op = mutation.operation_type
    if op == "SYMPTOM_CREATE":
        tracking_store_symptoms.create_symptom_log(
            conn,
            user_id,
            SymptomLogCreateRequest.model_validate(
                _coerce_symptom_payload(mutation.payload, mutation.client_created_at, partial=False)
            ),
            symptom_log_id=entity_uuid,
            version=next_version,
        )
    elif op == "SYMPTOM_UPDATE":
        tracking_store_symptoms.update_symptom_log(
            conn,
            user_id,
            entity_uuid,
            SymptomLogUpdateRequest.model_validate(
                _coerce_symptom_payload(mutation.payload, mutation.client_created_at, partial=True)
            ),
            version=next_version,
        )
    elif op == "SYMPTOM_DELETE":
        tracking_store_symptoms.delete_symptom_log(conn, user_id, entity_uuid, version=next_version)
    else:
        raise ValueError(f"Unknown symptom operation: {op}")


def _apply_meal_mutation(
    conn,
    user_id: UUID,
    mutation: SyncV1MutationItem,
    entity_uuid: UUID,
    next_version: int,
) -> None:
    """Dispatch a MEAL_CREATE/UPDATE/DELETE to tracking_store."""
    op = mutation.operation_type
    if op == "MEAL_CREATE":
        tracking_store_meals.create_meal_log(
            conn,
            user_id,
            MealLogCreateRequest.model_validate(mutation.payload),
            meal_log_id=entity_uuid,
            version=next_version,
        )
    elif op == "MEAL_UPDATE":
        tracking_store_meals.update_meal_log(
            conn,
            user_id,
            entity_uuid,
            MealLogUpdateRequest.model_validate(mutation.payload),
            version=next_version,
        )
    elif op == "MEAL_DELETE":
        tracking_store_meals.delete_meal_log(conn, user_id, entity_uuid, version=next_version)
    else:
        raise ValueError(f"Unknown meal operation: {op}")


def _apply_tracking_mutation(
    conn,
    user_id: UUID,
    mutation: SyncV1MutationItem,
    entity_type: str,
    entity_id: str,
    next_version: int,
) -> None:
    op = mutation.operation_type
    if op is None:
        raise ValueError("operation_type is required")

    if entity_id == "__global__":
        raise ValueError("entity_id is required")

    entity_uuid = UUID(entity_id)

    if op in ("SYMPTOM_CREATE", "SYMPTOM_UPDATE", "SYMPTOM_DELETE"):
        _apply_symptom_mutation(conn, user_id, mutation, entity_uuid, next_version)
        return

    if op in ("MEAL_CREATE", "MEAL_UPDATE", "MEAL_DELETE"):
        _apply_meal_mutation(conn, user_id, mutation, entity_uuid, next_version)
        return

    if op == "CUSTOM_FOOD_CREATE":
        tracking_store.create_custom_food(
            conn,
            user_id,
            CustomFoodCreateRequest.model_validate(mutation.payload),
            custom_food_id=entity_uuid,
            version=next_version,
        )
        return

    if op == "CUSTOM_FOOD_UPDATE":
        tracking_store.update_custom_food(
            conn,
            user_id,
            entity_uuid,
            CustomFoodUpdateRequest.model_validate(mutation.payload),
            version=next_version,
        )
        return

    if op == "CUSTOM_FOOD_DELETE":
        tracking_store.delete_custom_food(conn, user_id, entity_uuid, version=next_version)
        return

    if op == "SAVED_MEAL_CREATE":
        tracking_store_saved_meals.create_saved_meal(
            conn,
            user_id,
            SavedMealCreateRequest.model_validate(mutation.payload),
            saved_meal_id=entity_uuid,
            version=next_version,
        )
        return

    if op == "SAVED_MEAL_UPDATE":
        tracking_store_saved_meals.update_saved_meal(
            conn,
            user_id,
            entity_uuid,
            SavedMealUpdateRequest.model_validate(mutation.payload),
            version=next_version,
        )
        return

    if op == "SAVED_MEAL_DELETE":
        tracking_store_saved_meals.delete_saved_meal(conn, user_id, entity_uuid, version=next_version)
