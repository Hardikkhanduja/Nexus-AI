"""
Server-side rate limiting backed by PostgreSQL (user_limits table).

Uses the same table as the Express API for consistency.
"""

import logging
from datetime import timezone, datetime
from typing import Tuple, Optional

import psycopg2.extensions

logger = logging.getLogger(__name__)

# ── Limits ───────────────────────────────────────────────────────

GUEST_DAILY_LIMIT = 5
REGISTERED_DAILY_LIMIT = 30


async def check_and_increment(
    conn: Optional[psycopg2.extensions.connection],
    user_id: Optional[str],
) -> Tuple[bool, int, int]:
    """
    Check whether the user can make a query and increment if allowed.

    If the database is unavailable, fall back to a permissive local limit so
    chat can still proceed in development mode.
    """
    if user_id is None:
        return True, GUEST_DAILY_LIMIT, GUEST_DAILY_LIMIT

    if conn is None:
        logger.warning("Rate-limit DB connection unavailable; allowing request with fallback limit.")
        return True, REGISTERED_DAILY_LIMIT, REGISTERED_DAILY_LIMIT

    try:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO user_limits (user_id, queries_used_today, last_reset_date)
                VALUES (%s, 0, %s)
                ON CONFLICT (user_id) DO NOTHING
                """,
                (user_id, today_str),
            )

            cur.execute(
                "SELECT queries_used_today, last_reset_date FROM user_limits WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                conn.commit()
                return True, REGISTERED_DAILY_LIMIT, REGISTERED_DAILY_LIMIT

            queries_used, last_reset = row

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

            if queries_used >= REGISTERED_DAILY_LIMIT:
                conn.commit()
                return False, 0, REGISTERED_DAILY_LIMIT

            cur.execute(
                """
                UPDATE user_limits
                SET queries_used_today = queries_used_today + 1
                WHERE user_id = %s
                """,
                (user_id,),
            )

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
    except Exception as exc:
        logger.warning(f"Rate-limit check failed; using fallback response: {exc}")
        return True, REGISTERED_DAILY_LIMIT, REGISTERED_DAILY_LIMIT
