#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from typing import Any
from uuid import UUID

from psycopg import connect
from psycopg.rows import dict_row

from app import sql
from app.config import get_settings
from app.consent_chain import build_event_payload, compute_event_hash


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Repair or audit user consent event hash chains.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply fixes in-place. Default mode is dry-run.",
    )
    parser.add_argument(
        "--user-id",
        type=UUID,
        help="Only process one user.",
    )
    return parser.parse_args()


def _iter_users(conn, user_id: UUID | None) -> list[UUID]:
    if user_id is not None:
        return [user_id]

    rows = conn.execute(
        """
        SELECT DISTINCT user_id
        FROM user_consent_ledger
        ORDER BY user_id ASC
        """
    ).fetchall()
    return [row["user_id"] for row in rows]


def _repair_user(conn, user_id: UUID, apply: bool) -> dict[str, Any]:
    rows = sql.fetch_all(conn, sql.SQL_GET_USER_CONSENT_EVENTS, {"user_id": user_id})
    expected_prev_by_consent: dict[str, str | None] = {}

    scanned = 0
    mismatched = 0
    rewritten = 0

    for row in rows:
        scanned += 1
        consent_id = str(row["consent_id"])
        expected_prev = expected_prev_by_consent.get(consent_id)
        payload = build_event_payload(
            consent_id=consent_id,
            event_type=row["event_type"],
            actor_type=row["actor_type"],
            actor_id=row["actor_id"],
            reason=row["reason"],
            metadata=row.get("metadata_json") or {},
            prev_hash=expected_prev,
        )
        expected_hash = compute_event_hash(payload)

        prev_mismatch = row.get("prev_hash") != expected_prev
        hash_mismatch = row.get("event_hash") != expected_hash
        if prev_mismatch or hash_mismatch:
            mismatched += 1
            if apply:
                conn.execute(
                    """
                    UPDATE user_consent_ledger_events
                    SET prev_hash = %(prev_hash)s,
                        event_hash = %(event_hash)s
                    WHERE event_id = %(event_id)s
                    """,
                    {
                        "prev_hash": expected_prev,
                        "event_hash": expected_hash,
                        "event_id": row["event_id"],
                    },
                )
                rewritten += 1

        # Chain continuity must use expected hash, even in dry-run mode.
        expected_prev_by_consent[consent_id] = expected_hash

    return {
        "user_id": str(user_id),
        "events_scanned": scanned,
        "events_mismatched": mismatched,
        "events_rewritten": rewritten,
    }


def main() -> int:
    args = _parse_args()
    settings = get_settings()

    report: dict[str, Any] = {
        "mode": "apply" if args.apply else "dry-run",
        "user_id_filter": str(args.user_id) if args.user_id else None,
        "users_scanned": 0,
        "events_scanned": 0,
        "events_mismatched": 0,
        "events_rewritten": 0,
        "failures": [],
        "users": [],
    }

    with connect(settings.api_db_url, row_factory=dict_row) as conn:
        users = _iter_users(conn, args.user_id)
        report["users_scanned"] = len(users)

        for user_id in users:
            try:
                user_report = _repair_user(conn, user_id, args.apply)
                report["users"].append(user_report)
                report["events_scanned"] += user_report["events_scanned"]
                report["events_mismatched"] += user_report["events_mismatched"]
                report["events_rewritten"] += user_report["events_rewritten"]
            except Exception as exc:  # noqa: BLE001
                report["failures"].append(
                    {
                        "user_id": str(user_id),
                        "error": str(exc),
                    }
                )

        if args.apply and not report["failures"]:
            conn.commit()
        else:
            conn.rollback()
            # Dry-run and failed apply both end without persisted writes.
            report["events_rewritten"] = 0
            for user_report in report["users"]:
                user_report["events_rewritten"] = 0

    print(json.dumps(report, indent=2, sort_keys=True))
    return 1 if report["failures"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
