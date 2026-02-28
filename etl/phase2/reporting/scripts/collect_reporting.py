#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Set
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
    "manual_render_baseline_update",
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

FLOAT_TOL = 1e-6


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


def _load_allowed_contract_refs(repo_root: pathlib.Path) -> Set[str]:
    policy_path = repo_root / "etl/phase2/reporting/contracts/reporting_snapshot_policy.yaml"
    if not policy_path.exists():
        raise FileNotFoundError(f"reporting policy not found: {policy_path}")

    lines = policy_path.read_text(encoding="utf-8").splitlines()
    in_allowed = False
    in_files = False
    refs: List[str] = []

    for raw in lines:
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue

        if stripped == "allowed_inputs:":
            in_allowed = True
            in_files = False
            continue

        if in_allowed and re.match(r"^[A-Za-z0-9_]+:", stripped) and stripped != "files:":
            break

        if in_allowed and stripped == "files:":
            in_files = True
            continue

        if in_allowed and in_files:
            m = re.match(r'^-\s*"([^"]+)"\s*$', stripped)
            if m:
                refs.append(m.group(1))
                continue
            m_sq = re.match(r"^-\s*'([^']+)'\s*$", stripped)
            if m_sq:
                refs.append(m_sq.group(1))
                continue
            if re.match(r"^[A-Za-z0-9_]+:", stripped):
                in_files = False

    allowed = set(refs)
    if not allowed:
        raise ValueError("policy allowed_inputs.files parsed empty; cannot validate contract refs")
    return allowed


def _validate_contract_refs(contract_refs: List[str], allowed_refs: Set[str], figure_id: str) -> None:
    unknown = sorted(set(contract_refs) - allowed_refs)
    if unknown:
        raise ValueError(f"{figure_id} has contract_refs outside policy allowlist: {unknown}")


def _as_int(metrics: Dict[str, Any], key: str, errors: List[str], figure_id: str) -> Optional[int]:
    value = metrics.get(key)
    if type(value) is not int:
        errors.append(f"{figure_id} {key} must be integer")
        return None
    return value


def _as_num(metrics: Dict[str, Any], key: str, errors: List[str], figure_id: str) -> Optional[float]:
    value = metrics.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        errors.append(f"{figure_id} {key} must be numeric")
        return None
    return float(value)


def _check_non_negative(raw: Optional[int], key: str, figure_id: str, errors: List[str]) -> None:
    if raw is not None and raw < 0:
        errors.append(f"{figure_id} {key} must be >= 0")


def _validate_p01(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "P-01_stage_progression_contract_curve"
    baseline_resolved = _as_int(metrics, "baseline_resolved", errors, figure_id)
    baseline_unresolved = _as_int(metrics, "baseline_unresolved", errors, figure_id)
    _check_non_negative(baseline_resolved, "baseline_resolved", figure_id, errors)
    _check_non_negative(baseline_unresolved, "baseline_unresolved", figure_id, errors)

    stages = metrics.get("stages")
    if not isinstance(stages, list) or not stages:
        errors.append(f"{figure_id} stages must be non-empty list")
        return
    if baseline_resolved is None or baseline_unresolved is None:
        return

    total_rows = baseline_resolved + baseline_unresolved
    prev_resolved = baseline_resolved
    prev_unresolved = baseline_unresolved
    seen_stage_ids: Set[str] = set()

    for idx, stage in enumerate(stages):
        if not isinstance(stage, dict):
            errors.append(f"{figure_id} stage[{idx}] must be object")
            continue
        stage_id = stage.get("stage_id")
        if not isinstance(stage_id, str) or not stage_id:
            errors.append(f"{figure_id} stage[{idx}].stage_id must be non-empty string")
            continue
        if stage_id in seen_stage_ids:
            errors.append(f"{figure_id} duplicate stage_id: {stage_id}")
        seen_stage_ids.add(stage_id)

        if stage.get("executed") is not True:
            errors.append(f"{figure_id} stage {stage_id} executed must be true")

        required_keys = [
            "resolved_rows",
            "unresolved_rows",
            "expected_resolved_rows",
            "expected_unresolved_rows",
            "delta_resolved_rows",
            "delta_unresolved_rows",
        ]
        values: Dict[str, int] = {}
        for key in required_keys:
            v = stage.get(key)
            if type(v) is not int:
                errors.append(f"{figure_id} stage {stage_id} {key} must be integer")
                continue
            values[key] = v
            if v < 0 and key not in {"delta_unresolved_rows"}:
                errors.append(f"{figure_id} stage {stage_id} {key} must be >= 0")

        if len(values) != len(required_keys):
            continue

        if values["resolved_rows"] + values["unresolved_rows"] != total_rows:
            errors.append(f"{figure_id} stage {stage_id} resolved+unresolved must equal baseline total")
        if values["expected_resolved_rows"] != values["resolved_rows"]:
            errors.append(f"{figure_id} stage {stage_id} expected_resolved_rows mismatch")
        if values["expected_unresolved_rows"] != values["unresolved_rows"]:
            errors.append(f"{figure_id} stage {stage_id} expected_unresolved_rows mismatch")
        if values["resolved_rows"] < prev_resolved:
            errors.append(f"{figure_id} stage {stage_id} resolved_rows regressed")
        if values["unresolved_rows"] > prev_unresolved:
            errors.append(f"{figure_id} stage {stage_id} unresolved_rows increased")

        if values["delta_resolved_rows"] != values["resolved_rows"] - prev_resolved:
            errors.append(f"{figure_id} stage {stage_id} delta_resolved_rows inconsistent")
        if values["delta_unresolved_rows"] != values["unresolved_rows"] - prev_unresolved:
            errors.append(f"{figure_id} stage {stage_id} delta_unresolved_rows inconsistent")

        prev_resolved = values["resolved_rows"]
        prev_unresolved = values["unresolved_rows"]

    if prev_unresolved != 0:
        errors.append(f"{figure_id} final unresolved rows must be 0")


def _validate_p02(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "P-02_candidate_pool_split_by_stage"
    stages = metrics.get("stages")
    if not isinstance(stages, list) or not stages:
        errors.append(f"{figure_id} stages must be non-empty list")
        return

    for idx, stage in enumerate(stages):
        if not isinstance(stage, dict):
            errors.append(f"{figure_id} stage[{idx}] must be object")
            continue

        stage_id = stage.get("stage_id")
        if not isinstance(stage_id, str) or not stage_id:
            errors.append(f"{figure_id} stage[{idx}].stage_id must be non-empty string")
            continue

        with_candidates = stage.get("with_candidates_rows")
        without_candidates = stage.get("without_candidates_rows")
        unresolved_rows = stage.get("unresolved_rows")
        closure_rate = stage.get("pool_closure_rate")

        if type(with_candidates) is not int or with_candidates < 0:
            errors.append(f"{figure_id} stage {stage_id} with_candidates_rows must be int >= 0")
            continue
        if type(without_candidates) is not int or without_candidates < 0:
            errors.append(f"{figure_id} stage {stage_id} without_candidates_rows must be int >= 0")
            continue
        if type(unresolved_rows) is not int or unresolved_rows < 0:
            errors.append(f"{figure_id} stage {stage_id} unresolved_rows must be int >= 0")
            continue
        if isinstance(closure_rate, bool) or not isinstance(closure_rate, (int, float)):
            errors.append(f"{figure_id} stage {stage_id} pool_closure_rate must be numeric")
            continue

        if with_candidates + without_candidates != unresolved_rows:
            errors.append(
                f"{figure_id} stage {stage_id} with_candidates_rows + without_candidates_rows must equal unresolved_rows"
            )

        if unresolved_rows == 0:
            if abs(float(closure_rate) - 1.0) > FLOAT_TOL:
                errors.append(f"{figure_id} stage {stage_id} pool_closure_rate must be 1 when unresolved_rows=0")
        else:
            expected = round(with_candidates / unresolved_rows, 4)
            if abs(float(closure_rate) - expected) > 1e-4:
                errors.append(
                    f"{figure_id} stage {stage_id} pool_closure_rate must equal with_candidates_rows/unresolved_rows"
                )


def _validate_p03(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "P-03_gap_completion_matrix"
    bucket_rows = metrics.get("bucket_rows")
    if not isinstance(bucket_rows, list) or not bucket_rows:
        errors.append(f"{figure_id} bucket_rows must be non-empty list")
        return

    readiness_total = 0
    completed_total = 0
    priority_total = 0

    for idx, row in enumerate(bucket_rows):
        if not isinstance(row, dict):
            errors.append(f"{figure_id} bucket_rows[{idx}] must be object")
            continue
        bucket = row.get("bucket")
        if not isinstance(bucket, str) or not bucket:
            errors.append(f"{figure_id} bucket_rows[{idx}].bucket must be non-empty string")
            continue

        int_keys = [
            "priority_rows",
            "resolved_rows",
            "completed_rows",
            "unresolved_rows",
            "pending_measurement_rows",
            "readiness_gap",
        ]
        values: Dict[str, int] = {}
        for key in int_keys:
            v = row.get(key)
            if type(v) is not int:
                errors.append(f"{figure_id} bucket {bucket} {key} must be integer")
                continue
            values[key] = v
            if v < 0:
                errors.append(f"{figure_id} bucket {bucket} {key} must be >= 0")
        if len(values) != len(int_keys):
            continue

        if values["resolved_rows"] + values["unresolved_rows"] != values["priority_rows"]:
            errors.append(f"{figure_id} bucket {bucket} resolved+unresolved must equal priority")
        expected_gap = values["resolved_rows"] - values["completed_rows"]
        if values["readiness_gap"] != expected_gap:
            errors.append(f"{figure_id} bucket {bucket} readiness_gap mismatch")
        if values["pending_measurement_rows"] != values["readiness_gap"]:
            errors.append(f"{figure_id} bucket {bucket} pending_measurement_rows mismatch readiness_gap")

        readiness_total += values["readiness_gap"]
        completed_total += values["completed_rows"]
        priority_total += values["priority_rows"]

    top_readiness = _as_int(metrics, "readiness_gap", errors, figure_id)
    if top_readiness is not None and top_readiness != readiness_total:
        errors.append(f"{figure_id} top-level readiness_gap must equal sum(bucket.readiness_gap)")

    completion_ratio = _as_num(metrics, "completion_ratio", errors, figure_id)
    if completion_ratio is not None and (completion_ratio < 0 or completion_ratio > 1):
        errors.append(f"{figure_id} completion_ratio must be between 0 and 1")


def _validate_q02(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "Q-02_critical_contract_scorecard"

    phase2_tuple = metrics.get("phase2_priority_tuple")
    if not isinstance(phase2_tuple, dict):
        errors.append(f"{figure_id} phase2_priority_tuple must be object")
        return
    p_total = phase2_tuple.get("total")
    p_resolved = phase2_tuple.get("resolved")
    p_unresolved = phase2_tuple.get("unresolved")
    if type(p_total) is not int or type(p_resolved) is not int or type(p_unresolved) is not int:
        errors.append(f"{figure_id} phase2_priority_tuple values must be integers")
        return
    if p_total != p_resolved + p_unresolved:
        errors.append(f"{figure_id} phase2_priority_tuple total mismatch")

    gap_tuples = metrics.get("phase2_gap_tuples")
    if not isinstance(gap_tuples, list) or not gap_tuples:
        errors.append(f"{figure_id} phase2_gap_tuples must be non-empty list")
    else:
        sum_total = 0
        sum_resolved = 0
        sum_unresolved = 0
        for idx, row in enumerate(gap_tuples):
            if not isinstance(row, dict):
                errors.append(f"{figure_id} phase2_gap_tuples[{idx}] must be object")
                continue
            tup = row.get("tuple")
            ok = row.get("ok")
            if not isinstance(tup, dict) or type(ok) is not bool:
                errors.append(f"{figure_id} gap tuple row {idx} malformed")
                continue
            t_total = tup.get("total")
            t_resolved = tup.get("resolved")
            t_unresolved = tup.get("unresolved")
            if type(t_total) is not int or type(t_resolved) is not int or type(t_unresolved) is not int:
                errors.append(f"{figure_id} gap tuple row {idx} values must be integers")
                continue
            expected_ok = (t_resolved + t_unresolved) == t_total
            if ok != expected_ok:
                errors.append(f"{figure_id} gap tuple row {idx} ok flag inconsistent")
            sum_total += t_total
            sum_resolved += t_resolved
            sum_unresolved += t_unresolved

        if sum_total != p_total or sum_resolved != p_resolved or sum_unresolved != p_unresolved:
            errors.append(f"{figure_id} gap tuple aggregates must match phase2_priority_tuple")

    phase3_count = _as_int(metrics, "phase3_rollup_row_count", errors, figure_id)
    swap_status = metrics.get("swap_status_tuple")
    if not isinstance(swap_status, dict):
        errors.append(f"{figure_id} swap_status_tuple must be object")
    else:
        for key in ["active", "draft"]:
            value = swap_status.get(key)
            if type(value) is not int or value < 0:
                errors.append(f"{figure_id} swap_status_tuple.{key} must be int >= 0")

    checks = metrics.get("contract_checks")
    if not isinstance(checks, dict):
        errors.append(f"{figure_id} contract_checks must be object")
    else:
        for key in ["phase2_ok", "phase3_ok", "rank2_api_ok"]:
            if type(checks.get(key)) is not bool:
                errors.append(f"{figure_id} contract_checks.{key} must be boolean")
        if type(checks.get("phase2_ok")) is bool and checks.get("phase2_ok") != (p_unresolved == 0):
            errors.append(f"{figure_id} contract_checks.phase2_ok inconsistent with phase2 tuple")
        if (
            type(checks.get("phase3_ok")) is bool
            and phase3_count is not None
            and checks.get("phase3_ok") != (phase3_count == p_total)
        ):
            errors.append(f"{figure_id} contract_checks.phase3_ok inconsistent with phase2 total")
        if checks.get("rank2_api_ok") is not True:
            errors.append(f"{figure_id} contract_checks.rank2_api_ok must be true")


def _validate_q03(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "Q-03_snapshot_lock_drift_panel"
    reviewed = _as_int(metrics, "reviewed_snapshot_rows", errors, figure_id)
    if reviewed is not None and reviewed < 1:
        errors.append("Q-03 reviewed_snapshot_rows must be >= 1")
    for key in [
        "snapshot_mismatch_rows",
        "auto_eligible_mismatch_rows",
        "approve_for_ineligible_rows",
    ]:
        value = _as_int(metrics, key, errors, figure_id)
        _check_non_negative(value, key, figure_id, errors)


def _validate_q04(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "Q-04_rank2_exclusion_audit"
    counters = {}
    for key in [
        "phase2_rank2_current_target_measurements",
        "phase3_rules_touching_rank2",
        "api_rank2_leak_rows",
    ]:
        value = _as_int(metrics, key, errors, figure_id)
        _check_non_negative(value, key, figure_id, errors)
        if value is not None:
            counters[key] = value

    overall_pass = metrics.get("overall_pass")
    if type(overall_pass) is not bool:
        errors.append(f"{figure_id} overall_pass must be boolean")
        return

    any_nonzero = any(v != 0 for v in counters.values())
    if any_nonzero:
        errors.append(f"{figure_id} counters must be zero")
    if overall_pass != (not any_nonzero):
        errors.append(f"{figure_id} overall_pass inconsistent with counters")


def _validate_e03(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "E-03_threshold_provenance_completeness"
    invalid_source = _as_int(metrics, "invalid_threshold_source_rows", errors, figure_id)
    missing_citation = _as_int(metrics, "missing_default_threshold_citation_rows", errors, figure_id)
    invalid_total = _as_int(metrics, "invalid_rows_total", errors, figure_id)
    _check_non_negative(invalid_source, "invalid_threshold_source_rows", figure_id, errors)
    _check_non_negative(missing_citation, "missing_default_threshold_citation_rows", figure_id, errors)
    _check_non_negative(invalid_total, "invalid_rows_total", figure_id, errors)
    if (
        invalid_source is not None
        and missing_citation is not None
        and invalid_total is not None
        and invalid_total != (invalid_source + missing_citation)
    ):
        errors.append(f"{figure_id} invalid_rows_total must equal invalid_source + missing_citation")

    share = _as_num(metrics, "default_threshold_share", errors, figure_id)
    if share is not None and (share < 0 or share > 1):
        errors.append(f"{figure_id} default_threshold_share must be between 0 and 1")


def _validate_e04(metrics: Dict[str, Any], errors: List[str]) -> None:
    figure_id = "E-04_rank2_quarantine_case_study"
    if metrics.get("mode") != "frozen_case_study":
        errors.append("E-04 mode must be frozen_case_study")
    if metrics.get("source_stage") != "post_batch10":
        errors.append("E-04 source_stage must be post_batch10")

    rank2_expected = _as_int(metrics, "rank2_current_target_measurements_expected", errors, figure_id)
    if rank2_expected is not None and rank2_expected != 0:
        errors.append("E-04 rank2_current_target_measurements_expected must be 0")

    readiness_rows = _as_int(metrics, "post_batch10_readiness_rows", errors, figure_id)
    if readiness_rows is not None and readiness_rows != 9:
        errors.append("E-04 post_batch10_readiness_rows must be 9")

    cohort_note_count = _as_int(metrics, "cohort_note_count", errors, figure_id)
    if cohort_note_count is not None and cohort_note_count < 1:
        errors.append("E-04 cohort_note_count must be >= 1")


def _validate_semantics(figure_id: str, metrics: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    if figure_id == "P-01_stage_progression_contract_curve":
        _validate_p01(metrics, errors)
    elif figure_id == "P-02_candidate_pool_split_by_stage":
        _validate_p02(metrics, errors)
    elif figure_id == "P-03_gap_completion_matrix":
        _validate_p03(metrics, errors)
    elif figure_id == "Q-02_critical_contract_scorecard":
        _validate_q02(metrics, errors)
    elif figure_id == "Q-03_snapshot_lock_drift_panel":
        _validate_q03(metrics, errors)
    elif figure_id == "Q-04_rank2_exclusion_audit":
        _validate_q04(metrics, errors)
    elif figure_id == "E-03_threshold_provenance_completeness":
        _validate_e03(metrics, errors)
    elif figure_id == "E-04_rank2_quarantine_case_study":
        _validate_e04(metrics, errors)
    else:
        errors.append(f"unknown figure id: {figure_id}")
    return errors


def _coerce_contract_refs(raw: Any, figure_id: str) -> List[str]:
    if not isinstance(raw, list) or not raw or not all(isinstance(x, str) and x for x in raw):
        raise ValueError(f"fixture for {figure_id} must include non-empty contract_refs[]")
    return raw


def _verify_fixture_hashes(
    fixture_path: pathlib.Path,
    payload: Dict[str, Any],
    repo_root: pathlib.Path,
) -> None:
    source_hashes = payload.get("source_file_hashes")
    if not isinstance(source_hashes, dict) or not source_hashes:
        raise ValueError(f"{fixture_path} source_file_hashes must be non-empty object")

    for rel_path, expected_digest in source_hashes.items():
        if not isinstance(rel_path, str) or not rel_path:
            raise ValueError(f"{fixture_path} source_file_hashes keys must be non-empty strings")
        if not isinstance(expected_digest, str) or not expected_digest:
            raise ValueError(f"{fixture_path} source_file_hashes[{rel_path}] must be non-empty string")
        source_file = repo_root / rel_path
        if not source_file.exists() or not source_file.is_file():
            raise ValueError(f"{fixture_path} source hash path not found: {rel_path}")
        actual_digest = _file_sha256(source_file)
        if actual_digest != expected_digest:
            raise ValueError(
                f"{fixture_path} stale source hash for {rel_path}: expected {expected_digest} got {actual_digest}"
            )


def _collect_from_fixtures(
    requested_figures: Set[str], fixture_dir: pathlib.Path, repo_root: pathlib.Path
) -> List[Dict[str, Any]]:
    if not fixture_dir.exists():
        raise FileNotFoundError(f"fixture-dir does not exist: {fixture_dir}")

    by_figure: Dict[str, Dict[str, Any]] = {}
    for fixture_path in sorted(fixture_dir.glob("*.json")):
        payload = _load_json(fixture_path)
        figure_id = payload.get("figure_id")
        if figure_id not in requested_figures:
            continue
        _verify_fixture_hashes(fixture_path, payload, repo_root)
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
    missing_sql = [
        FIGURE_SQL_FILE[fid]
        for fid in sorted(requested_figures)
        if not (sql_dir / FIGURE_SQL_FILE[fid]).exists()
    ]
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
            raw_payloads = _collect_from_fixtures(
                requested_figures, pathlib.Path(args.fixture_dir), repo_root
            )
        else:
            raw_payloads = _collect_from_db(
                requested_figures=requested_figures,
                db_url=args.db_url,
                sql_dir=pathlib.Path(args.sql_dir),
                repo_root=repo_root,
            )
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        return fail(str(exc))

    try:
        allowed_contract_refs = _load_allowed_contract_refs(repo_root)
    except (FileNotFoundError, ValueError) as exc:
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
            _validate_contract_refs(contract_refs, allowed_contract_refs, figure_id)
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
            "contract_refs": sorted(contract_refs),
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
