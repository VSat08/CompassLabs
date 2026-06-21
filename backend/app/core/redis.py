import redis.asyncio as redis
from app.core.config import settings

# Global Redis instance
redis_client: redis.Redis | None = None

def get_redis_client() -> redis.Redis:
    """
    Get the global Redis client instance.
    Raises RuntimeError if it hasn't been initialized.
    """
    global redis_client
    if redis_client is None:
        raise RuntimeError("Redis Client is not initialized. Ensure startup event runs.")
    return redis_client

async def init_redis_client():
    """Initialize the global Redis connection pool."""
    global redis_client
    redis_client = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        socket_timeout=5.0,  # 5s timeout to prevent hanging
    )

async def close_redis_client():
    """Close the global Redis client."""
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None
