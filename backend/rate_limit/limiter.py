"""
Server-side rate limiting backed by PostgreSQL (user_limits table) and Server-side Guest IP tracking.
Single Source of Truth for Nexus AI Quota Enforcement.
"""

import logging
from datetime import timezone, datetime, timedelta
from typing import Tuple, Optional, Dict
import psycopg2.extensions

from backend.config import GUEST_DAILY_LIMIT, REGISTERED_FREE_DAILY_LIMIT, PRO_DAILY_LIMIT

logger = logging.getLogger(__name__)

# Indian Standard Time (IST) Timezone Definition (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_today_ist_str() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d")

# Server-side Guest IP rate tracking memory cache
# Key: (ip_address, date_str), Value: count
_GUEST_IP_CACHE: Dict[Tuple[str, str], int] = {}

def is_valid_uuid(val: str) -> bool:
    try:
        import uuid
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

def check_guest_ip_limit(client_ip: str) -> Tuple[bool, int, int]:
    """Server-side IP rate tracking for guest users (IST timezone reset)."""
    today_str = get_today_ist_str()
    cache_key = (client_ip or "127.0.0.1", today_str)

    # Clean up stale cache keys from previous days
    stale_keys = [k for k in _GUEST_IP_CACHE.keys() if k[1] != today_str]
    for k in stale_keys:
        _GUEST_IP_CACHE.pop(k, None)

    used = _GUEST_IP_CACHE.get(cache_key, 0)
    if used >= GUEST_DAILY_LIMIT:
        return False, 0, GUEST_DAILY_LIMIT

    _GUEST_IP_CACHE[cache_key] = used + 1
    remaining = GUEST_DAILY_LIMIT - (used + 1)
    return True, remaining, GUEST_DAILY_LIMIT

async def check_and_increment(
    conn: Optional[psycopg2.extensions.connection],
    clerk_id: Optional[str],
    user_tier: str = "free",
    client_ip: str = "127.0.0.1"
) -> Tuple[bool, int, int]:
    """
    Checks rate limit based on user tier in Indian Standard Time (IST).
    Guest = 5 queries/day.
    Free Registered = 30 queries/day.
    Pro Tier = Unlimited.
    """
    if not clerk_id or clerk_id == "guest":
        return check_guest_ip_limit(client_ip)

    daily_limit = PRO_DAILY_LIMIT if user_tier == "pro" else REGISTERED_FREE_DAILY_LIMIT

    if conn is None:
        return True, daily_limit, daily_limit

    try:
        today_str = get_today_ist_str()

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
                return True, PRO_DAILY_LIMIT, PRO_DAILY_LIMIT

            # Registered Free Tier = Cap at REGISTERED_FREE_DAILY_LIMIT (30)
            if queries_used >= REGISTERED_FREE_DAILY_LIMIT:
                conn.commit()
                return False, 0, REGISTERED_FREE_DAILY_LIMIT

            # Increment count
            cur.execute(
                "UPDATE user_limits SET queries_used_today = queries_used_today + 1 WHERE clerk_id = %s",
                (clerk_id,),
            )
            conn.commit()

            remaining = REGISTERED_FREE_DAILY_LIMIT - (queries_used + 1)
            return True, max(remaining, 0), REGISTERED_FREE_DAILY_LIMIT
    except Exception as exc:
        logger.warning(f"Rate-limit check error: {exc}")
        return True, daily_limit, daily_limit
