import asyncio

from backend.rate_limit.limiter import (
    GUEST_DAILY_LIMIT,
    REGISTERED_DAILY_LIMIT,
    check_and_increment,
)


def test_check_and_increment_falls_back_without_db_connection():
    allowed, remaining, limit = asyncio.run(check_and_increment(None, None))
    assert allowed is True
    assert remaining == GUEST_DAILY_LIMIT
    assert limit == GUEST_DAILY_LIMIT

    allowed, remaining, limit = asyncio.run(check_and_increment(None, "user-123"))
    assert allowed is True
    assert remaining == REGISTERED_DAILY_LIMIT
    assert limit == REGISTERED_DAILY_LIMIT
