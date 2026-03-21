#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from psycopg import connect
from psycopg.rows import dict_row

from app.config import get_settings

ROOT_DIR = Path(__file__).resolve().parents[2]
DBMATE_WRAPPER = ROOT_DIR / "scripts" / "dbmate.sh"
PHASE3_SQL_DIR = ROOT_DIR / "etl" / "phase3" / "sql"

PRE_PUBLISH_SQL_STEPS: tuple[tuple[str, Path], ...] = (
    ("phase3_traits_apply", PHASE3_SQL_DIR / "phase3_traits_apply.sql"),
    ("phase3_safe_harbor_v1_apply", PHASE3_SQL_DIR / "phase3_safe_harbor_v1_apply.sql"),
    ("phase3_safe_harbor_v1_checks", PHASE3_SQL_DIR / "phase3_safe_harbor_v1_checks.sql"),
    ("phase3_rollups_compute", PHASE3_SQL_DIR / "phase3_rollups_compute.sql"),
    ("phase3_rollups_6subtype_checks", PHASE3_SQL_DIR / "phase3_rollups_6subtype_checks.sql"),
    ("phase3_active_swap_scores_refresh", PHASE3_SQL_DIR / "phase3_active_swap_scores_refresh.sql"),
    ("phase3_active_swap_scores_checks", PHASE3_SQL_DIR / "phase3_active_swap_scores_checks.sql"),
)

PUBLISH_SQL_STEPS: tuple[tuple[str, Path], ...] = (
    ("phase3_publish_release_apply", PHASE3_SQL_DIR / "phase3_publish_release_apply.sql"),
    ("phase3_publish_release_checks", PHASE3_SQL_DIR / "phase3_publish_release_checks.sql"),
)

PROMOTE_SQL_STEPS: tuple[tuple[str, Path], ...] = PRE_PUBLISH_SQL_STEPS + PUBLISH_SQL_STEPS

REQUIRED_RELATIONS = {
    "foods": "public.foods",
    "phase2_priority_foods": "public.phase2_priority_foods",
    "food_fodmap_measurements": "public.food_fodmap_measurements",
    "food_fodmap_thresholds": "public.food_fodmap_thresholds",
    "swap_rules": "public.swap_rules",
    "swap_rule_scores": "public.swap_rule_scores",
    "publish_releases": "public.publish_releases",
    "publish_release_current": "public.publish_release_current",
    "safe_harbor_cohorts": "public.safe_harbor_cohorts",
    "api_publish_meta_current": "public.api_publish_meta_current",
}

BOOTSTRAP_OUT_OF_SCOPE_MESSAGE = (
    "Phase 3 promote runner only refreshes an already-loaded persistent database; "
    "first persistent bootstrap is out of scope for this branch."
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Manual non-destructive Phase 3 promote runner for persistent databases."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    for command in ("check", "run", "status"):
        command_parser = subparsers.add_parser(command, help=f"Run `{command}`.")
        command_parser.add_argument(
            "--manifest-out",
            type=Path,
            help="Optional path to write the JSON manifest/status payload.",
        )
    argv = sys.argv[1:]
    if len(argv) >= 2 and argv[1] == "--":
        argv = [argv[0], *argv[2:]]
    return parser.parse_args(argv)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def isoformat_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(timezone.utc).isoformat()


def run_subprocess(
    args: list[str],
    *,
    env: dict[str, str] | None = None,
    capture_output: bool = False,
    input_text: str | None = None,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=ROOT_DIR,
        env=env,
        check=False,
        text=True,
        input=input_text,
        capture_output=capture_output,
    )


def emit_payload(payload: dict[str, Any], manifest_out: Path | None) -> None:
    rendered = json.dumps(payload, indent=2, sort_keys=True)
    print(rendered)
    if manifest_out is not None:
        manifest_out.parent.mkdir(parents=True, exist_ok=True)
        manifest_out.write_text(rendered + "\n", encoding="utf-8")


def ensure_sql_files_exist() -> None:
    missing = [str(path) for _, path in PROMOTE_SQL_STEPS if not path.is_file()]
    if missing:
        raise RuntimeError(f"Missing required Phase 3 SQL files: {', '.join(missing)}")


def strip_transaction_wrapper(sql_path: Path) -> str:
    lines = sql_path.read_text(encoding="utf-8").splitlines()
    body = [line for line in lines if line.strip()]

    while body and body[0].lstrip().startswith("\\set "):
        body = body[1:]

    if not body or not body[0].strip().upper().startswith("BEGIN"):
        raise RuntimeError(f"{sql_path.name} must begin with BEGIN so phase3:promote can bundle publish atomically.")

    if body[-1].strip().upper() != "COMMIT;":
        raise RuntimeError(f"{sql_path.name} must end with COMMIT; so phase3:promote can bundle publish atomically.")

    return "\n".join(body[1:-1]).strip()


def build_atomic_publish_bundle() -> str:
    rendered_sections = [
        "\\set ON_ERROR_STOP on",
        "",
        "BEGIN ISOLATION LEVEL REPEATABLE READ;",
        "",
    ]

    for step_name, sql_path in PUBLISH_SQL_STEPS:
        rendered_sections.extend(
            [
                f"-- bundled from {sql_path.relative_to(ROOT_DIR)} ({step_name})",
                strip_transaction_wrapper(sql_path),
                "",
            ]
        )

    rendered_sections.append("COMMIT;")
    rendered_sections.append("")
    return "\n".join(rendered_sections)


def require_dbmate_clean(api_db_url: str) -> str:
    env = os.environ.copy()
    env["API_DB_URL"] = api_db_url
    proc = run_subprocess(
        [str(DBMATE_WRAPPER), "status"],
        env=env,
        capture_output=True,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip() or proc.stdout.strip() or "dbmate status failed"
        raise RuntimeError(f"dbmate status failed: {stderr}")

    output = proc.stdout.strip()
    if "Pending: 0" not in output:
        raise RuntimeError("dbmate status is not clean for API_DB_URL; run pnpm db:migrate before phase3 promote.")
    return output


def fetch_one(conn, query: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    row = conn.execute(query, params or {}).fetchone()
    if row is None:
        return {}
    return dict(row)


def collect_relation_state(conn) -> dict[str, bool]:
    query = """
    SELECT
      to_regclass(%(foods)s) IS NOT NULL AS foods_exists,
      to_regclass(%(phase2_priority_foods)s) IS NOT NULL AS phase2_priority_foods_exists,
      to_regclass(%(food_fodmap_measurements)s) IS NOT NULL AS food_fodmap_measurements_exists,
      to_regclass(%(food_fodmap_thresholds)s) IS NOT NULL AS food_fodmap_thresholds_exists,
      to_regclass(%(swap_rules)s) IS NOT NULL AS swap_rules_exists,
      to_regclass(%(swap_rule_scores)s) IS NOT NULL AS swap_rule_scores_exists,
      to_regclass(%(publish_releases)s) IS NOT NULL AS publish_releases_exists,
      to_regclass(%(publish_release_current)s) IS NOT NULL AS publish_release_current_exists,
      to_regclass(%(safe_harbor_cohorts)s) IS NOT NULL AS safe_harbor_cohorts_exists,
      to_regclass(%(api_publish_meta_current)s) IS NOT NULL AS api_publish_meta_current_exists
    """
    raw = fetch_one(conn, query, REQUIRED_RELATIONS)
    return {
        "foods": bool(raw.get("foods_exists")),
        "phase2_priority_foods": bool(raw.get("phase2_priority_foods_exists")),
        "food_fodmap_measurements": bool(raw.get("food_fodmap_measurements_exists")),
        "food_fodmap_thresholds": bool(raw.get("food_fodmap_thresholds_exists")),
        "swap_rules": bool(raw.get("swap_rules_exists")),
        "swap_rule_scores": bool(raw.get("swap_rule_scores_exists")),
        "publish_releases": bool(raw.get("publish_releases_exists")),
        "publish_release_current": bool(raw.get("publish_release_current_exists")),
        "safe_harbor_cohorts": bool(raw.get("safe_harbor_cohorts_exists")),
        "api_publish_meta_current": bool(raw.get("api_publish_meta_current_exists")),
    }


def collect_data_state(conn) -> dict[str, Any]:
    query = """
    SELECT
      (SELECT COUNT(*)::int FROM foods) AS foods_count,
      (SELECT COUNT(*)::int FROM phase2_priority_foods) AS priority_rows_count,
      (
        SELECT COUNT(*)::int
        FROM phase2_priority_foods
        WHERE resolved_food_id IS NOT NULL
      ) AS resolved_priority_rows_count,
      (SELECT COUNT(*)::int FROM food_fodmap_measurements) AS measurement_rows_count,
      (SELECT COUNT(*)::int FROM food_fodmap_thresholds) AS threshold_rows_count,
      EXISTS (
        SELECT 1 FROM sources WHERE source_slug = 'internal_rules_v1'
      ) AS has_internal_rules_source,
      EXISTS (
        SELECT 1 FROM sources WHERE source_slug = 'ciqual_2025'
      ) AS has_ciqual_source,
      EXISTS (
        SELECT 1
        FROM publish_release_current cur
        JOIN publish_releases pr ON pr.publish_id = cur.publish_id
        WHERE cur.release_kind = 'api_v0_phase3'
          AND pr.release_kind = 'api_v0_phase3'
      ) AS has_current_publish_release
    """
    return fetch_one(conn, query)


def collect_status(conn) -> dict[str, Any]:
    query = """
    WITH current_release AS (
      SELECT
        pr.publish_id::text AS publish_id,
        pr.published_at,
        pr.rollup_computed_at_max,
        pr.rollup_row_count,
        pr.subtype_row_count,
        pr.swap_row_count
      FROM publish_release_current cur
      JOIN publish_releases pr ON pr.publish_id = cur.publish_id
      WHERE cur.release_kind = 'api_v0_phase3'
    ),
    swap_counts AS (
      SELECT
        COUNT(*) FILTER (WHERE r.status = 'active')::int AS active_swap_count,
        COUNT(*) FILTER (WHERE r.status = 'draft')::int AS draft_swap_count
      FROM swap_rules r
    )
    SELECT
      cr.publish_id,
      cr.published_at,
      cr.rollup_computed_at_max,
      cr.rollup_row_count,
      cr.subtype_row_count,
      cr.swap_row_count,
      sc.active_swap_count,
      sc.draft_swap_count
    FROM swap_counts sc
    LEFT JOIN current_release cr ON TRUE
    """
    row = fetch_one(conn, query)
    return {
        "publish_id": row.get("publish_id"),
        "published_at": isoformat_utc(row.get("published_at")),
        "rollup_computed_at_max": isoformat_utc(row.get("rollup_computed_at_max")),
        "rollup_row_count": int(row.get("rollup_row_count") or 0),
        "subtype_row_count": int(row.get("subtype_row_count") or 0),
        "swap_row_count": int(row.get("swap_row_count") or 0),
        "active_swap_count": int(row.get("active_swap_count") or 0),
        "draft_swap_count": int(row.get("draft_swap_count") or 0),
    }


def collect_preflight(conn, api_db_url: str) -> dict[str, Any]:
    relation_state = collect_relation_state(conn)
    missing_relations = [name for name, exists in relation_state.items() if not exists]
    if missing_relations:
        raise RuntimeError(
            "Phase 3 promote preflight failed: missing required schema objects: " + ", ".join(sorted(missing_relations))
        )

    dbmate_status = require_dbmate_clean(api_db_url)
    data_state = collect_data_state(conn)

    ready = (
        data_state.get("foods_count", 0) > 0
        and data_state.get("priority_rows_count", 0) > 0
        and data_state.get("resolved_priority_rows_count", 0) > 0
        and data_state.get("measurement_rows_count", 0) > 0
        and data_state.get("threshold_rows_count", 0) > 0
        and bool(data_state.get("has_internal_rules_source"))
        and bool(data_state.get("has_ciqual_source"))
        and bool(data_state.get("has_current_publish_release"))
    )
    if not ready:
        raise RuntimeError(BOOTSTRAP_OUT_OF_SCOPE_MESSAGE)

    return {
        "dbmate_status": dbmate_status,
        "relation_state": relation_state,
        "data_state": data_state,
    }


def run_sql_file(sql_path: Path, api_db_url: str, psql_bin: str) -> None:
    proc = run_subprocess(
        [psql_bin, api_db_url, "-v", "ON_ERROR_STOP=1", "-f", str(sql_path)],
        env=os.environ.copy(),
        capture_output=True,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip() or proc.stdout.strip() or f"psql failed for {sql_path.name}"
        raise RuntimeError(f"{sql_path.name} failed: {stderr}")


def run_atomic_publish_bundle(api_db_url: str, psql_bin: str) -> None:
    bundled_sql = build_atomic_publish_bundle()
    proc = run_subprocess(
        [psql_bin, api_db_url, "-v", "ON_ERROR_STOP=1", "-f", "-"],
        env=os.environ.copy(),
        capture_output=True,
        input_text=bundled_sql,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip() or proc.stdout.strip() or "atomic publish bundle failed"
        raise RuntimeError(f"phase3 publish bundle failed: {stderr}")


def command_check(api_db_url: str, manifest_out: Path | None) -> int:
    payload: dict[str, Any] = {
        "command": "check",
        "checked_at": isoformat_utc(utc_now()),
    }

    try:
        ensure_sql_files_exist()
        with connect(api_db_url, row_factory=dict_row) as conn:
            payload["preflight"] = collect_preflight(conn, api_db_url)
            payload["status"] = collect_status(conn)
        payload["ok"] = True
        emit_payload(payload, manifest_out)
        return 0
    except Exception as exc:  # noqa: BLE001
        payload["ok"] = False
        payload["error"] = str(exc)
        emit_payload(payload, manifest_out)
        return 1


def command_status(api_db_url: str, manifest_out: Path | None) -> int:
    payload: dict[str, Any] = {
        "command": "status",
        "checked_at": isoformat_utc(utc_now()),
    }

    try:
        with connect(api_db_url, row_factory=dict_row) as conn:
            payload["status"] = collect_status(conn)
        payload["ok"] = True
        emit_payload(payload, manifest_out)
        return 0
    except Exception as exc:  # noqa: BLE001
        payload["ok"] = False
        payload["error"] = str(exc)
        emit_payload(payload, manifest_out)
        return 1


def command_run(api_db_url: str, psql_bin: str, manifest_out: Path | None) -> int:
    started_at = utc_now()
    payload: dict[str, Any] = {
        "command": "run",
        "started_at": isoformat_utc(started_at),
        "steps": [],
    }

    try:
        ensure_sql_files_exist()
        with connect(api_db_url, row_factory=dict_row) as conn:
            payload["preflight"] = collect_preflight(conn, api_db_url)

        for step_name, sql_path in PRE_PUBLISH_SQL_STEPS:
            step_started_at = utc_now()
            run_sql_file(sql_path, api_db_url, psql_bin)
            payload["steps"].append(
                {
                    "name": step_name,
                    "sql_file": str(sql_path.relative_to(ROOT_DIR)),
                    "started_at": isoformat_utc(step_started_at),
                    "finished_at": isoformat_utc(utc_now()),
                }
            )

        publish_started_at = utc_now()
        run_atomic_publish_bundle(api_db_url, psql_bin)
        publish_finished_at = utc_now()
        for step_name, sql_path in PUBLISH_SQL_STEPS:
            payload["steps"].append(
                {
                    "name": step_name,
                    "sql_file": str(sql_path.relative_to(ROOT_DIR)),
                    "started_at": isoformat_utc(publish_started_at),
                    "finished_at": isoformat_utc(publish_finished_at),
                    "atomic_group": "phase3_publish_release",
                }
            )

        with connect(api_db_url, row_factory=dict_row) as conn:
            payload.update(collect_status(conn))

        if not payload.get("publish_id"):
            raise RuntimeError("Phase 3 promote completed but no current publish release was created.")

        payload["finished_at"] = isoformat_utc(utc_now())
        payload["ok"] = True
        emit_payload(payload, manifest_out)
        return 0
    except Exception as exc:  # noqa: BLE001
        payload["finished_at"] = isoformat_utc(utc_now())
        payload["ok"] = False
        payload["error"] = str(exc)
        emit_payload(payload, manifest_out)
        return 1


def main() -> int:
    args = parse_args()
    settings = get_settings()
    api_db_url = settings.api_db_url
    psql_bin = os.getenv("PSQL_BIN", "psql")

    if args.command == "check":
        return command_check(api_db_url, args.manifest_out)
    if args.command == "status":
        return command_status(api_db_url, args.manifest_out)
    return command_run(api_db_url, psql_bin, args.manifest_out)


if __name__ == "__main__":
    raise SystemExit(main())
