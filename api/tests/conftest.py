from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.main import create_app

SECURITY_MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "schema" / "migrations" / "2026-02-25_security_consent_export_delete.sql"
)
SAFE_HARBOR_MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "schema" / "migrations" / "2026-03-13_safe_harbor_v1.sql"
)
SAFE_HARBOR_APPLY_PATH = (
    Path(__file__).resolve().parents[2] / "etl" / "phase3" / "sql" / "phase3_safe_harbor_v1_apply.sql"
)
SAFE_HARBOR_CHECKS_PATH = (
    Path(__file__).resolve().parents[2] / "etl" / "phase3" / "sql" / "phase3_safe_harbor_v1_checks.sql"
)


def _default_db_url() -> str:
    user = os.getenv("USER", "postgres")
    return f"postgresql://{user}@localhost:5432/fodmap_test"


@pytest.fixture(scope="session")
def db_url() -> str:
    return os.getenv("API_DB_URL", _default_db_url())


@pytest.fixture(scope="session")
def app_instance(db_url: str):
    os.environ["API_DB_URL"] = db_url
    return create_app()


@pytest.fixture()
def client(app_instance) -> Iterator[TestClient]:
    with TestClient(app_instance) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def integration_db_ready(db_url: str) -> bool:
    try:
        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            row = conn.execute("SELECT to_regclass('public.foods') AS foods_table").fetchone()
            return bool(row and row["foods_table"])
    except Exception:
        return False


@pytest.fixture()
def integration_guard(integration_db_ready: bool) -> None:
    if not integration_db_ready:
        pytest.skip("integration DB is not ready or schema is missing")


def _ensure_me_security_schema(db_url: str) -> None:
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        table_state = conn.execute("SELECT to_regclass('public.me_mutation_queue') AS queue_table").fetchone()
        if table_state and table_state["queue_table"]:
            return

    migration_sql = SECURITY_MIGRATION_PATH.read_text(encoding="utf-8")
    with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
        conn.execute(migration_sql)


def _ensure_safe_harbor_schema(db_url: str) -> None:
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        table_state = conn.execute("SELECT to_regclass('public.safe_harbor_cohorts') AS cohort_table").fetchone()
        cohort_table_exists = bool(table_state and table_state["cohort_table"])

    if not cohort_table_exists:
        migration_sql = SAFE_HARBOR_MIGRATION_PATH.read_text(encoding="utf-8")
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            conn.execute(migration_sql)

    apply_sql = SAFE_HARBOR_APPLY_PATH.read_text(encoding="utf-8")
    checks_sql = SAFE_HARBOR_CHECKS_PATH.read_text(encoding="utf-8")
    with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
        conn.execute(apply_sql)
        conn.execute(checks_sql)


@pytest.fixture(scope="session")
def me_security_schema(db_url: str, integration_db_ready: bool) -> None:
    if not integration_db_ready:
        pytest.skip("integration DB is not ready or schema is missing")
    _ensure_me_security_schema(db_url)


@pytest.fixture(scope="session")
def safe_harbor_schema(db_url: str, integration_db_ready: bool) -> None:
    if not integration_db_ready:
        pytest.skip("integration DB is not ready or schema is missing")
    _ensure_safe_harbor_schema(db_url)


@pytest.fixture()
def db_conn(db_url: str, integration_guard: None):
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        with conn.transaction():
            conn.execute("SET TRANSACTION READ ONLY")
            yield conn
