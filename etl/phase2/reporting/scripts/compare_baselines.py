#!/usr/bin/env python3
import argparse
import json
import math
import pathlib
import sys
from typing import Any, Dict, Iterable, List, Optional

import yaml


def _load_json(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_yaml(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload = yaml.safe_load(f)
    if not isinstance(payload, dict):
        raise ValueError(f"YAML at {path} must be a mapping")
    return payload


def _diff_numbers(actual: Any, expected: Any, eps: float) -> Optional[Dict[str, Any]]:
    if isinstance(actual, bool) or isinstance(expected, bool):
        if actual == expected:
            return None
        return {"actual": actual, "expected": expected, "reason": "bool_mismatch"}

    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        if isinstance(actual, int) and isinstance(expected, int):
            if actual != expected:
                return {"actual": actual, "expected": expected, "reason": "int_mismatch"}
            return None
        if math.isfinite(float(actual)) and math.isfinite(float(expected)):
            delta = abs(float(actual) - float(expected))
            if delta > eps:
                return {
                    "actual": actual,
                    "expected": expected,
                    "reason": "float_mismatch",
                    "abs_delta": delta,
                }
            return None

    return {"actual": actual, "expected": expected, "reason": "type_or_nan_mismatch"}


def _diff(left: Any, right: Any, eps: float) -> Optional[Any]:
    if left is None and right is None:
        return None
    if left is None or right is None:
        return {"left": left, "right": right, "reason": "missing_field"}

    if isinstance(left, dict) and isinstance(right, dict):
        keys = set(left.keys()) | set(right.keys())
        deltas: Dict[str, Any] = {}
        for key in sorted(keys):
            d = _diff(left.get(key), right.get(key), eps)
            if d is not None:
                deltas[key] = d
        return deltas or None

    if isinstance(left, list) and isinstance(right, list):
        if len(left) != len(right):
            return {
                "left": left,
                "right": right,
                "reason": "list_len_mismatch",
                "actual_len": len(left),
                "expected_len": len(right),
            }
        deltas: Dict[str, Any] = {}
        for idx, (l_item, r_item) in enumerate(zip(left, right)):
            d = _diff(l_item, r_item, eps)
            if d is not None:
                deltas[str(idx)] = d
        return deltas or None

    if isinstance(left, (int, float, bool)) and isinstance(right, (int, float, bool)):
        return _diff_numbers(left, right, eps)

    if left != right:
        return {"left": left, "right": right, "reason": "value_mismatch"}

    return None


def _get_path(payload: Dict[str, Any], dotted: str) -> Any:
    cursor: Any = payload
    for part in dotted.split("."):
        if isinstance(cursor, dict) and part in cursor:
            cursor = cursor[part]
        else:
            return None
    return cursor


def _semantic_projection(
    figure: Dict[str, Any], figure_id: str, policy: Dict[str, Any]
) -> Dict[str, Any]:
    default_cfg = policy.get("default", {})
    figure_cfg = (policy.get("figures", {}) or {}).get(figure_id, {})

    include_paths: List[str] = figure_cfg.get("include", default_cfg.get("include", []))
    projection: Dict[str, Any] = {}
    for dotted in include_paths:
        value = _get_path(figure, dotted)
        if dotted == "contract_refs" and isinstance(value, list):
            value = sorted(value)
        projection[dotted] = value
    return projection


def _full_projection(
    figure: Dict[str, Any], ignore_paths: Iterable[str]
) -> Dict[str, Any]:
    projection = dict(figure)
    for dotted in ignore_paths:
        parts = dotted.split(".")
        cursor = projection
        for part in parts[:-1]:
            if isinstance(cursor, dict) and part in cursor and isinstance(cursor[part], dict):
                cursor = cursor[part]
            else:
                cursor = None
                break
        if isinstance(cursor, dict):
            cursor.pop(parts[-1], None)
    if isinstance(projection.get("contract_refs"), list):
        projection["contract_refs"] = sorted(projection["contract_refs"])
    return projection


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare run artifact against baseline")
    parser.add_argument("--mode", required=True, choices=["now", "all"])
    parser.add_argument("--run-artifact", required=True)
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--float-eps", type=float, default=1e-6)
    parser.add_argument("--compare-scope", choices=["semantic", "full"], default="semantic")
    parser.add_argument(
        "--semantic-policy",
        default="etl/phase2/reporting/contracts/schema/semantic_compare_fields.yaml",
    )
    args = parser.parse_args()

    run_artifact = pathlib.Path(args.run_artifact)
    baseline_path = pathlib.Path(args.baseline)

    run_bundle = run_artifact / "run.json" if run_artifact.is_dir() else run_artifact
    if not run_bundle.exists():
        print(f"run artifact missing: {run_bundle}", file=sys.stderr)
        return 1
    if not baseline_path.exists():
        print(f"baseline missing: {baseline_path}", file=sys.stderr)
        return 1

    run = _load_json(run_bundle)
    baseline = _load_json(baseline_path)

    semantic_policy: Dict[str, Any] = {}
    if args.compare_scope in {"semantic", "full"}:
        policy_path = pathlib.Path(args.semantic_policy)
        try:
            semantic_policy = _load_yaml(policy_path)
        except (FileNotFoundError, ValueError) as exc:
            print(f"semantic policy load failed ({policy_path}): {exc}", file=sys.stderr)
            return 1

    run_figures = {f["figure_id"]: f for f in run.get("figures", [])}
    baseline_figures = {f["figure_id"]: f for f in baseline.get("figures", [])}

    figure_scope = set(baseline_figures.keys()) if args.mode == "now" else set(run_figures.keys()) | set(baseline_figures.keys())

    full_ignore = []
    if args.compare_scope == "full":
        full_ignore = (semantic_policy.get("default", {}) or {}).get("ignore", [])
        if not isinstance(full_ignore, list):
            print("semantic policy default.ignore must be a list for compare-scope=full", file=sys.stderr)
            return 1

    mismatches: List[Dict[str, Any]] = []

    for figure_id in sorted(figure_scope):
        expected = baseline_figures.get(figure_id)
        actual = run_figures.get(figure_id)
        if actual is None:
            mismatches.append({"figure_id": figure_id, "reason": "missing_actual_figure"})
            continue
        if expected is None:
            mismatches.append({"figure_id": figure_id, "reason": "missing_baseline_figure"})
            continue

        if args.compare_scope == "semantic":
            left = _semantic_projection(actual, figure_id, semantic_policy)
            right = _semantic_projection(expected, figure_id, semantic_policy)
        else:
            left = _full_projection(actual, full_ignore)
            right = _full_projection(expected, full_ignore)

        delta = _diff(left, right, args.float_eps)
        if delta is not None:
            mismatches.append({"figure_id": figure_id, "diff": delta})

    out_diff = {
        "run_id": run.get("run_id"),
        "baseline": str(baseline_path),
        "mode": args.mode,
        "compare_scope": args.compare_scope,
        "float_eps": args.float_eps,
        "mismatch_count": len(mismatches),
        "mismatches": mismatches,
        "ok": len(mismatches) == 0,
    }

    if run_artifact.is_dir():
        out_path = run_artifact / "baseline-diff.json"
    else:
        out_path = run_bundle.with_name("baseline-diff.json")
    out_path.write_text(json.dumps(out_diff, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    if mismatches:
        print(f"baseline drift found: {len(mismatches)}", file=sys.stderr)
        return 1

    print("baseline compare passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
