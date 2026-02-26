#!/usr/bin/env python3
import argparse
import json
import os
import pathlib
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlparse


def _run(cmd, cwd, env, label):
    start = time.time()
    proc = subprocess.run(cmd, cwd=str(cwd), env=env, text=True, capture_output=True)
    elapsed = round(time.time() - start, 3)
    step = {
        "label": label,
        "cmd": cmd,
        "returncode": proc.returncode,
        "elapsed_sec": elapsed,
    }
    if proc.returncode != 0:
        error_hint = _sanitize_error_hint(proc.stderr, proc.stdout)
        if error_hint:
            step["error_hint"] = error_hint
    return step


def _sanitize_error_hint(stderr: str, stdout: str) -> str:
    for candidate in (stderr, stdout):
        if not candidate:
            continue
        for line in candidate.splitlines():
            text = line.strip()
            if not text:
                continue
            text = re.sub(r"postgres(?:ql)?://\S+", "db://redacted", text)
            text = re.sub(r"(?i)(password=)\S+", r"\1REDACTED", text)
            text = re.sub(r"(?i)(password\s+for\s+user\s+\S+\s*:)\s*\S+", r"\1 REDACTED", text)
            return text[:240]
    return ""


def _sanitize_db_target(db_url: str) -> str:
    parsed = urlparse(db_url)
    host = parsed.hostname or "unknown-host"
    db_name = (parsed.path or "/").lstrip("/") or "unknown-db"
    return f"db://{host}/{db_name}"


def _write_manifest(
    manifest_path: pathlib.Path,
    trigger: str,
    replay_db_url: str,
    seed_db_url: str,
    steps,
    status: str,
) -> None:
    manifest = {
        "trigger": trigger,
        "status": status,
        "executed_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "replay_db_target": _sanitize_db_target(replay_db_url),
        "seed_db_target": _sanitize_db_target(seed_db_url),
        "steps": steps,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _db_env_from_url(db_url: str):
    parsed = urlparse(db_url)
    user = parsed.username or os.getenv("PGUSER") or "postgres"
    host = parsed.hostname or os.getenv("PGHOST") or "localhost"
    port = str(parsed.port or os.getenv("PGPORT") or "5432")
    db_name = (parsed.path or "/").lstrip("/") or "fodmap_api_ci"
    return {
        "PGUSER": user,
        "PGHOST": host,
        "PGPORT": port,
        "REPLAY_DB": db_name,
        "REPLAY_DB_URL": db_url,
        "ADMIN_DB_URL": f"postgresql://{user}:{parsed.password or os.getenv('PGPASSWORD','postgres')}@{host}:{port}/postgres",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Replay phase2 + seed phase3 for reporting")
    parser.add_argument("--trigger", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--replay-db-url", default=os.getenv("REPLAY_DB_URL", ""))
    parser.add_argument("--seed-db-url", default=os.getenv("SEED_DB_URL", ""))
    args = parser.parse_args()

    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    repo_root = pathlib.Path(__file__).resolve().parents[4]
    replay_script = repo_root / "etl/phase2/scripts/phase2_replay_from_zero.sh"
    phase3_seed_script = repo_root / "etl/phase3/scripts/phase3_seed_for_api_ci.sh"

    if not replay_script.exists():
        print(f"[FAIL] replay script missing: {replay_script}", file=sys.stderr)
        return 1
    if not phase3_seed_script.exists():
        print(f"[FAIL] phase3 seed script missing: {phase3_seed_script}", file=sys.stderr)
        return 1

    replay_db_url = args.replay_db_url or args.seed_db_url
    seed_db_url = args.seed_db_url or args.replay_db_url
    if not replay_db_url or not seed_db_url:
        print("[FAIL] replay/seed DB URLs are required", file=sys.stderr)
        return 1

    env = os.environ.copy()
    env.update(_db_env_from_url(replay_db_url))
    env["SEED_DB_URL"] = seed_db_url
    env.setdefault("PSQL_BIN", "psql")

    # Preserve CIQUAL paths if provided by workflow fetch step.
    for key in ["CIQUAL_XLSX", "CIQUAL_ALIM_XML", "CIQUAL_GRP_XML"]:
        if key in os.environ:
            env[key] = os.environ[key]

    steps = []

    steps.append(_run(["bash", "-n", str(replay_script)], cwd=repo_root, env=env, label="validate_phase2_replay_syntax"))
    if steps[-1]["returncode"] != 0:
        _write_manifest(
            out_dir / "replay_seed_manifest.json",
            trigger=args.trigger,
            replay_db_url=replay_db_url,
            seed_db_url=seed_db_url,
            steps=steps,
            status="failed",
        )
        return 1

    steps.append(_run([str(replay_script)], cwd=repo_root, env=env, label="phase2_replay_from_zero"))
    if steps[-1]["returncode"] != 0:
        _write_manifest(
            out_dir / "replay_seed_manifest.json",
            trigger=args.trigger,
            replay_db_url=replay_db_url,
            seed_db_url=seed_db_url,
            steps=steps,
            status="failed",
        )
        return 1

    steps.append(_run([str(phase3_seed_script)], cwd=repo_root, env=env, label="phase3_seed_for_api_ci"))
    status = "ok" if all(step["returncode"] == 0 for step in steps) else "failed"
    _write_manifest(
        out_dir / "replay_seed_manifest.json",
        trigger=args.trigger,
        replay_db_url=replay_db_url,
        seed_db_url=seed_db_url,
        steps=steps,
        status=status,
    )

    if status != "ok":
        print("[FAIL] replay/seed execution failed", file=sys.stderr)
        return 1

    print("[OK] replay/seed execution completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
