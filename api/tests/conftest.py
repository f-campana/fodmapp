from __future__ import annotations

import os
from collections.abc import Iterator

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.main import create_app


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


@pytest.fixture()
def db_conn(db_url: str, integration_guard: None):
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        with conn.transaction():
            conn.execute("SET TRANSACTION READ ONLY")
            yield conn
