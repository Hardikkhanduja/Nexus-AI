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


def init_db_migrations() -> None:
    """Ensure all required analytics columns exist in messages table."""
    if _pool is None:
        return
    try:
        conn = _pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    ALTER TABLE messages ADD COLUMN IF NOT EXISTS category VARCHAR(100);
                    ALTER TABLE messages ADD COLUMN IF NOT EXISTS persona_role VARCHAR(50);
                    ALTER TABLE messages ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
                    ALTER TABLE messages ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
                    ALTER TABLE messages ADD COLUMN IF NOT EXISTS was_fallback BOOLEAN DEFAULT FALSE;
                    ALTER TABLE messages ADD COLUMN IF NOT EXISTS conflict_analysis TEXT;
                """)
                conn.commit()
                logger.info("Database migrations applied successfully (messages schema updated).")
        finally:
            _pool.putconn(conn)
    except Exception as e:
        logger.warning(f"Failed to apply DB migrations: {e}")

def init_pool() -> None:
    """Initialize the connection pool. Call once at app startup."""
    global _pool
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        logger.warning("DATABASE_URL is not set; database features will be unavailable.")
        _pool = None
        return

    try:
        _pool = psycopg2.pool.SimpleConnectionPool(
            minconn=2,
            maxconn=10,
            dsn=database_url,
        )
        logger.info("Database connection pool initialized.")
        init_db_migrations()
    except Exception as exc:
        logger.warning(f"Database connection pool unavailable: {exc}")
        _pool = None


def get_pool() -> psycopg2.pool.SimpleConnectionPool:
    """Get the connection pool, initializing if needed."""
    global _pool
    if _pool is None:
        init_pool()
    if _pool is None:
        raise RuntimeError("Database pool is unavailable")
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
