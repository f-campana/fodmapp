#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from phase3_review_packet_overlay import synthesize_review_packet
from psycopg import connect
from psycopg.rows import dict_row

from app.config import get_settings

ROOT_DIR = Path(__file__).resolve().parents[2]
DBMATE_WRAPPER = ROOT_DIR / "scripts" / "dbmate.sh"
PHASE2_SQL_DIR = ROOT_DIR / "etl" / "phase2" / "sql"
PHASE3_SQL_DIR = ROOT_DIR / "etl" / "phase3" / "sql"
CIQUAL_ETL = ROOT_DIR / "etl" / "ciqual" / "ciqual_etl.py"
REVIEW_TEMPLATE_CSV = ROOT_DIR / "etl" / "phase3" / "decisions" / "phase3_swap_activation_review_v1.csv"

PHASE2_SQL_STEPS: tuple[tuple[str, Path], ...] = (
    ("phase2_priority_foods_setup", PHASE2_SQL_DIR / "phase2_priority_foods_setup.sql"),
    ("phase2_scaffold_views", PHASE2_SQL_DIR / "phase2_scaffold_views.sql"),
    ("phase2_resolver_pass2_candidates", PHASE2_SQL_DIR / "phase2_resolver_pass2_candidates.sql"),
    ("phase2_resolver_pass1", PHASE2_SQL_DIR / "phase2_resolver_pass1.sql"),
    ("phase2_batch01_apply", PHASE2_SQL_DIR / "phase2_batch01_apply.sql"),
    ("phase2_batch01_checks", PHASE2_SQL_DIR / "phase2_batch01_checks.sql"),
    ("phase2_ingest_batch10", PHASE2_SQL_DIR / "phase2_ingest_batch10.sql"),
    ("phase2_quarantine_rank2_garlic_powder", PHASE2_SQL_DIR / "phase2_quarantine_rank2_garlic_powder.sql"),
    ("phase2_status_sync_batch10", PHASE2_SQL_DIR / "phase2_status_sync_batch10.sql"),
    ("phase2_post_batch10_checks", PHASE2_SQL_DIR / "phase2_post_batch10_checks.sql"),
    ("phase2_fructan_wave01_apply", PHASE2_SQL_DIR / "phase2_fructan_wave01_apply.sql"),
    ("phase2_fructan_wave01_checks", PHASE2_SQL_DIR / "phase2_fructan_wave01_checks.sql"),
    ("phase2_fructan_wave02_apply", PHASE2_SQL_DIR / "phase2_fructan_wave02_apply.sql"),
    ("phase2_fructan_wave02_checks", PHASE2_SQL_DIR / "phase2_fructan_wave02_checks.sql"),
    ("phase2_gos_wave01_apply", PHASE2_SQL_DIR / "phase2_gos_wave01_apply.sql"),
    ("phase2_gos_wave01_checks", PHASE2_SQL_DIR / "phase2_gos_wave01_checks.sql"),
    ("phase2_gos_wave02_apply", PHASE2_SQL_DIR / "phase2_gos_wave02_apply.sql"),
    ("phase2_gos_wave02_checks", PHASE2_SQL_DIR / "phase2_gos_wave02_checks.sql"),
    ("phase2_polyol_wave01_apply", PHASE2_SQL_DIR / "phase2_polyol_wave01_apply.sql"),
    ("phase2_polyol_wave01_checks", PHASE2_SQL_DIR / "phase2_polyol_wave01_checks.sql"),
    ("phase2_polyol_wave02_apply", PHASE2_SQL_DIR / "phase2_polyol_wave02_apply.sql"),
    ("phase2_polyol_wave02_checks", PHASE2_SQL_DIR / "phase2_polyol_wave02_checks.sql"),
    ("phase2_replay_final_checks", PHASE2_SQL_DIR / "phase2_replay_final_checks.sql"),
)

PHASE3_PRE_REVIEW_SQL_STEPS: tuple[tuple[str, Path], ...] = (
    ("phase3_traits_apply", PHASE3_SQL_DIR / "phase3_traits_apply.sql"),
    ("phase3_safe_harbor_v1_apply", PHASE3_SQL_DIR / "phase3_safe_harbor_v1_apply.sql"),
    ("phase3_safe_harbor_v1_checks", PHASE3_SQL_DIR / "phase3_safe_harbor_v1_checks.sql"),
    ("phase3_rollups_compute", PHASE3_SQL_DIR / "phase3_rollups_compute.sql"),
    ("phase3_rollups_6subtype_checks", PHASE3_SQL_DIR / "phase3_rollups_6subtype_checks.sql"),
    ("phase3_swap_rules_apply", PHASE3_SQL_DIR / "phase3_swap_rules_apply.sql"),
)

PHASE3_POST_REVIEW_SQL_STEPS: tuple[tuple[str, Path], ...] = (
    ("phase3_swap_activation_apply", PHASE3_SQL_DIR / "phase3_swap_activation_apply.sql"),
    ("phase3_swap_activation_checks", PHASE3_SQL_DIR / "phase3_swap_activation_checks.sql"),
    ("phase3_mvp_checks", PHASE3_SQL_DIR / "phase3_mvp_checks.sql"),
    ("phase3_publish_release_apply", PHASE3_SQL_DIR / "phase3_publish_release_apply.sql"),
    ("phase3_publish_release_checks", PHASE3_SQL_DIR / "phase3_publish_release_checks.sql"),
)

ALL_REQUIRED_SQL_STEPS = (
    PHASE2_SQL_STEPS
    + PHASE3_PRE_REVIEW_SQL_STEPS
    + (("phase3_swap_rules_rescore", PHASE3_SQL_DIR / "phase3_swap_rules_rescore.sql"),)
    + PHASE3_POST_REVIEW_SQL_STEPS
)

REQUIRED_RELATIONS = {
    "sources": "public.sources",
    "nutrient_definitions": "public.nutrient_definitions",
    "foods": "public.foods",
    "food_external_refs": "public.food_external_refs",
    "phase2_priority_foods": "public.phase2_priority_foods",
    "food_fodmap_measurements": "public.food_fodmap_measurements",
    "food_fodmap_thresholds": "public.food_fodmap_thresholds",
    "food_culinary_roles": "public.food_culinary_roles",
    "food_flavor_profiles": "public.food_flavor_profiles",
    "food_texture_profiles": "public.food_texture_profiles",
    "food_cooking_behaviors": "public.food_cooking_behaviors",
    "food_cuisine_affinities": "public.food_cuisine_affinities",
    "safe_harbor_cohorts": "public.safe_harbor_cohorts",
    "food_safe_harbor_assignments": "public.food_safe_harbor_assignments",
    "swap_rules": "public.swap_rules",
    "swap_rule_scores": "public.swap_rule_scores",
    "publish_releases": "public.publish_releases",
    "publish_release_current": "public.publish_release_current",
    "api_publish_meta_current": "public.api_publish_meta_current",
}

BOOTSTRAP_SCHEMA_ONLY_MESSAGE = (
    "Phase 3 bootstrap runner only initializes a dbmate-migrated schema-only persistent database; "
    "partial or already-bootstrapped databases are out of scope for this branch."
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initial persistent Phase 2/Phase 3 bootstrap runner for schema-only databases."
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
        raise RuntimeError("dbmate status is not clean for API_DB_URL; run pnpm db:migrate before phase3 bootstrap.")
    return output


def ensure_operator_files_exist() -> None:
    missing = [str(path) for _, path in ALL_REQUIRED_SQL_STEPS if not path.is_file()]
    required_files = [CIQUAL_ETL, REVIEW_TEMPLATE_CSV]
    missing.extend(str(path) for path in required_files if not path.is_file())
    if missing:
        raise RuntimeError(f"Missing required bootstrap files: {', '.join(missing)}")


def resolve_ciqual_paths() -> dict[str, Path]:
    ciqual_data_dir = Path(os.getenv("CIQUAL_DATA_DIR", str(ROOT_DIR / "etl" / "ciqual" / "data" / "raw")))
    ciqual_xlsx = Path(os.getenv("CIQUAL_XLSX", str(ciqual_data_dir / "Table Ciqual 2025_ENG_2025_11_03.xlsx")))
    ciqual_alim_xml = Path(os.getenv("CIQUAL_ALIM_XML", str(ciqual_data_dir / "alim_2025_11_03.xml")))
    ciqual_grp_xml = Path(os.getenv("CIQUAL_GRP_XML", str(ciqual_data_dir / "alim_grp_2025_11_03.xml")))
    return {
        "CIQUAL_XLSX": ciqual_xlsx,
        "CIQUAL_ALIM_XML": ciqual_alim_xml,
        "CIQUAL_GRP_XML": ciqual_grp_xml,
    }


def require_ciqual_files() -> dict[str, str]:
    resolved = resolve_ciqual_paths()
    missing = [f"{env_name}={path}" for env_name, path in resolved.items() if not path.is_file()]
    if missing:
        raise RuntimeError("Missing required CIQUAL files for phase3 bootstrap: " + ", ".join(missing))
    return {env_name: str(path) for env_name, path in resolved.items()}


def fetch_one(conn, query: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    row = conn.execute(query, params or {}).fetchone()
    if row is None:
        return {}
    return dict(row)


def collect_relation_state(conn) -> dict[str, bool]:
    select_parts = [f"to_regclass(%({name})s) IS NOT NULL AS {name}_exists" for name in REQUIRED_RELATIONS]
    raw = fetch_one(conn, "SELECT " + ",\n       ".join(select_parts), REQUIRED_RELATIONS)
    return {name: bool(raw.get(f"{name}_exists")) for name in REQUIRED_RELATIONS}


def collect_bootstrap_state(conn) -> dict[str, Any]:
    query = """
    SELECT
      (SELECT COUNT(*)::int FROM foods) AS foods_count,
      (SELECT COUNT(*)::int FROM food_external_refs WHERE ref_system = 'CIQUAL') AS ciqual_ref_count,
      (SELECT COUNT(*)::int FROM phase2_priority_foods) AS phase2_priority_count,
      (
        SELECT COUNT(*)::int
        FROM phase2_priority_foods
        WHERE resolved_food_id IS NOT NULL
      ) AS resolved_priority_count,
      (SELECT COUNT(*)::int FROM food_fodmap_measurements) AS measurement_rows_count,
      (SELECT COUNT(*)::int FROM food_fodmap_thresholds) AS threshold_rows_count,
      (
        (SELECT COUNT(*)::int FROM food_culinary_roles)
        + (SELECT COUNT(*)::int FROM food_flavor_profiles)
        + (SELECT COUNT(*)::int FROM food_texture_profiles)
        + (SELECT COUNT(*)::int FROM food_cooking_behaviors)
        + (SELECT COUNT(*)::int FROM food_cuisine_affinities)
      ) AS trait_rows_count,
      (
        SELECT COUNT(*)::int
        FROM food_safe_harbor_assignments
        WHERE assignment_version = 'safe_harbor_v1'
      ) AS safe_harbor_assignment_count,
      (SELECT COUNT(*)::int FROM swap_rules) AS swap_rule_count,
      (SELECT COUNT(*)::int FROM swap_rule_scores) AS swap_rule_score_count,
      (
        SELECT COUNT(*)::int
        FROM publish_releases
        WHERE release_kind = 'api_v0_phase3'
      ) AS publish_release_count,
      EXISTS (
        SELECT 1
        FROM publish_release_current
        WHERE release_kind = 'api_v0_phase3'
      ) AS has_current_publish_release,
      EXISTS (
        SELECT 1 FROM sources WHERE source_slug = 'internal_rules_v1'
      ) AS has_internal_rules_source,
      EXISTS (
        SELECT 1 FROM sources WHERE source_slug = 'ciqual_2025'
      ) AS has_ciqual_source
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
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_swap_count,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_swap_count
      FROM swap_rules
    )
    SELECT
      (SELECT COUNT(*)::int FROM phase2_priority_foods) AS phase2_priority_count,
      (
        SELECT COUNT(*)::int
        FROM phase2_priority_foods
        WHERE resolved_food_id IS NOT NULL
      ) AS resolved_priority_count,
      cr.publish_id,
      cr.published_at,
      cr.rollup_computed_at_max,
      COALESCE(cr.rollup_row_count, 0)::int AS rollup_row_count,
      COALESCE(cr.subtype_row_count, 0)::int AS subtype_row_count,
      COALESCE(cr.swap_row_count, 0)::int AS swap_row_count,
      sc.active_swap_count,
      sc.draft_swap_count
    FROM swap_counts sc
    LEFT JOIN current_release cr ON TRUE
    """
    row = fetch_one(conn, query)
    return {
        "phase2_priority_count": int(row.get("phase2_priority_count") or 0),
        "resolved_priority_count": int(row.get("resolved_priority_count") or 0),
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
    ciqual_paths = require_ciqual_files()

    relation_state = collect_relation_state(conn)
    missing_relations = [name for name, exists in relation_state.items() if not exists]
    if missing_relations:
        raise RuntimeError(
            "Phase 3 bootstrap preflight failed: missing required schema objects: "
            + ", ".join(sorted(missing_relations))
        )

    dbmate_status = require_dbmate_clean(api_db_url)
    data_state = collect_bootstrap_state(conn)

    if not bool(data_state.get("has_internal_rules_source")) or not bool(data_state.get("has_ciqual_source")):
        raise RuntimeError("Phase 3 bootstrap preflight failed: required source slugs are missing from the schema.")

    schema_only = (
        data_state.get("foods_count", 0) == 0
        and data_state.get("ciqual_ref_count", 0) == 0
        and data_state.get("phase2_priority_count", 0) == 42
        and data_state.get("resolved_priority_count", 0) == 0
        and data_state.get("measurement_rows_count", 0) == 0
        and data_state.get("threshold_rows_count", 0) == 0
        and data_state.get("trait_rows_count", 0) == 0
        and data_state.get("safe_harbor_assignment_count", 0) == 0
        and data_state.get("swap_rule_count", 0) == 0
        and data_state.get("swap_rule_score_count", 0) == 0
        and data_state.get("publish_release_count", 0) == 0
        and not bool(data_state.get("has_current_publish_release"))
    )

    if not schema_only:
        raise RuntimeError(BOOTSTRAP_SCHEMA_ONLY_MESSAGE)

    return {
        "dbmate_status": dbmate_status,
        "ciqual_paths": ciqual_paths,
        "relation_state": relation_state,
        "data_state": data_state,
    }


def run_sql_file(
    sql_path: Path,
    api_db_url: str,
    psql_bin: str,
    variables: dict[str, str] | None = None,
    env_overrides: dict[str, str] | None = None,
) -> None:
    args = [psql_bin, api_db_url, "-v", "ON_ERROR_STOP=1"]
    for key, value in (variables or {}).items():
        args.extend(["-v", f"{key}={value}"])
    args.extend(["-f", str(sql_path)])

    env = os.environ.copy()
    env.update(env_overrides or {})
    proc = run_subprocess(args, env=env, capture_output=True)
    if proc.returncode != 0:
        stderr = proc.stderr.strip() or proc.stdout.strip() or f"psql failed for {sql_path.name}"
        raise RuntimeError(f"{sql_path.name} failed: {stderr}")


def run_ciqual_load(api_db_url: str, ciqual_paths: dict[str, str]) -> None:
    proc = run_subprocess(
        [
            sys.executable,
            str(CIQUAL_ETL),
            "load",
            ciqual_paths["CIQUAL_XLSX"],
            "--alim-xml",
            ciqual_paths["CIQUAL_ALIM_XML"],
            "--alim-grp-xml",
            ciqual_paths["CIQUAL_GRP_XML"],
            "--db-url",
            api_db_url,
        ],
        env=os.environ.copy(),
        capture_output=True,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip() or proc.stdout.strip() or "CIQUAL load failed"
        raise RuntimeError(f"ciqual_etl.py load failed: {stderr}")


def command_check(api_db_url: str, manifest_out: Path | None) -> int:
    payload: dict[str, Any] = {
        "command": "check",
        "checked_at": isoformat_utc(utc_now()),
    }

    try:
        ensure_operator_files_exist()
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
        ensure_operator_files_exist()
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


def append_step(
    payload: dict[str, Any],
    *,
    name: str,
    started_at: datetime,
    extra: dict[str, Any] | None = None,
) -> None:
    step_payload = {
        "name": name,
        "started_at": isoformat_utc(started_at),
        "finished_at": isoformat_utc(utc_now()),
    }
    if extra:
        step_payload.update(extra)
    payload.setdefault("steps", []).append(step_payload)


def command_run(api_db_url: str, psql_bin: str, manifest_out: Path | None) -> int:
    started_at = utc_now()
    payload: dict[str, Any] = {
        "command": "run",
        "started_at": isoformat_utc(started_at),
        "steps": [],
    }

    try:
        ensure_operator_files_exist()
        with connect(api_db_url, row_factory=dict_row) as conn:
            preflight = collect_preflight(conn, api_db_url)
        payload["preflight"] = preflight
        ciqual_paths = preflight["ciqual_paths"]

        step_started_at = utc_now()
        run_ciqual_load(api_db_url, ciqual_paths)
        append_step(
            payload,
            name="ciqual_load",
            started_at=step_started_at,
            extra={"ciqual_paths": ciqual_paths},
        )

        for step_name, sql_path in PHASE2_SQL_STEPS + PHASE3_PRE_REVIEW_SQL_STEPS:
            step_started_at = utc_now()
            run_sql_file(sql_path, api_db_url, psql_bin)
            append_step(
                payload,
                name=step_name,
                started_at=step_started_at,
                extra={"sql_file": str(sql_path.relative_to(ROOT_DIR))},
            )

        with tempfile.TemporaryDirectory(prefix=".tmp-phase3-bootstrap-", dir=ROOT_DIR) as temp_dir_name:
            temp_dir = Path(temp_dir_name)
            review_export_path = temp_dir / "phase3_swap_activation_review_export.csv"
            review_packet_path = temp_dir / "phase3_swap_activation_review_packet.csv"

            step_started_at = utc_now()
            run_sql_file(
                PHASE3_SQL_DIR / "phase3_swap_rules_rescore.sql",
                api_db_url,
                psql_bin,
                env_overrides={"PHASE3_REVIEW_EXPORT_PATH": str(review_export_path)},
            )
            append_step(
                payload,
                name="phase3_swap_rules_rescore",
                started_at=step_started_at,
                extra={
                    "sql_file": str((PHASE3_SQL_DIR / "phase3_swap_rules_rescore.sql").relative_to(ROOT_DIR)),
                    "review_export_path": str(review_export_path),
                },
            )

            step_started_at = utc_now()
            overlay_stats = synthesize_review_packet(
                review_template_path=REVIEW_TEMPLATE_CSV,
                rescore_export_path=review_export_path,
                output_path=review_packet_path,
            )
            append_step(
                payload,
                name="phase3_review_packet_overlay",
                started_at=step_started_at,
                extra={
                    "review_template_path": str(REVIEW_TEMPLATE_CSV.relative_to(ROOT_DIR)),
                    "review_export_path": str(review_export_path),
                    "review_packet_path": str(review_packet_path),
                    **overlay_stats,
                },
            )

            activation_env = {"PHASE3_REVIEW_CSV_PATH": str(review_packet_path)}
            for step_name, sql_path in PHASE3_POST_REVIEW_SQL_STEPS:
                step_started_at = utc_now()
                env_overrides = (
                    activation_env
                    if step_name
                    in {
                        "phase3_swap_activation_apply",
                        "phase3_swap_activation_checks",
                    }
                    else None
                )
                run_sql_file(sql_path, api_db_url, psql_bin, env_overrides=env_overrides)
                step_extra: dict[str, Any] = {"sql_file": str(sql_path.relative_to(ROOT_DIR))}
                if env_overrides:
                    step_extra["review_csv_path"] = str(review_packet_path)
                append_step(payload, name=step_name, started_at=step_started_at, extra=step_extra)

        with connect(api_db_url, row_factory=dict_row) as conn:
            payload.update(collect_status(conn))

        if not payload.get("publish_id"):
            raise RuntimeError("Phase 3 bootstrap completed but no current publish release was created.")

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
