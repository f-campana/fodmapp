#!/usr/bin/env python3
import argparse
import copy
import fnmatch
import hashlib
import json
import pathlib
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Set

import yaml


MODE_ALLOWED_WRITES: Dict[str, Set[str]] = {
    "baseline_update": {
        "etl/phase2/reporting/contracts/generated/*.generated.yaml",
        "etl/phase2/reporting/contracts/baselines/**/*.json",
    },
    "render_baseline_update": {
        "etl/phase2/reporting/contracts/baselines/render/**/*.svg",
        "etl/phase2/reporting/contracts/baselines/render/**/*.html",
        "etl/phase2/reporting/contracts/baselines/render/**/*.json",
    },
}

MODE_DENY_WRITES: Dict[str, Set[str]] = {
    "baseline_update": {
        "etl/phase2/reporting/contracts/baselines/render/**",
    },
    "render_baseline_update": {
        "etl/phase2/reporting/contracts/generated/*.generated.yaml",
        "etl/phase2/reporting/contracts/baselines/now/**",
    },
}

ROW_COUNT_KEYS = {
    "P-01_stage_progression_contract_curve": "stages",
    "P-02_candidate_pool_split_by_stage": "stages",
    "P-03_gap_completion_matrix": "bucket_rows",
}


def _sha256_file(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def _sha256_json(payload: Any) -> str:
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return f"sha256:{hashlib.sha256(blob).hexdigest()}"


def _load_json(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"JSON payload at {path} must be an object")
    return data


def _load_yaml(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"YAML payload at {path} must be a mapping")
    return data


def _write_json(path: pathlib.Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")


def _write_yaml(path: pathlib.Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(payload, f, sort_keys=False, allow_unicode=False)


def _repo_rel(path: pathlib.Path, repo_root: pathlib.Path) -> str:
    resolved_path = path.resolve()
    resolved_root = repo_root.resolve()
    try:
        rel = resolved_path.relative_to(resolved_root).as_posix()
    except ValueError as exc:
        raise ValueError(f"path outside repo root: {path}") from exc
    return rel


def _path_allowed(rel_path: str, patterns: List[str]) -> bool:
    return any(fnmatch.fnmatch(rel_path, pattern) for pattern in patterns)


def _path_denied(rel_path: str, patterns: List[str]) -> bool:
    return any(fnmatch.fnmatch(rel_path, pattern) for pattern in patterns)


def _stable_row_count(figure_id: str, metrics: Dict[str, Any]) -> int:
    key = ROW_COUNT_KEYS.get(figure_id)
    if key is None:
        return 1
    value = metrics.get(key)
    if isinstance(value, list):
        return len(value)
    return 1


def _normalize_figure(figure: Dict[str, Any]) -> Dict[str, Any]:
    figure_id = figure.get("figure_id")
    if not isinstance(figure_id, str) or not figure_id:
        raise ValueError("figure missing figure_id")

    metrics = figure.get("metrics")
    if not isinstance(metrics, dict):
        raise ValueError(f"figure {figure_id} missing metrics object")

    contract_refs = figure.get("contract_refs")
    if not isinstance(contract_refs, list) or not contract_refs or not all(
        isinstance(x, str) and x for x in contract_refs
    ):
        raise ValueError(f"figure {figure_id} must include non-empty contract_refs")

    return {
        "figure_id": figure_id,
        "schema_version": str(figure.get("schema_version", "1.0.0")),
        "payload_version": str(figure.get("payload_version", "v1")),
        "status": str(figure.get("status", "fail")),
        "hard_gate": str(figure.get("hard_gate", "fail")),
        "contract_refs": sorted(set(contract_refs)),
        "metrics": copy.deepcopy(metrics),
        "validation": copy.deepcopy(
            figure.get("validation", {"ok": True, "error_count": 0, "errors": []})
        ),
        "artifact": {
            "path": f"baseline://now/{figure_id}.json",
            "sha256": _sha256_json(metrics),
            "row_count": int(
                (figure.get("artifact") or {}).get(
                    "row_count", _stable_row_count(figure_id, metrics)
                )
            ),
        },
    }


def _refresh_source_hashes(
    source_file_hashes: Dict[str, Any], repo_root: pathlib.Path
) -> Dict[str, str]:
    refreshed: Dict[str, str] = {}
    for raw_path, raw_digest in sorted(source_file_hashes.items()):
        if not isinstance(raw_path, str) or not raw_path:
            continue
        file_path = repo_root / raw_path
        if file_path.exists() and file_path.is_file():
            refreshed[raw_path] = _sha256_file(file_path)
        elif isinstance(raw_digest, str) and raw_digest:
            refreshed[raw_path] = raw_digest
    return refreshed


def _refresh_stage_contract_hashes(
    stage_contracts: Dict[str, Any], repo_root: pathlib.Path
) -> int:
    updated = 0
    source_inputs = stage_contracts.get("source_inputs")
    if not isinstance(source_inputs, list):
        return updated

    for entry in source_inputs:
        if not isinstance(entry, dict):
            continue
        rel_path = entry.get("path")
        if not isinstance(rel_path, str) or not rel_path:
            continue
        file_path = repo_root / rel_path
        if not file_path.exists() or not file_path.is_file():
            continue
        digest = _sha256_file(file_path)
        if entry.get("sha256") != digest:
            entry["sha256"] = digest
            updated += 1
    return updated


def _run_renderer(
    repo_root: pathlib.Path,
    input_path: pathlib.Path,
    render_scientific_dir: pathlib.Path,
    render_dashboard_file: pathlib.Path,
    render_manifest_path: pathlib.Path,
) -> None:
    scientific_cmd = [
        "pnpm",
        "--filter",
        "@fodmap/reporting",
        "render:scientific",
        "--",
        "--input",
        str(input_path),
        "--out-dir",
        str(render_scientific_dir),
        "--manifest-out",
        str(render_manifest_path),
    ]
    dashboard_cmd = [
        "pnpm",
        "--filter",
        "@fodmap/reporting",
        "render:dashboard",
        "--",
        "--input",
        str(input_path),
        "--out-file",
        str(render_dashboard_file),
        "--manifest-out",
        str(render_manifest_path),
    ]

    for cmd in [scientific_cmd, dashboard_cmd]:
        proc = subprocess.run(cmd, cwd=str(repo_root), text=True, capture_output=True)
        if proc.returncode != 0:
            raise RuntimeError(
                f"renderer command failed: {' '.join(cmd)}\nstdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
            )


def _render_output_files(
    repo_root: pathlib.Path,
    render_scientific_dir: pathlib.Path,
    render_dashboard_file: pathlib.Path,
    render_manifest_path: pathlib.Path,
) -> List[str]:
    rendered: List[str] = []
    if render_scientific_dir.exists():
        for svg in sorted(render_scientific_dir.glob("*.svg")):
            rendered.append(_repo_rel(svg, repo_root))
    if render_dashboard_file.exists():
        rendered.append(_repo_rel(render_dashboard_file, repo_root))
    if render_manifest_path.exists():
        rendered.append(_repo_rel(render_manifest_path, repo_root))
    return rendered


def _validate_required_paths(
    mode: str,
    required_write_paths: List[str],
    writable_globs: List[str],
) -> bool:
    allow_patterns = sorted(MODE_ALLOWED_WRITES[mode])
    deny_patterns = sorted(MODE_DENY_WRITES[mode])

    for rel_path in required_write_paths:
        if not _path_allowed(rel_path, allow_patterns):
            print(f"write path outside policy allowlist for {mode}: {rel_path}", file=sys.stderr)
            return False
        if _path_denied(rel_path, deny_patterns):
            print(f"write path denied for {mode}: {rel_path}", file=sys.stderr)
            return False
        if not _path_allowed(rel_path, writable_globs):
            print(f"write path outside provided writable-glob scope: {rel_path}", file=sys.stderr)
            return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh committed reporting baselines")
    parser.add_argument(
        "--mode",
        required=True,
        choices=["baseline_update", "render_baseline_update"],
    )
    parser.add_argument("--run-artifact", required=True)
    parser.add_argument(
        "--baseline-path",
        default="etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json",
    )
    parser.add_argument(
        "--stage-contracts-path",
        default="etl/phase2/reporting/contracts/generated/stage_contracts.generated.yaml",
    )
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--run-notes", required=True)
    parser.add_argument("--allow-writes", action="store_true")
    parser.add_argument("--writable-glob", action="append", default=[])
    parser.add_argument("--out-dir", required=True)
    parser.add_argument(
        "--render-scientific-dir",
        default="etl/phase2/reporting/contracts/baselines/render/v1/scientific",
    )
    parser.add_argument(
        "--render-dashboard-file",
        default="etl/phase2/reporting/contracts/baselines/render/v1/public/phase2_dashboard.html",
    )
    parser.add_argument(
        "--render-manifest-path",
        default="etl/phase2/reporting/contracts/baselines/render/v1/render-baseline-manifest.v1.json",
    )
    args = parser.parse_args()

    if not args.allow_writes:
        print("--allow-writes is required for refresh mode", file=sys.stderr)
        return 1
    if not args.writable_glob:
        print("at least one --writable-glob is required", file=sys.stderr)
        return 1

    invalid_globs = sorted(set(args.writable_glob) - MODE_ALLOWED_WRITES[args.mode])
    if invalid_globs:
        print(f"invalid writable-glob entries for {args.mode}: {', '.join(invalid_globs)}", file=sys.stderr)
        return 1

    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    repo_root = pathlib.Path(args.repo_root).resolve()
    run_input = pathlib.Path(args.run_artifact)
    run_bundle_path = (run_input / "run.json") if run_input.is_dir() else run_input
    baseline_path = pathlib.Path(args.baseline_path)
    stage_contracts_path = pathlib.Path(args.stage_contracts_path)
    render_scientific_dir = pathlib.Path(args.render_scientific_dir)
    render_dashboard_file = pathlib.Path(args.render_dashboard_file)
    render_manifest_path = pathlib.Path(args.render_manifest_path)

    if not run_bundle_path.exists():
        print(f"run artifact not found: {run_bundle_path}", file=sys.stderr)
        return 1

    try:
        baseline_rel = _repo_rel(baseline_path, repo_root)
        stage_rel = _repo_rel(stage_contracts_path, repo_root)
        render_scientific_rel = _repo_rel(render_scientific_dir, repo_root)
        render_dashboard_rel = _repo_rel(render_dashboard_file, repo_root)
        render_manifest_rel = _repo_rel(render_manifest_path, repo_root)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    required_write_paths: List[str]
    if args.mode == "baseline_update":
        required_write_paths = [baseline_rel, stage_rel]
    else:
        render_svg_probe = f"{render_scientific_rel.rstrip('/')}/probe.svg"
        required_write_paths = [render_svg_probe, render_dashboard_rel, render_manifest_rel]

    if not _validate_required_paths(args.mode, required_write_paths, args.writable_glob):
        return 1

    try:
        run_bundle = _load_json(run_bundle_path)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    source_hashes_input = run_bundle.get("source_file_hashes", {})
    if not isinstance(source_hashes_input, dict):
        source_hashes_input = {}
    refreshed_source_hashes = _refresh_source_hashes(source_hashes_input, repo_root)
    run_id = str(run_bundle.get("run_id", out_dir.name or args.mode))
    updated_files: List[str] = []
    stage_contract_source_inputs_updated = 0

    if args.mode == "baseline_update":
        if not stage_contracts_path.exists():
            print(f"stage contracts not found: {stage_contracts_path}", file=sys.stderr)
            return 1
        try:
            stage_contracts = _load_yaml(stage_contracts_path)
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 1

        figures = run_bundle.get("figures")
        if not isinstance(figures, list) or not figures:
            print("run artifact missing figures[]", file=sys.stderr)
            return 1
        try:
            normalized_figures = sorted(
                [_normalize_figure(figure) for figure in figures],
                key=lambda x: x["figure_id"],
            )
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 1

        normalized_run = {
            "schema_version": str(run_bundle.get("schema_version", "phase2-reporting-bundle-v1")),
            "run_id": run_id,
            "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "git_sha": str(run_bundle.get("git_sha", "unknown")),
            "source_db_ref": str(run_bundle.get("source_db_ref", "db://unknown-host/unknown-db")),
            "contract_version": str(run_bundle.get("contract_version", "v1")),
            "trigger": "manual_baseline_update",
            "source_file_hashes": refreshed_source_hashes,
            "figures": normalized_figures,
            "summary": copy.deepcopy(
                run_bundle.get(
                    "summary",
                    {
                        "now_set_ok": all(f["status"] != "fail" for f in normalized_figures),
                        "now_set_fail_count": sum(
                            1 for f in normalized_figures if f["status"] == "fail"
                        ),
                        "now_set_warn_count": sum(
                            1 for f in normalized_figures if f["status"] == "warn"
                        ),
                        "snapshot_drift_count": 0,
                    },
                )
            ),
            "artifact": {
                "out_path": f"baseline://{baseline_rel}",
                "sha256": _sha256_json(normalized_figures),
            },
        }
        if "source_db_meta" in run_bundle:
            normalized_run["source_db_meta"] = copy.deepcopy(run_bundle["source_db_meta"])

        stage_contract_source_inputs_updated = _refresh_stage_contract_hashes(
            stage_contracts, repo_root
        )
        _write_json(baseline_path, normalized_run)
        _write_yaml(stage_contracts_path, stage_contracts)
        updated_files = [baseline_rel, stage_rel]
    else:
        try:
            _run_renderer(
                repo_root=repo_root,
                input_path=run_bundle_path,
                render_scientific_dir=render_scientific_dir,
                render_dashboard_file=render_dashboard_file,
                render_manifest_path=render_manifest_path,
            )
        except RuntimeError as exc:
            print(str(exc), file=sys.stderr)
            return 1
        updated_files = _render_output_files(
            repo_root=repo_root,
            render_scientific_dir=render_scientific_dir,
            render_dashboard_file=render_dashboard_file,
            render_manifest_path=render_manifest_path,
        )
        if not updated_files:
            print("no render baseline files were produced", file=sys.stderr)
            return 1

    log = {
        "schema_version": "1.0.0",
        "mode": args.mode,
        "run_id": run_id,
        "run_notes": args.run_notes,
        "updated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_files": updated_files,
        "source_file_hashes": refreshed_source_hashes,
        "stage_contract_source_inputs_updated": stage_contract_source_inputs_updated,
        "render_baseline_refresh": args.mode == "render_baseline_update",
    }

    _write_json(out_dir / "baseline-refresh-log.json", log)
    print(f"{args.mode} completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
