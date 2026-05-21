"""
OrbitSpeed — SQLite history persistence layer.

Uses Python's built-in sqlite3 module — zero extra dependencies.
Provides a clean CRUD interface for saving and retrieving test results.
"""

import os
import sqlite3
import time
import tempfile
from contextlib import contextmanager

DB_PATH = (
    os.path.join(tempfile.gettempdir(), "speed_history.db")
    if os.environ.get("VERCEL")
    else "speed_history.db"
)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS test_results (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp REAL    NOT NULL,
    ping      REAL,
    download  REAL,
    upload    REAL,
    isp       TEXT    DEFAULT '',
    city      TEXT    DEFAULT '',
    country   TEXT    DEFAULT '',
    ip        TEXT    DEFAULT ''
);
"""


@contextmanager
def _get_conn():
    """Context manager: opens a SQLite connection, commits on success, always closes."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    """Create the database schema on first run (idempotent)."""
    with _get_conn() as conn:
        conn.executescript(_SCHEMA)
    print(f"[OrbitSpeed] Database ready: {DB_PATH}")


def save_result(
    ping:     float,
    download: float,
    upload:   float,
    isp:      str = "",
    city:     str = "",
    country:  str = "",
    ip:       str = "",
) -> None:
    """Insert one completed speed-test result into the database."""
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT INTO test_results
                (timestamp, ping, download, upload, isp, city, country, ip)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (time.time(), ping, download, upload, isp, city, country, ip),
        )


def get_history(limit: int = 50) -> list:
    """Return the most recent `limit` test results as a list of plain dicts."""
    with _get_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, timestamp, ping, download, upload, isp, city, country, ip
            FROM   test_results
            ORDER  BY timestamp DESC
            LIMIT  ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def clear_history() -> None:
    """Delete every row from test_results."""
    with _get_conn() as conn:
        conn.execute("DELETE FROM test_results")
