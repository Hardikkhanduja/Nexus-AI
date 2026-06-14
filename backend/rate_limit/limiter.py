"""
Server-side rate limiting backed by PostgreSQL (user_limits table).

Uses the same table as the Express API for consistency.
"""

import logging
from datetime import date, timezone, datetime
from typing import Tuple, Optional

import psycopg2.extensions

logger = logging.getLogger(__name__)

# ── Limits ───────────────────────────────────────────────────────

GUEST_DAILY_LIMIT = 5
REGISTERED_DAILY_LIMIT = 30


async def check_and_increment(
    conn: psycopg2.extensions.connection,
    user_id: Optional[str],
) -> Tuple[bool, int, int]:
    """
    Check whether the user can make a query and increment if allowed.

    For authenticated users, checks/updates the `user_limits` table.
    For guests (user_id=None), returns a static limit — guest tracking
    is handled client-side via cookies (same as Phase 2).

    Args:
        conn: A psycopg2 database connection.
        user_id: The user's UUID, or None for guests.

    Returns:
        Tuple of (allowed: bool, remaining: int, limit: int)
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if user_id is None:
        # Guest — we can't reliably track server-side without session,
        # so we just approve and let the frontend cookie handle it.
        return True, GUEST_DAILY_LIMIT, GUEST_DAILY_LIMIT

    with conn.cursor() as cur:
        # Upsert: get or create user_limits row
        cur.execute(
            """
            INSERT INTO user_limits (user_id, queries_used_today, last_reset_date)
            VALUES (%s, 0, %s)
            ON CONFLICT (user_id) DO NOTHING
            """,
            (user_id, today_str),
        )

        # Get current values
        cur.execute(
            "SELECT queries_used_today, last_reset_date FROM user_limits WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.commit()
            return True, REGISTERED_DAILY_LIMIT, REGISTERED_DAILY_LIMIT

        queries_used, last_reset = row

        # Reset if new day
        if str(last_reset) != today_str:
            cur.execute(
                """
                UPDATE user_limits
                SET queries_used_today = 0, last_reset_date = %s
                WHERE user_id = %s
                """,
                (today_str, user_id),
            )
            queries_used = 0

        # Check limit
        if queries_used >= REGISTERED_DAILY_LIMIT:
            conn.commit()
            return False, 0, REGISTERED_DAILY_LIMIT

        # Increment
        cur.execute(
            """
            UPDATE user_limits
            SET queries_used_today = queries_used_today + 1
            WHERE user_id = %s
            """,
            (user_id,),
        )

        # Also increment total_lifetime_queries on users table
        cur.execute(
            """
            UPDATE users
            SET total_lifetime_queries = total_lifetime_queries + 1
            WHERE id = %s
            """,
            (user_id,),
        )

        conn.commit()

        remaining = REGISTERED_DAILY_LIMIT - (queries_used + 1)
        return True, max(remaining, 0), REGISTERED_DAILY_LIMIT
