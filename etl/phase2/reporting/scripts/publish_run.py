#!/usr/bin/env python3
import argparse
import json
import pathlib
from datetime import datetime, timezone


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish reporting run outputs")
    parser.add_argument("--run-dir", required=True)
    parser.add_argument("--mode", required=True)
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()

    run_dir = pathlib.Path(args.run_dir)
    run_file = run_dir / "run.json"

    if not run_file.exists():
        print(f"run file missing: {run_file}")
        return 1

    payload = json.loads(run_file.read_text(encoding="utf-8"))
    payload["published_at_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload["publish_mode"] = args.mode
    payload["publish_manifest"] = str(args.manifest)

    (run_dir / "published_run.json").write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
