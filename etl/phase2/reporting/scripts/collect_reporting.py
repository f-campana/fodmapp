#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import pathlib
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Set
from urllib.parse import urlparse


NOW_FIGURE_IDS = {
    "P-01_stage_progression_contract_curve",
    "P-02_candidate_pool_split_by_stage",
    "P-03_gap_completion_matrix",
    "Q-02_critical_contract_scorecard",
    "Q-03_snapshot_lock_drift_panel",
    "Q-04_rank2_exclusion_audit",
    "E-03_threshold_provenance_completeness",
    "E-04_rank2_quarantine_case_study",
}

TRIGGER_VALUES = {
    "pr_smoke",
    "main_full",
    "manual_full",
    "manual_baseline_update",
}

FIGURE_SQL_FILE = {
    "P-01_stage_progression_contract_curve": "p01_stage_progression.sql",
    "P-02_candidate_pool_split_by_stage": "p02_candidate_pool_split.sql",
    "P-03_gap_completion_matrix": "p03_gap_completion_matrix.sql",
    "Q-02_critical_contract_scorecard": "q02_critical_contract_scorecard.sql",
    "Q-03_snapshot_lock_drift_panel": "q03_snapshot_lock_drift.sql",
    "Q-04_rank2_exclusion_audit": "q04_rank2_exclusion_audit.sql",
    "E-03_threshold_provenance_completeness": "e03_threshold_provenance.sql",
    "E-04_rank2_quarantine_case_study": "e04_frozen_case_study.sql",
}

ROW_COUNT_KEYS = {
    "P-01_stage_progression_contract_curve": "stages",
    "P-02_candidate_pool_split_by_stage": "stages",
    "P-03_gap_completion_matrix": "bucket_rows",
}


def fail(message: str) -> int:
    print(f"[FAIL] {message}", file=sys.stderr)
    return 1


def _load_json(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: pathlib.Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")


def _sha256_bytes(payload: bytes) -> str:
    return f"sha256:{hashlib.sha256(payload).hexdigest()}"


def _file_sha256(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def _sanitize_db_ref(db_url: str) -> Dict[str, Any]:
    parsed = urlparse(db_url)
    host = parsed.hostname or "unknown-host"
    database = (parsed.path or "/").lstrip("/") or "unknown-db"
    return {
        "source_db_ref": f"db://{host}/{database}",
        "source_db_meta": {
            "kind": "db",
            "host": host,
            "database": database,
            "redacted": True,
        },
    }


def _source_meta_for_fixture() -> Dict[str, Any]:
    return {
        "source_db_ref": "fixture://now-set",
        "source_db_meta": {
            "kind": "fixture",
            "host": None,
            "database": None,
            "redacted": False,
        },
    }


def _resolve_requested_figures(figures_arg: str) -> Set[str]:
    if figures_arg == "now":
        return set(NOW_FIGURE_IDS)
    if figures_arg == "all":
        return set(FIGURE_SQL_FILE.keys())
    requested = {item.strip() for item in figures_arg.split(",") if item.strip()}
    unknown = requested - set(FIGURE_SQL_FILE.keys())
    if unknown:
        raise ValueError(f"unknown figure ids requested: {sorted(unknown)}")
    return requested


def _stable_row_count(figure_id: str, metrics: Dict[str, Any]) -> int:
    key = ROW_COUNT_KEYS.get(figure_id)
    if key is None:
        return 1
    series = metrics.get(key)
    if not isinstance(series, list):
        raise ValueError(f"{figure_id} metrics missing list key '{key}'")
    return len(series)


def _validate_semantics(figure_id: str, metrics: Dict[str, Any]) -> List[str]:
    errors: List[str] = []

    if figure_id == "Q-03_snapshot_lock_drift_panel":
        if int(metrics.get("reviewed_snapshot_rows", 0)) < 1:
            errors.append("Q-03 reviewed_snapshot_rows must be >= 1")

    if figure_id == "E-04_rank2_quarantine_case_study":
        if metrics.get("mode") != "frozen_case_study":
            errors.append("E-04 mode must be frozen_case_study")
        if metrics.get("source_stage") != "post_batch10":
            errors.append("E-04 source_stage must be post_batch10")
        if int(metrics.get("rank2_current_target_measurements_expected", -1)) != 0:
            errors.append("E-04 rank2_current_target_measurements_expected must be 0")

    return errors


def _coerce_contract_refs(raw: Any, figure_id: str) -> List[str]:
    if not isinstance(raw, list) or not raw or not all(isinstance(x, str) and x for x in raw):
        raise ValueError(f"fixture for {figure_id} must include non-empty contract_refs[]")
    return raw


def _collect_from_fixtures(
    requested_figures: Set[str], fixture_dir: pathlib.Path
) -> List[Dict[str, Any]]:
    if not fixture_dir.exists():
        raise FileNotFoundError(f"fixture-dir does not exist: {fixture_dir}")

    by_figure: Dict[str, Dict[str, Any]] = {}
    for fixture_path in sorted(fixture_dir.glob("*.json")):
        payload = _load_json(fixture_path)
        figure_id = payload.get("figure_id")
        if figure_id not in requested_figures:
            continue
        by_figure[figure_id] = payload

    missing = sorted(requested_figures - set(by_figure.keys()))
    if missing:
        raise ValueError(f"fixtures missing required figures: {missing}")

    return [by_figure[figure_id] for figure_id in sorted(requested_figures)]


def _run_psql_json(db_url: str, sql_file: pathlib.Path, cwd: pathlib.Path) -> Dict[str, Any]:
    cmd = ["psql", db_url, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-f", str(sql_file)]
    proc = subprocess.run(cmd, cwd=str(cwd), text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(
            f"psql failed for {sql_file}:\nstdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
        )

    lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
    if not lines:
        raise RuntimeError(f"no JSON payload returned by {sql_file}")

    json_line = lines[-1]
    try:
        payload = json.loads(json_line)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"invalid JSON payload from {sql_file}: {exc}\nlast line:\n{json_line}\nfull stdout:\n{proc.stdout}"
        ) from exc

    if not isinstance(payload, dict):
        raise RuntimeError(f"SQL payload from {sql_file} must be JSON object")
    return payload


def _collect_from_db(
    requested_figures: Set[str], db_url: str, sql_dir: pathlib.Path, repo_root: pathlib.Path
) -> List[Dict[str, Any]]:
    missing_sql = [FIGURE_SQL_FILE[fid] for fid in sorted(requested_figures) if not (sql_dir / FIGURE_SQL_FILE[fid]).exists()]
    if missing_sql:
        raise FileNotFoundError(f"missing SQL extractors: {missing_sql}")

    results: List[Dict[str, Any]] = []
    for figure_id in sorted(requested_figures):
        sql_path = sql_dir / FIGURE_SQL_FILE[figure_id]
        metrics = _run_psql_json(db_url=db_url, sql_file=sql_path, cwd=repo_root)
        results.append(
            {
                "figure_id": figure_id,
                "source_rows": metrics,
                "contract_refs": metrics.pop("_contract_refs", []),
                "source_file_hashes": {},
            }
        )

    return results


def _merge_source_hashes(
    figure_payloads: Iterable[Dict[str, Any]], repo_root: pathlib.Path
) -> Dict[str, str]:
    hashes: Dict[str, str] = {}
    for payload in figure_payloads:
        for path, digest in (payload.get("source_file_hashes") or {}).items():
            if isinstance(path, str) and isinstance(digest, str) and digest:
                hashes.setdefault(path, digest)

        for ref in payload.get("contract_refs", []):
            ref_path = repo_root / ref
            if ref not in hashes and ref_path.exists() and ref_path.is_file():
                hashes[ref] = _file_sha256(ref_path)
    return hashes


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect reporting figure payloads")
    parser.add_argument("--mode", required=True, choices=["smoke", "full"])
    parser.add_argument("--figures", required=True)
    parser.add_argument("--source", required=True, choices=["fixture", "db"])
    parser.add_argument("--fixture-dir", default="")
    parser.add_argument("--db-url", default="")
    parser.add_argument("--sql-dir", default="etl/phase2/reporting/sql")
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--trigger", default="pr_smoke")
    args = parser.parse_args()

    if args.trigger not in TRIGGER_VALUES:
        return fail(f"unsupported trigger: {args.trigger}")

    try:
        requested_figures = _resolve_requested_figures(args.figures)
    except ValueError as exc:
        return fail(str(exc))

    repo_root = pathlib.Path(__file__).resolve().parents[4]
    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.source == "fixture" and not args.fixture_dir:
        return fail("--fixture-dir is required when --source fixture")
    if args.source == "db" and not args.db_url:
        return fail("--db-url is required when --source db")

    try:
        if args.source == "fixture":
            raw_payloads = _collect_from_fixtures(requested_figures, pathlib.Path(args.fixture_dir))
        else:
            raw_payloads = _collect_from_db(
                requested_figures=requested_figures,
                db_url=args.db_url,
                sql_dir=pathlib.Path(args.sql_dir),
                repo_root=repo_root,
            )
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        return fail(str(exc))

    figures: List[Dict[str, Any]] = []
    for item in raw_payloads:
        figure_id = item["figure_id"]
        if figure_id not in requested_figures:
            continue

        metrics = item.get("source_rows")
        if not isinstance(metrics, dict):
            return fail(f"source_rows for {figure_id} must be an object")

        try:
            contract_refs = _coerce_contract_refs(item.get("contract_refs"), figure_id)
            row_count = _stable_row_count(figure_id, metrics)
        except ValueError as exc:
            return fail(str(exc))

        errors = _validate_semantics(figure_id, metrics)
        status = "pass" if not errors else "fail"
        hard_gate = "pass" if status == "pass" else "fail"

        artifact_path = out_dir / f"{figure_id}.json"
        metrics_blob = json.dumps(metrics, sort_keys=True, separators=(",", ":")).encode("utf-8")

        figure_payload = {
            "figure_id": figure_id,
            "schema_version": "1.0.0",
            "payload_version": "v1",
            "status": status,
            "hard_gate": hard_gate,
            "contract_refs": contract_refs,
            "metrics": metrics,
            "validation": {
                "ok": len(errors) == 0,
                "error_count": len(errors),
                "errors": errors,
            },
            "artifact": {
                "path": str(artifact_path),
                "sha256": _sha256_bytes(metrics_blob),
                "row_count": row_count,
            },
        }

        _write_json(artifact_path, figure_payload)
        figures.append(figure_payload)

    if not figures:
        return fail("no figures collected")

    source_file_hashes = _merge_source_hashes(raw_payloads, repo_root)
    fail_count = sum(1 for f in figures if f["status"] == "fail")
    warn_count = sum(1 for f in figures if f["status"] == "warn")
    source_meta = _source_meta_for_fixture()
    if args.source == "db":
        source_meta = _sanitize_db_ref(args.db_url)

    run_payload = {
        "run_id": pathlib.Path(args.out_dir).name or "run-local",
        "schema_version": "phase2-reporting-bundle-v1",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "git_sha": os.getenv("GITHUB_SHA", "placeholder"),
        "source_db_ref": source_meta["source_db_ref"],
        "source_db_meta": source_meta["source_db_meta"],
        "contract_version": "v1",
        "trigger": args.trigger,
        "source_file_hashes": source_file_hashes,
        "figures": figures,
        "summary": {
            "now_set_ok": fail_count == 0,
            "now_set_fail_count": fail_count,
            "now_set_warn_count": warn_count,
            "snapshot_drift_count": 0,
        },
        "artifact": {
            "out_path": str(out_dir),
            "sha256": _sha256_bytes(
                json.dumps(figures, sort_keys=True, separators=(",", ":")).encode("utf-8")
            ),
        },
    }

    _write_json(out_dir / "run.json", run_payload)
    print(f"[OK] collected {len(figures)} figure payloads")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
