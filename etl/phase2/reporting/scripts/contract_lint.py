#!/usr/bin/env python3
import argparse
import json
import pathlib
import sys
from typing import Any, Dict, Iterable, List, Set

import yaml
from jsonschema import Draft202012Validator, RefResolver

NOW_SET_FIGURES = {
    "P-01_stage_progression_contract_curve",
    "P-02_candidate_pool_split_by_stage",
    "P-03_gap_completion_matrix",
    "Q-02_critical_contract_scorecard",
    "Q-03_snapshot_lock_drift_panel",
    "Q-04_rank2_exclusion_audit",
    "E-03_threshold_provenance_completeness",
    "E-04_rank2_quarantine_case_study",
}

REQUIRED_POLICY_KEYS = {
    "allowed_inputs",
    "artifact_lifecycle",
    "baseline",
    "baseline_update",
    "render_baseline_update",
    "render_baseline",
    "parser",
    "q03_scope_rule",
}

REQUIRED_FAIL_LOUD_KEYS = {
    "on_unknown_file",
    "on_unknown_metric",
    "on_missing_scalar",
    "on_null_or_empty_scalar",
    "on_duplicate_scalar",
    "on_unexpected_column",
    "on_unexpected_figure_contract",
}

REQUIRED_WORKFLOW_INPUTS = {
    "force_full_run",
    "baseline_update",
    "render_baseline_update",
    "baseline_update_confirmed",
    "baseline_update_approved_by",
}

REQUIRED_RENDER_ALLOW_WRITES = {
    "etl/phase2/reporting/contracts/baselines/render/**/*.svg",
    "etl/phase2/reporting/contracts/baselines/render/**/*.html",
    "etl/phase2/reporting/contracts/baselines/render/**/*.json",
}


class LintError(Exception):
    pass


def fail(message: str) -> None:
    raise LintError(message)


def load_json(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    if not isinstance(payload, dict):
        fail(f"JSON at {path} must be an object")
    return payload


def load_yaml(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload = yaml.safe_load(f)
    if not isinstance(payload, dict):
        fail(f"YAML at {path} must be a mapping")
    return payload


def require_files(paths: Iterable[pathlib.Path]) -> None:
    for path in paths:
        if not path.exists():
            fail(f"missing required file: {path}")


def validate_policy(policy: Dict[str, Any]) -> None:
    missing = REQUIRED_POLICY_KEYS - set(policy.keys())
    if missing:
        fail(f"policy missing keys: {sorted(missing)}")

    allowed_inputs = policy.get("allowed_inputs", {})
    if not isinstance(allowed_inputs, dict):
        fail("policy.allowed_inputs must be a mapping")

    allowed_files = allowed_inputs.get("files")
    if not isinstance(allowed_files, list) or not all(isinstance(x, str) for x in allowed_files):
        fail("policy.allowed_inputs.files must be a string list")

    parser = policy.get("parser")
    if not isinstance(parser, dict):
        fail("policy.parser must be a mapping")

    allowed_patterns = parser.get("allowed_patterns")
    if not isinstance(allowed_patterns, list) or not all(isinstance(x, str) for x in allowed_patterns):
        fail("policy.parser.allowed_patterns must be a string list")
    if not allowed_patterns:
        fail("policy.parser.allowed_patterns must be non-empty")

    fail_loud = parser.get("fail_loud")
    if not isinstance(fail_loud, dict):
        fail("policy.parser.fail_loud must be a mapping")

    missing_fail_loud = REQUIRED_FAIL_LOUD_KEYS - set(fail_loud.keys())
    if missing_fail_loud:
        fail(f"policy.parser.fail_loud missing keys: {sorted(missing_fail_loud)}")

    bad_types = [k for k in REQUIRED_FAIL_LOUD_KEYS if not isinstance(fail_loud.get(k), bool)]
    if bad_types:
        fail(f"policy.parser.fail_loud keys must be boolean: {sorted(bad_types)}")

    baseline_pattern = (policy.get("baseline", {}) or {}).get("pattern", "")
    if "etl/phase2/reporting/contracts/baselines/**/*.json" not in baseline_pattern:
        fail("baseline pattern must target contracts/baselines/**/*.json")

    render_baseline = policy.get("render_baseline")
    if not isinstance(render_baseline, dict):
        fail("policy.render_baseline must be a mapping")
    required_render_keys = {
        "version",
        "scientific_dir",
        "public_file",
        "manifest_file",
        "scientific_files",
    }
    missing_render = required_render_keys - set(render_baseline.keys())
    if missing_render:
        fail(f"policy.render_baseline missing keys: {sorted(missing_render)}")
    if (
        not isinstance(render_baseline.get("scientific_files"), list)
        or len(render_baseline.get("scientific_files", [])) != 8
    ):
        fail("policy.render_baseline.scientific_files must contain exactly 8 filenames")

    for section_name in ["baseline_update", "render_baseline_update"]:
        section = policy.get(section_name)
        if not isinstance(section, dict):
            fail(f"policy.{section_name} must be a mapping")
        required_section_keys = {
            "input_name",
            "approval_input_name",
            "approval_confirm_input_name",
            "clean_tree_required",
            "requires_workflow_dispatch",
            "log_entry_fields",
            "writable_scope",
        }
        missing_section = required_section_keys - set(section.keys())
        if missing_section:
            fail(f"policy.{section_name} missing keys: {sorted(missing_section)}")

        writable_scope = section.get("writable_scope")
        if not isinstance(writable_scope, dict):
            fail(f"policy.{section_name}.writable_scope must be a mapping")
        allow = writable_scope.get("allow")
        deny = writable_scope.get("deny")
        if not isinstance(allow, list) or not allow or not all(isinstance(x, str) for x in allow):
            fail(f"policy.{section_name}.writable_scope.allow must be a non-empty string list")
        if not isinstance(deny, list) or not all(isinstance(x, str) for x in deny):
            fail(f"policy.{section_name}.writable_scope.deny must be a string list")

    baseline_update = policy["baseline_update"]
    render_update = policy["render_baseline_update"]
    if baseline_update.get("input_name") != "baseline_update":
        fail("policy.baseline_update.input_name must be baseline_update")
    if render_update.get("input_name") != "render_baseline_update":
        fail("policy.render_baseline_update.input_name must be render_baseline_update")

    baseline_allow = set(baseline_update["writable_scope"]["allow"])
    baseline_deny = set(baseline_update["writable_scope"]["deny"])
    if any("contracts/baselines/render/" in pattern for pattern in baseline_allow):
        fail("policy.baseline_update.writable_scope.allow must exclude render baseline asset paths")
    if "etl/phase2/reporting/contracts/baselines/render/**" not in baseline_deny:
        fail("policy.baseline_update.writable_scope.deny must include render baseline subtree deny")

    render_allow = set(render_update["writable_scope"]["allow"])
    missing_render_allow = REQUIRED_RENDER_ALLOW_WRITES - render_allow
    if missing_render_allow:
        fail(f"policy.render_baseline_update missing required allow patterns: {sorted(missing_render_allow)}")
    if any(pattern.endswith(".generated.yaml") for pattern in render_allow):
        fail("policy.render_baseline_update.allow must not include generated contract writes")
    if any("/baselines/now/" in pattern for pattern in render_allow):
        fail("policy.render_baseline_update.allow must not include now baseline JSON writes")


def _validate_schema_instance(instance: Any, schema: Dict[str, Any], schema_file: pathlib.Path) -> List[str]:
    resolver = RefResolver(base_uri=schema_file.resolve().parent.as_uri() + "/", referrer=schema)
    validator = Draft202012Validator(schema, resolver=resolver)
    errors = sorted(validator.iter_errors(instance), key=lambda e: list(e.path))
    return [f"{list(err.path)}: {err.message}" for err in errors]


def validate_baseline_and_schemas(
    baseline: Dict[str, Any],
    run_schema: Dict[str, Any],
    run_schema_path: pathlib.Path,
    figure_schema: Dict[str, Any],
    parser_scope_schema: Dict[str, Any],
    policy: Dict[str, Any],
) -> None:
    run_errors = _validate_schema_instance(baseline, run_schema, run_schema_path)
    if run_errors:
        fail(f"baseline run schema validation failed: {run_errors[:5]}")

    figure_validator = Draft202012Validator(figure_schema)
    for figure in baseline.get("figures", []):
        errs = sorted(figure_validator.iter_errors(figure), key=lambda e: list(e.path))
        if errs:
            fail(f"figure payload schema validation failed for {figure.get('figure_id')}: {errs[0].message}")

    figure_ids = {f.get("figure_id") for f in baseline.get("figures", [])}
    missing_figures = NOW_SET_FIGURES - figure_ids
    if missing_figures:
        fail(f"baseline missing now-set figures: {sorted(missing_figures)}")

    parser_doc = {
        "parser_version": "1.0.0",
        "allowed": {
            "exact_files": policy["allowed_inputs"]["files"],
            "allow_patterns": policy["parser"]["allowed_patterns"],
        },
        "disallowed_patterns": [],
        "fail_loud": {
            "unknown_file": policy["parser"]["fail_loud"]["on_unknown_file"],
            "missing_metric": policy["parser"]["fail_loud"]["on_unknown_metric"],
            "missing_scalar_row": policy["parser"]["fail_loud"]["on_missing_scalar"],
            "null_or_empty_scalar": policy["parser"]["fail_loud"]["on_null_or_empty_scalar"],
            "duplicate_scalar": policy["parser"]["fail_loud"]["on_duplicate_scalar"],
            "unexpected_column": policy["parser"]["fail_loud"]["on_unexpected_column"],
            "unexpected_figure_contract": policy["parser"]["fail_loud"]["on_unexpected_figure_contract"],
        },
        "figure_metrics": [],
    }
    parser_errors = list(Draft202012Validator(parser_scope_schema).iter_errors(parser_doc))
    if parser_errors:
        fail(f"parser scope schema validation failed: {parser_errors[0].message}")


def validate_render_manifest(
    repo_root: pathlib.Path,
    policy: Dict[str, Any],
) -> None:
    render_cfg = policy.get("render_baseline", {})
    manifest_rel = render_cfg.get("manifest_file")
    scientific_dir_rel = render_cfg.get("scientific_dir")
    scientific_files = render_cfg.get("scientific_files", [])

    if not isinstance(manifest_rel, str) or not isinstance(scientific_dir_rel, str):
        fail("render_baseline manifest/scientific paths must be strings")

    schema_path = repo_root / "etl/phase2/reporting/contracts/schema/render_baseline_manifest.schema.json"
    manifest_path = repo_root / manifest_rel
    scientific_dir = repo_root / scientific_dir_rel

    require_files([schema_path, manifest_path])
    schema = load_json(schema_path)
    manifest = load_json(manifest_path)
    errors = list(Draft202012Validator(schema).iter_errors(manifest))
    if errors:
        fail(f"render baseline manifest schema validation failed: {errors[0].message}")

    if not isinstance(scientific_files, list):
        fail("render_baseline.scientific_files must be a list")
    for file_name in scientific_files:
        if not isinstance(file_name, str) or not file_name:
            fail("render_baseline.scientific_files entries must be non-empty strings")
        file_path = scientific_dir / file_name
        if not file_path.exists():
            fail(f"missing render scientific baseline file: {file_path}")


def validate_fixtures(fixtures_dir: pathlib.Path) -> None:
    files = sorted(fixtures_dir.glob("*.json"))
    if not files:
        fail(f"no fixture files found under {fixtures_dir}")

    seen: Set[str] = set()
    for path in files:
        payload = load_json(path)
        figure_id = payload.get("figure_id")
        if not isinstance(figure_id, str) or not figure_id:
            fail(f"fixture missing figure_id: {path}")

        if figure_id not in NOW_SET_FIGURES:
            fail(f"fixture has unknown or out-of-scope figure_id {figure_id}: {path}")

        if figure_id in seen:
            fail(f"duplicate fixture for figure_id {figure_id}: {path}")
        seen.add(figure_id)

        if not isinstance(payload.get("source_rows"), dict):
            fail(f"fixture source_rows must be object: {path}")

        source_hashes = payload.get("source_file_hashes")
        if not isinstance(source_hashes, dict) or not source_hashes:
            fail(f"fixture source_file_hashes must be non-empty object: {path}")

        contract_refs = payload.get("contract_refs")
        if (
            not isinstance(contract_refs, list)
            or not contract_refs
            or not all(isinstance(x, str) and x for x in contract_refs)
        ):
            fail(f"fixture contract_refs must be non-empty string list: {path}")

    missing = NOW_SET_FIGURES - seen
    if missing:
        fail(f"fixtures missing now-set figure payloads: {sorted(missing)}")


def validate_workflow(workflow: Dict[str, Any]) -> None:
    if workflow.get("name") != "phase2-reporting":
        fail("workflow name must remain phase2-reporting")

    workflow_on = workflow.get("on")
    if workflow_on is None and True in workflow:
        workflow_on = workflow.get(True)
    dispatch_inputs = ((workflow_on or {}).get("workflow_dispatch") or {}).get("inputs") or {}
    if not isinstance(dispatch_inputs, dict):
        fail("workflow_dispatch.inputs must be a mapping")

    missing_inputs = REQUIRED_WORKFLOW_INPUTS - set(dispatch_inputs.keys())
    if missing_inputs:
        fail(f"workflow missing required dispatch inputs: {sorted(missing_inputs)}")

    jobs = workflow.get("jobs") or {}
    if "contract-lint" not in jobs:
        fail("workflow must define contract-lint job")
    if "baseline-update" not in jobs:
        fail("workflow must define baseline-update job")
    if "render-baseline-update" not in jobs:
        fail("workflow must define render-baseline-update job")

    contract_steps = (jobs.get("contract-lint") or {}).get("steps") or []
    run_lines: List[str] = []
    for step in contract_steps:
        if isinstance(step, dict) and isinstance(step.get("run"), str):
            run_lines.append(step["run"])
    joined = "\n".join(run_lines)
    if "contract_lint.py" not in joined:
        fail("workflow contract-lint job must invoke scripts/contract_lint.py")
    if "pip install pyyaml==6.0.2 jsonschema==4.23.0" not in joined:
        fail("workflow contract-lint must install pinned pyyaml/jsonschema")

    baseline_steps = (jobs.get("baseline-update") or {}).get("steps") or []
    baseline_joined = "\n".join(step.get("run", "") for step in baseline_steps if isinstance(step, dict))
    if "render_baseline_update" not in baseline_joined:
        fail("baseline-update job must enforce mutual exclusion against render_baseline_update")

    render_steps = (jobs.get("render-baseline-update") or {}).get("steps") or []
    render_joined = "\n".join(step.get("run", "") for step in render_steps if isinstance(step, dict))
    if "baseline_update" not in render_joined:
        fail("render-baseline-update job must enforce mutual exclusion against baseline_update")


def validate_api_sql_rank2_contract(repo_root: pathlib.Path) -> None:
    api_sql_path = repo_root / "api/app/sql.py"
    if not api_sql_path.exists():
        fail(f"missing required API SQL file: {api_sql_path}")

    sql_text = api_sql_path.read_text(encoding="utf-8")
    required_fragments = [
        "WHERE r.status = 'active'",
        "COALESCE(p_from.priority_rank, 0) <> 2",
        "COALESCE(p_to.priority_rank, 0) <> 2",
        "rs.fodmap_safety_score >= %(min_safety_score)s",
    ]
    missing = [fragment for fragment in required_fragments if fragment not in sql_text]
    if missing:
        fail(f"api/app/sql.py missing required swap SQL clauses: {missing}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate reporting contracts and governance")
    parser.add_argument("--policy", required=True)
    parser.add_argument("--run-schema", required=True)
    parser.add_argument("--figure-schema", required=True)
    parser.add_argument("--parser-scope-schema", required=True)
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--fixtures-dir", required=True)
    parser.add_argument("--workflow", required=True)
    args = parser.parse_args()

    policy_path = pathlib.Path(args.policy)
    run_schema_path = pathlib.Path(args.run_schema)
    figure_schema_path = pathlib.Path(args.figure_schema)
    parser_scope_schema_path = pathlib.Path(args.parser_scope_schema)
    baseline_path = pathlib.Path(args.baseline)
    fixtures_dir = pathlib.Path(args.fixtures_dir)
    workflow_path = pathlib.Path(args.workflow)
    repo_root = pathlib.Path(__file__).resolve().parents[4]

    try:
        require_files(
            [
                policy_path,
                run_schema_path,
                figure_schema_path,
                parser_scope_schema_path,
                baseline_path,
                workflow_path,
            ]
        )

        policy = load_yaml(policy_path)
        run_schema = load_json(run_schema_path)
        figure_schema = load_json(figure_schema_path)
        parser_scope_schema = load_json(parser_scope_schema_path)
        baseline = load_json(baseline_path)
        workflow = load_yaml(workflow_path)

        validate_policy(policy)
        validate_baseline_and_schemas(
            baseline=baseline,
            run_schema=run_schema,
            run_schema_path=run_schema_path,
            figure_schema=figure_schema,
            parser_scope_schema=parser_scope_schema,
            policy=policy,
        )
        validate_fixtures(fixtures_dir)
        validate_workflow(workflow)
        validate_render_manifest(repo_root, policy)
        validate_api_sql_rank2_contract(repo_root)

    except LintError as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1

    print("contract-lint passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
