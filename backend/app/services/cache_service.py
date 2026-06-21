import json
import logging
from app.core.redis import get_redis_client
from app.services.aggregator import fetch_company_data

logger = logging.getLogger(__name__)

# 6 hours in seconds
COMPANY_CACHE_TTL = 6 * 60 * 60

async def get_company_profile(slug: str, company_name: str, ticker: str | None = None) -> dict:
    """
    Checks Redis cache for the company profile. 
    If miss, fetches from aggregator and stores in Redis.
    """
    redis = get_redis_client()
    cache_key = f"company:{slug}"
    
    try:
        cached_data = await redis.get(cache_key)
        if cached_data:
            logger.info(f"Cache HIT for {slug}")
            return json.loads(cached_data)
    except Exception as e:
        logger.error(f"Redis get error for {slug}: {e}")
        # Proceed to fetch if Redis fails
        
    logger.info(f"Cache MISS for {slug}, fetching from aggregator...")
    profile = await fetch_company_data(company_name, ticker)
    
    try:
        # Cache the result
        await redis.set(cache_key, json.dumps(profile), ex=COMPANY_CACHE_TTL)
    except Exception as e:
        logger.error(f"Redis set error for {slug}: {e}")
        
    return profile
