#!/usr/bin/env python3
import argparse
import pathlib
import sys
from typing import Any, Dict, Iterable, List

import psycopg2
import yaml


REQUIRED_STAGE_KEYS = {
    "id",
    "order",
    "source_file",
    "resolved_rows",
    "unresolved_rows",
    "threshold_set_rows",
    "candidate_pool",
}


def _load_yaml(path: pathlib.Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload = yaml.safe_load(f)
    if not isinstance(payload, dict):
        raise ValueError(f"stage contracts at {path} must be a mapping")
    return payload


def _load_sql(path: pathlib.Path) -> str:
    sql = path.read_text(encoding="utf-8").strip()
    if not sql:
        raise ValueError(f"snapshot SQL is empty: {path}")
    return sql


def _as_int(raw: Any, key: str, stage_id: str) -> int:
    if not isinstance(raw, int):
        raise ValueError(f"stage {stage_id} key {key} must be integer")
    if raw < 0:
        raise ValueError(f"stage {stage_id} key {key} must be >= 0")
    return raw


def _parse_stage_rows(stage_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows = stage_doc.get("executed_stage_order")
    if not isinstance(rows, list) or not rows:
        raise ValueError("stage contracts must include non-empty executed_stage_order[]")

    parsed: List[Dict[str, Any]] = []
    seen_ids = set()
    seen_orders = set()
    for idx, raw in enumerate(rows):
        if not isinstance(raw, dict):
            raise ValueError(f"stage row[{idx}] must be an object")
        missing = REQUIRED_STAGE_KEYS - set(raw.keys())
        if missing:
            raise ValueError(f"stage row[{idx}] missing keys: {sorted(missing)}")

        stage_id = raw.get("id")
        if not isinstance(stage_id, str) or not stage_id:
            raise ValueError(f"stage row[{idx}] id must be non-empty string")
        stage_order = _as_int(raw.get("order"), "order", stage_id)
        if stage_order < 1:
            raise ValueError(f"stage {stage_id} order must be >= 1")

        if stage_id in seen_ids:
            raise ValueError(f"duplicate stage id: {stage_id}")
        if stage_order in seen_orders:
            raise ValueError(f"duplicate stage order: {stage_order}")
        seen_ids.add(stage_id)
        seen_orders.add(stage_order)

        source_file = raw.get("source_file")
        if not isinstance(source_file, str) or not source_file:
            raise ValueError(f"stage {stage_id} source_file must be non-empty string")

        candidate_pool = raw.get("candidate_pool")
        if not isinstance(candidate_pool, dict):
            raise ValueError(f"stage {stage_id} candidate_pool must be an object")

        parsed.append(
            {
                "stage_order": stage_order,
                "stage_id": stage_id,
                "source_file": source_file,
                "resolved_rows": _as_int(raw.get("resolved_rows"), "resolved_rows", stage_id),
                "unresolved_rows": _as_int(raw.get("unresolved_rows"), "unresolved_rows", stage_id),
                "threshold_set_rows": _as_int(
                    raw.get("threshold_set_rows"), "threshold_set_rows", stage_id
                ),
                "with_candidates_rows": _as_int(
                    candidate_pool.get("with_candidates_rows"),
                    "candidate_pool.with_candidates_rows",
                    stage_id,
                ),
                "without_candidates_rows": _as_int(
                    candidate_pool.get("without_candidates_rows"),
                    "candidate_pool.without_candidates_rows",
                    stage_id,
                ),
            }
        )

    return sorted(parsed, key=lambda x: x["stage_order"])


def _load_rows(stage_contracts_path: pathlib.Path) -> List[Dict[str, Any]]:
    stage_doc = _load_yaml(stage_contracts_path)
    rows = _parse_stage_rows(stage_doc)
    if rows[-1]["resolved_rows"] < 1:
        raise ValueError("final stage resolved_rows must be >= 1")
    return rows


def _write_snapshot(
    db_url: str,
    snapshot_sql: str,
    rows: Iterable[Dict[str, Any]],
) -> int:
    count = 0
    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(snapshot_sql)
            insert_sql = """
                INSERT INTO reporting_stage_contract_snapshot (
                    stage_order,
                    stage_id,
                    source_file,
                    resolved_rows,
                    unresolved_rows,
                    threshold_set_rows,
                    with_candidates_rows,
                    without_candidates_rows
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """
            for row in rows:
                cur.execute(
                    insert_sql,
                    (
                        row["stage_order"],
                        row["stage_id"],
                        row["source_file"],
                        row["resolved_rows"],
                        row["unresolved_rows"],
                        row["threshold_set_rows"],
                        row["with_candidates_rows"],
                        row["without_candidates_rows"],
                    ),
                )
                count += 1
    return count


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Load deterministic reporting stage contracts into DB snapshot table"
    )
    parser.add_argument("--db-url", required=True)
    parser.add_argument(
        "--stage-contracts",
        default="etl/phase2/reporting/contracts/generated/stage_contracts.generated.yaml",
    )
    parser.add_argument(
        "--snapshot-sql",
        default="etl/phase2/reporting/sql/reporting_stage_contract_snapshot.sql",
    )
    args = parser.parse_args()

    stage_contracts_path = pathlib.Path(args.stage_contracts)
    snapshot_sql_path = pathlib.Path(args.snapshot_sql)
    if not stage_contracts_path.exists():
        print(f"[FAIL] stage contracts file missing: {stage_contracts_path}", file=sys.stderr)
        return 1
    if not snapshot_sql_path.exists():
        print(f"[FAIL] snapshot SQL file missing: {snapshot_sql_path}", file=sys.stderr)
        return 1

    try:
        rows = _load_rows(stage_contracts_path)
        snapshot_sql = _load_sql(snapshot_sql_path)
        inserted = _write_snapshot(args.db_url, snapshot_sql, rows)
    except Exception as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1

    print(f"[OK] loaded reporting_stage_contract_snapshot rows={inserted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
