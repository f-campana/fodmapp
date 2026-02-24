from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


class Database:
    def __init__(self, dsn: str) -> None:
        self._pool = ConnectionPool(
            conninfo=dsn,
            min_size=1,
            max_size=8,
            open=False,
            kwargs={"row_factory": dict_row},
        )

    def open(self) -> None:
        self._pool.open()
        self._pool.wait()

    def close(self) -> None:
        self._pool.close()

    @contextmanager
    def readonly_connection(self) -> Iterator[Connection]:
        with self._pool.connection() as conn:
            with conn.transaction():
                conn.execute("SET TRANSACTION READ ONLY")
                yield conn

    @contextmanager
    def writable_connection(self) -> Iterator[Connection]:
        with self._pool.connection() as conn:
            with conn.transaction():
                yield conn
