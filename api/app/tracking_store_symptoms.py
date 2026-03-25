from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from psycopg import Connection

from app.errors import bad_request, not_found
from app.models import SymptomLog, SymptomLogCreateRequest, SymptomLogUpdateRequest
from app.tracking_store import _normalize_text


def _symptom_row_to_model(row: Dict[str, Any]) -> SymptomLog:
    return SymptomLog(
        symptom_log_id=row["symptom_log_id"],
        symptom_type=row["symptom_type"],
        severity=int(row["severity"]),
        noted_at_utc=row["noted_at_utc"],
        note=row["note"],
        version=int(row["version"]),
        created_at_utc=row["created_at_utc"],
        updated_at_utc=row["updated_at_utc"],
    )


def list_symptom_logs(conn: Connection, user_id: UUID, limit: int = 100) -> list[SymptomLog]:
    rows = conn.execute(
        """
        SELECT
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        FROM symptom_logs
        WHERE user_id = %(user_id)s
          AND deleted_at IS NULL
        ORDER BY noted_at_utc DESC, created_at_utc DESC
        LIMIT %(limit)s
        """,
        {"user_id": user_id, "limit": limit},
    ).fetchall()
    return [_symptom_row_to_model(dict(row)) for row in rows]


def create_symptom_log(
    conn: Connection,
    user_id: UUID,
    payload: SymptomLogCreateRequest,
    *,
    symptom_log_id: Optional[UUID] = None,
    version: int,
) -> SymptomLog:
    normalized_note = _normalize_text(payload.note)
    row = conn.execute(
        """
        INSERT INTO symptom_logs (
          symptom_log_id,
          user_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version
        )
        VALUES (
          %(symptom_log_id)s,
          %(user_id)s,
          %(symptom_type)s,
          %(severity)s,
          %(noted_at_utc)s,
          %(note)s,
          %(version)s
        )
        RETURNING
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        """,
        {
            "symptom_log_id": symptom_log_id or uuid4(),
            "user_id": user_id,
            "symptom_type": payload.symptom_type,
            "severity": payload.severity,
            "noted_at_utc": payload.noted_at_utc,
            "note": normalized_note,
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not create symptom log")
    return _symptom_row_to_model(dict(row))


def update_symptom_log(
    conn: Connection,
    user_id: UUID,
    symptom_log_id: UUID,
    payload: SymptomLogUpdateRequest,
    *,
    version: int,
) -> SymptomLog:
    existing = conn.execute(
        """
        SELECT symptom_log_id, symptom_type, severity, noted_at_utc, note
        FROM symptom_logs
        WHERE symptom_log_id = %(symptom_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        """,
        {"symptom_log_id": symptom_log_id, "user_id": user_id},
    ).fetchone()
    if existing is None:
        raise not_found("Symptom log not found")

    row = conn.execute(
        """
        UPDATE symptom_logs
        SET symptom_type = %(symptom_type)s,
            severity = %(severity)s,
            noted_at_utc = %(noted_at_utc)s,
            note = %(note)s,
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE symptom_log_id = %(symptom_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING
          symptom_log_id,
          symptom_type,
          severity,
          noted_at_utc,
          note,
          version,
          created_at_utc,
          updated_at_utc
        """,
        {
            "symptom_log_id": symptom_log_id,
            "user_id": user_id,
            "symptom_type": payload.symptom_type or existing["symptom_type"],
            "severity": payload.severity if payload.severity is not None else existing["severity"],
            "noted_at_utc": payload.noted_at_utc or existing["noted_at_utc"],
            "note": _normalize_text(payload.note) if "note" in payload.model_fields_set else existing["note"],
            "version": version,
        },
    ).fetchone()
    if row is None:
        raise bad_request("Could not update symptom log")
    return _symptom_row_to_model(dict(row))


def delete_symptom_log(conn: Connection, user_id: UUID, symptom_log_id: UUID, *, version: int) -> None:
    row = conn.execute(
        """
        UPDATE symptom_logs
        SET deleted_at = NOW(),
            version = %(version)s,
            updated_at_utc = NOW()
        WHERE symptom_log_id = %(symptom_log_id)s
          AND user_id = %(user_id)s
          AND deleted_at IS NULL
        RETURNING symptom_log_id
        """,
        {"symptom_log_id": symptom_log_id, "user_id": user_id, "version": version},
    ).fetchone()
    if row is None:
        raise not_found("Symptom log not found")
