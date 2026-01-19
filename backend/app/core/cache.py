import redis.asyncio as aioredis
from typing import Optional, Any
import json
from app.config import settings

# Redis connection pool
redis_pool = None


async def get_redis() -> aioredis.Redis:
    """Get Redis connection from pool"""
    global redis_pool
    if redis_pool is None:
        redis_pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=50
        )
    return aioredis.Redis(connection_pool=redis_pool)


async def close_redis():
    """Close Redis connection pool"""
    global redis_pool
    if redis_pool:
        await redis_pool.disconnect()


class Cache:
    """Redis cache utility class"""
    
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Get value from cache"""
        redis = await get_redis()
        value = await redis.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None
    
    @staticmethod
    async def set(key: str, value: Any, expire: int = 3600) -> bool:
        """Set value in cache with expiration (default 1 hour)"""
        redis = await get_redis()
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await redis.setex(key, expire, value)
    
    @staticmethod
    async def delete(key: str) -> bool:
        """Delete key from cache"""
        redis = await get_redis()
        return await redis.delete(key) > 0
    
    @staticmethod
    async def exists(key: str) -> bool:
        """Check if key exists in cache"""
        redis = await get_redis()
        return await redis.exists(key) > 0
    
    @staticmethod
    async def increment(key: str, amount: int = 1) -> int:
        """Increment counter"""
        redis = await get_redis()
        return await redis.incrby(key, amount)
    
    @staticmethod
    async def expire(key: str, seconds: int) -> bool:
        """Set expiration on key"""
        redis = await get_redis()
        return await redis.expire(key, seconds)
    
    @staticmethod
    async def get_many(pattern: str) -> dict:
        """Get multiple keys matching pattern"""
        redis = await get_redis()
        keys = await redis.keys(pattern)
        if not keys:
            return {}
        
        values = await redis.mget(keys)
        result = {}
        for key, value in zip(keys, values):
            if value:
                try:
                    result[key] = json.loads(value)
                except json.JSONDecodeError:
                    result[key] = value
        return result
    
    @staticmethod
    async def delete_pattern(pattern: str) -> int:
        """Delete all keys matching pattern"""
        redis = await get_redis()
        keys = await redis.keys(pattern)
        if keys:
            return await redis.delete(*keys)
        return 0


# Session management
class SessionCache:
    """User session management with Redis"""
    
    @staticmethod
    def _session_key(user_id: str) -> str:
        return f"session:{user_id}"
    
    @staticmethod
    async def create_session(user_id: str, session_data: dict, expire: int = 86400) -> bool:
        """Create user session (default 24 hours)"""
        key = SessionCache._session_key(user_id)
        return await Cache.set(key, session_data, expire)
    
    @staticmethod
    async def get_session(user_id: str) -> Optional[dict]:
        """Get user session data"""
        key = SessionCache._session_key(user_id)
        return await Cache.get(key)
    
    @staticmethod
    async def delete_session(user_id: str) -> bool:
        """Delete user session"""
        key = SessionCache._session_key(user_id)
        return await Cache.delete(key)
    
    @staticmethod
    async def refresh_session(user_id: str, expire: int = 86400) -> bool:
        """Refresh session expiration"""
        key = SessionCache._session_key(user_id)
        return await Cache.expire(key, expire)
