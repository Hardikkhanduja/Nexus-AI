"""
Server-side rate limiting backed by PostgreSQL (user_limits table).
Free Tier: 10 queries/day limit.
Pro Tier: Unlimited queries/day.
"""

import logging
from datetime import timezone, datetime
from typing import Tuple, Optional
import psycopg2.extensions

logger = logging.getLogger(__name__)

FREE_DAILY_LIMIT = 10
PRO_DAILY_LIMIT = 999999  # Unlimited

def is_valid_uuid(val: str) -> bool:
    try:
        import uuid
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

async def check_and_increment(
    conn: Optional[psycopg2.extensions.connection],
    clerk_id: Optional[str],
    user_tier: str = "free"
) -> Tuple[bool, int, int]:
    """
    Checks rate limit based on user tier.
    Free tier = 10 queries/day.
    Pro tier = Unlimited.
    """
    daily_limit = PRO_DAILY_LIMIT if user_tier == "pro" else FREE_DAILY_LIMIT

    if not clerk_id or clerk_id == "guest":
        return True, FREE_DAILY_LIMIT, FREE_DAILY_LIMIT

    if conn is None:
        return True, daily_limit, daily_limit

    try:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        with conn.cursor() as cur:
            # 1. Ensure user_limits row exists
            cur.execute(
                """
                INSERT INTO user_limits (clerk_id, queries_used_today, last_reset_date)
                VALUES (%s, 0, %s)
                ON CONFLICT (clerk_id) DO NOTHING
                """,
                (clerk_id, today_str),
            )

            # 2. Fetch current count
            cur.execute(
                "SELECT queries_used_today, last_reset_date FROM user_limits WHERE clerk_id = %s",
                (clerk_id,),
            )
            row = cur.fetchone()
            if not row:
                conn.commit()
                return True, daily_limit, daily_limit

            queries_used, last_reset = row

            # Reset count if it's a new day
            if str(last_reset) != today_str:
                cur.execute(
                    """
                    UPDATE user_limits
                    SET queries_used_today = 0, last_reset_date = %s
                    WHERE clerk_id = %s
                    """,
                    (today_str, clerk_id),
                )
                queries_used = 0

            # Pro Tier = Always Unlimited
            if user_tier == "pro":
                cur.execute(
                    "UPDATE user_limits SET queries_used_today = queries_used_today + 1 WHERE clerk_id = %s",
                    (clerk_id,),
                )
                conn.commit()
                return True, 9999, 9999

            # Free Tier = Cap at 10
            if queries_used >= FREE_DAILY_LIMIT:
                conn.commit()
                return False, 0, FREE_DAILY_LIMIT

            # Increment count
            cur.execute(
                "UPDATE user_limits SET queries_used_today = queries_used_today + 1 WHERE clerk_id = %s",
                (clerk_id,),
            )
            conn.commit()

            remaining = FREE_DAILY_LIMIT - (queries_used + 1)
            return True, max(remaining, 0), FREE_DAILY_LIMIT
    except Exception as exc:
        logger.warning(f"Rate-limit check error: {exc}")
        return True, daily_limit, daily_limit
