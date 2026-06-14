"""
Database connection helper for the Python backend.

Connects to the same Supabase PostgreSQL instance as the Express API
using the shared DATABASE_URL environment variable.
"""

import os
import logging
from contextlib import contextmanager
from typing import Generator

import psycopg2
import psycopg2.pool
import psycopg2.extensions

logger = logging.getLogger(__name__)

_pool: psycopg2.pool.SimpleConnectionPool | None = None


def init_pool() -> None:
    """Initialize the connection pool. Call once at app startup."""
    global _pool
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is required.")

    _pool = psycopg2.pool.SimpleConnectionPool(
        minconn=2,
        maxconn=10,
        dsn=database_url,
    )
    logger.info("Database connection pool initialized.")


def get_pool() -> psycopg2.pool.SimpleConnectionPool:
    """Get the connection pool, initializing if needed."""
    global _pool
    if _pool is None:
        init_pool()
    assert _pool is not None
    return _pool


@contextmanager
def get_connection() -> Generator[psycopg2.extensions.connection, None, None]:
    """
    Context manager that checks out a connection from the pool
    and returns it when done.

    Usage:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(...)
    """
    pool = get_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)


def close_pool() -> None:
    """Close all connections in the pool. Call at app shutdown."""
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None
        logger.info("Database connection pool closed.")
