#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Iterable

EXPECTED_HEADERS = [
    "rule_key",
    "from_priority_rank",
    "to_priority_rank",
    "scoring_version_snapshot",
    "fodmap_safety_score_snapshot",
    "from_level",
    "to_level",
    "from_burden_ratio",
    "to_burden_ratio",
    "to_coverage_ratio",
    "auto_eligible",
    "review_decision",
    "review_notes",
    "reviewed_by",
    "reviewed_at",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Overlay committed review decisions/meta onto a live Phase 3 review export."
    )
    parser.add_argument("--review-template", type=Path, required=True)
    parser.add_argument("--rescore-export", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def read_rows(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        fieldnames = list(reader.fieldnames or [])
        rows = [dict(row) for row in reader]
    return fieldnames, rows


def validate_headers(fieldnames: list[str], label: str) -> None:
    if fieldnames != EXPECTED_HEADERS:
        raise ValueError(
            f"{label} headers do not match the expected review contract: expected {EXPECTED_HEADERS}, got {fieldnames}"
        )


def ensure_row_count(rows: Iterable[dict[str, str]], label: str) -> list[dict[str, str]]:
    materialized = list(rows)
    if len(materialized) != 12:
        raise ValueError(f"{label} must contain exactly 12 rows, got {len(materialized)}")
    return materialized


def validate_review_template(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    approve_count = sum(1 for row in rows if row["review_decision"] == "approve")
    reject_count = sum(1 for row in rows if row["review_decision"] == "reject")
    if approve_count != 11 or reject_count != 1:
        raise ValueError(
            f"review template must be 11 approve / 1 reject, got {approve_count} approve / {reject_count} reject"
        )

    missing_meta = [row["rule_key"] for row in rows if not row["reviewed_by"].strip() or not row["reviewed_at"].strip()]
    if missing_meta:
        raise ValueError(
            "review template rows are missing reviewed_by/reviewed_at for rule_key values: "
            + ", ".join(sorted(missing_meta))
        )

    by_rule = {row["rule_key"]: row for row in rows}
    if len(by_rule) != len(rows):
        raise ValueError("review template contains duplicate rule_key values")
    return by_rule


def validate_export_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    by_rule = {row["rule_key"]: row for row in rows}
    if len(by_rule) != len(rows):
        raise ValueError("rescore export contains duplicate rule_key values")
    return rows


def synthesize_review_packet(
    *,
    review_template_path: Path,
    rescore_export_path: Path,
    output_path: Path,
) -> dict[str, int]:
    template_headers, template_rows = read_rows(review_template_path)
    validate_headers(template_headers, "review template")
    template_rows = ensure_row_count(template_rows, "review template")
    template_by_rule = validate_review_template(template_rows)

    export_headers, export_rows = read_rows(rescore_export_path)
    validate_headers(export_headers, "rescore export")
    export_rows = ensure_row_count(export_rows, "rescore export")
    validate_export_rows(export_rows)

    synthesized_rows: list[dict[str, str]] = []
    seen_rule_keys: set[str] = set()

    for export_row in export_rows:
        rule_key = export_row["rule_key"]
        template_row = template_by_rule.get(rule_key)
        if template_row is None:
            raise ValueError(f"rescore export contains unexpected rule_key {rule_key}")

        for locked_field in ("from_priority_rank", "to_priority_rank"):
            if export_row[locked_field] != template_row[locked_field]:
                raise ValueError(
                    f"rule {rule_key} changed {locked_field}: "
                    f"template={template_row[locked_field]} export={export_row[locked_field]}"
                )

        synthesized_row = dict(export_row)
        synthesized_row["review_decision"] = template_row["review_decision"]
        synthesized_row["review_notes"] = template_row["review_notes"]
        synthesized_row["reviewed_by"] = template_row["reviewed_by"]
        synthesized_row["reviewed_at"] = template_row["reviewed_at"]
        synthesized_rows.append(synthesized_row)
        seen_rule_keys.add(rule_key)

    missing_rule_keys = sorted(set(template_by_rule) - seen_rule_keys)
    if missing_rule_keys:
        raise ValueError(
            "review template contains rule_key values missing from rescore export: " + ", ".join(missing_rule_keys)
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=EXPECTED_HEADERS)
        writer.writeheader()
        writer.writerows(synthesized_rows)

    return {
        "row_count": len(synthesized_rows),
        "approve_count": sum(1 for row in synthesized_rows if row["review_decision"] == "approve"),
        "reject_count": sum(1 for row in synthesized_rows if row["review_decision"] == "reject"),
    }


def main() -> int:
    args = parse_args()
    stats = synthesize_review_packet(
        review_template_path=args.review_template,
        rescore_export_path=args.rescore_export,
        output_path=args.output,
    )
    print(json.dumps(stats, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
